import { Router } from "express";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";
import { adminAuthMiddleware } from "../auth";
import { rateLimit } from "../lib/rateLimit";

const router = Router();

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SAFE_SECRET: string = SECRET;

const MAX_MESSAGE_LEN = 2000;
const QUICK_TOPICS = new Set([
  "general",
  "returns",
  "refunds",
  "shipping",
  "order_status",
  "sizing",
  "other",
]);

function signGuest(conversationId: string): string {
  return crypto
    .createHmac("sha256", SAFE_SECRET)
    .update(`chat:${conversationId}`)
    .digest("hex");
}

function verifyGuest(conversationId: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = signGuest(conversationId);
  try {
    const a = Buffer.from(token, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function clean(s: any): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, 200);
}

function cleanBody(s: any): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, MAX_MESSAGE_LEN);
}

function serializeMessage(doc: any) {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId,
    sender: doc.sender, // "customer" | "admin"
    senderName: doc.senderName ?? null,
    body: doc.body,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

function serializeConversation(doc: any) {
  return {
    id: doc._id.toString(),
    customerName: doc.customerName ?? "Guest",
    customerEmail: doc.customerEmail ?? null,
    customerId: doc.customerId ?? null,
    topic: doc.topic ?? "general",
    status: doc.status ?? "open",
    lastMessageAt: doc.lastMessageAt instanceof Date ? doc.lastMessageAt.toISOString() : doc.lastMessageAt,
    lastMessagePreview: doc.lastMessagePreview ?? "",
    unreadByAdmin: !!doc.unreadByAdmin,
    unreadByCustomer: !!doc.unreadByCustomer,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

const startLimiter = rateLimit({
  bucket: "chat-start",
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: "Too many chat sessions started. Please wait before trying again.",
});

const messageLimiter = rateLimit({
  bucket: "chat-message",
  max: 60,
  windowMs: 5 * 60 * 1000,
  message: "Too many messages. Please slow down.",
});

// ── Customer: start (or resume) a conversation ──────────────────────────────
router.post("/chat/start", startLimiter, async (req, res) => {
  try {
    const db = await getDb();
    const name = clean(req.body?.name) || "Guest";
    const email = clean(req.body?.email).toLowerCase() || null;
    const rawTopic = clean(req.body?.topic).toLowerCase();
    const topic = QUICK_TOPICS.has(rawTopic) ? rawTopic : "general";
    const initialMessage = cleanBody(req.body?.message);

    const now = new Date();
    const result = await db.collection("chat_conversations").insertOne({
      customerName: name,
      customerEmail: email,
      customerId: null,
      topic,
      status: "open",
      createdAt: now,
      lastMessageAt: now,
      lastMessagePreview: initialMessage ? initialMessage.slice(0, 120) : "",
      unreadByAdmin: !!initialMessage,
      unreadByCustomer: false,
    });
    const conversationId = result.insertedId.toString();

    if (initialMessage) {
      await db.collection("chat_messages").insertOne({
        conversationId,
        sender: "customer",
        senderName: name,
        body: initialMessage,
        createdAt: now,
      });
    }

    res.json({
      conversationId,
      guestToken: signGuest(conversationId),
      topic,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to start chat" });
  }
});

// ── Customer: send a message ────────────────────────────────────────────────
router.post("/chat/:id/message", messageLimiter, async (req, res) => {
  const conversationId = req.params.id;
  const guestToken = (req.headers["x-chat-token"] as string | undefined) ?? "";
  if (!verifyGuest(conversationId, guestToken)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const body = cleanBody(req.body?.body);
  if (!body) return res.status(400).json({ error: "Message is required" });

  try {
    const db = await getDb();
    const _id = new ObjectId(conversationId);
    const conv = await db.collection("chat_conversations").findOne({ _id });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const now = new Date();
    const senderName = conv.customerName ?? "Guest";
    const insert = await db.collection("chat_messages").insertOne({
      conversationId,
      sender: "customer",
      senderName,
      body,
      createdAt: now,
    });

    await db.collection("chat_conversations").updateOne(
      { _id },
      {
        $set: {
          lastMessageAt: now,
          lastMessagePreview: body.slice(0, 120),
          unreadByAdmin: true,
          status: "open",
        },
      },
    );

    res.json({
      message: serializeMessage({
        _id: insert.insertedId,
        conversationId,
        sender: "customer",
        senderName,
        body,
        createdAt: now,
      }),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Customer: poll messages ─────────────────────────────────────────────────
router.get("/chat/:id/messages", async (req, res) => {
  const conversationId = req.params.id;
  const guestToken = (req.headers["x-chat-token"] as string | undefined) ?? "";
  if (!verifyGuest(conversationId, guestToken)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const db = await getDb();
    const since = req.query.since ? new Date(String(req.query.since)) : null;
    const filter: any = { conversationId };
    if (since && !isNaN(since.getTime())) {
      filter.createdAt = { $gt: since };
    }
    const docs = await db
      .collection("chat_messages")
      .find(filter)
      .sort({ createdAt: 1 })
      .limit(200)
      .toArray();

    // Mark as read by customer
    await db
      .collection("chat_conversations")
      .updateOne({ _id: new ObjectId(conversationId) }, { $set: { unreadByCustomer: false } });

    res.json({ messages: docs.map(serializeMessage) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// ── Admin: list conversations ───────────────────────────────────────────────
router.get("/admin/chat/conversations", adminAuthMiddleware, async (_req, res) => {
  try {
    const db = await getDb();
    const docs = await db
      .collection("chat_conversations")
      .find()
      .sort({ lastMessageAt: -1 })
      .limit(200)
      .toArray();
    res.json({ conversations: docs.map(serializeConversation) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// ── Admin: get conversation messages ────────────────────────────────────────
router.get("/admin/chat/:id/messages", adminAuthMiddleware, async (req, res) => {
  const conversationId = req.params.id;
  try {
    const db = await getDb();
    const _id = new ObjectId(conversationId);
    const conv = await db.collection("chat_conversations").findOne({ _id });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const docs = await db
      .collection("chat_messages")
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(500)
      .toArray();

    await db.collection("chat_conversations").updateOne({ _id }, { $set: { unreadByAdmin: false } });

    res.json({
      conversation: serializeConversation(conv),
      messages: docs.map(serializeMessage),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// ── Admin: send a reply ─────────────────────────────────────────────────────
router.post("/admin/chat/:id/message", adminAuthMiddleware, async (req, res) => {
  const conversationId = req.params.id;
  const body = cleanBody(req.body?.body);
  if (!body) return res.status(400).json({ error: "Message is required" });
  try {
    const db = await getDb();
    const _id = new ObjectId(conversationId);
    const conv = await db.collection("chat_conversations").findOne({ _id });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const now = new Date();
    const insert = await db.collection("chat_messages").insertOne({
      conversationId,
      sender: "admin",
      senderName: "Support",
      body,
      createdAt: now,
    });

    await db.collection("chat_conversations").updateOne(
      { _id },
      {
        $set: {
          lastMessageAt: now,
          lastMessagePreview: body.slice(0, 120),
          unreadByCustomer: true,
          unreadByAdmin: false,
          status: "open",
        },
      },
    );

    res.json({
      message: serializeMessage({
        _id: insert.insertedId,
        conversationId,
        sender: "admin",
        senderName: "Support",
        body,
        createdAt: now,
      }),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// ── Admin: close / reopen / delete a conversation ───────────────────────────
router.post("/admin/chat/:id/close", adminAuthMiddleware, async (req, res) => {
  const conversationId = req.params.id;
  try {
    const db = await getDb();
    await db
      .collection("chat_conversations")
      .updateOne({ _id: new ObjectId(conversationId) }, { $set: { status: "closed" } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to close conversation" });
  }
});

router.post("/admin/chat/:id/reopen", adminAuthMiddleware, async (req, res) => {
  const conversationId = req.params.id;
  try {
    const db = await getDb();
    await db
      .collection("chat_conversations")
      .updateOne({ _id: new ObjectId(conversationId) }, { $set: { status: "open" } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reopen conversation" });
  }
});

router.delete("/admin/chat/:id", adminAuthMiddleware, async (req, res) => {
  const conversationId = req.params.id;
  try {
    const db = await getDb();
    await db.collection("chat_conversations").deleteOne({ _id: new ObjectId(conversationId) });
    await db.collection("chat_messages").deleteMany({ conversationId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;
