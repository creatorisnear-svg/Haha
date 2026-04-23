import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "vaa_chat_session_v1";

type Topic = "general" | "returns" | "refunds" | "shipping" | "order_status" | "sizing" | "other";

interface QuickAction {
  topic: Topic;
  label: string;
  prompt: string;
  hint: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    topic: "order_status",
    label: "Track my order",
    hint: "Get an update on where your order is.",
    prompt: "Hi! Can you give me an update on my order? My order number is ",
  },
  {
    topic: "returns",
    label: "Returns",
    hint: "Send back unopened items within 14 days.",
    prompt:
      "Hi! I'd like to return an item from my order. My order number is ",
  },
  {
    topic: "refunds",
    label: "Refunds",
    hint: "Issues with a never-delivered or damaged order.",
    prompt: "Hi! I need help with a refund. My order number is ",
  },
  {
    topic: "shipping",
    label: "Shipping",
    hint: "Delivery times, fees, or address changes.",
    prompt: "Hi! I have a question about shipping: ",
  },
  {
    topic: "sizing",
    label: "Sizing help",
    hint: "Not sure what size to pick? We'll help.",
    prompt: "Hi! I'd like some help picking the right size for ",
  },
  {
    topic: "general",
    label: "Something else",
    hint: "Talk to a real person about anything.",
    prompt: "",
  },
];

interface Message {
  id: string;
  sender: "customer" | "admin";
  senderName: string | null;
  body: string;
  createdAt: string;
}

interface Session {
  conversationId: string;
  guestToken: string;
  topic: Topic;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

export function ChatBubble() {
  const { customer } = useAuth();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [pendingTopic, setPendingTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const lastSeenRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastTypingPingRef = useRef<number>(0);

  // Keep name/email in sync if user logs in mid-session.
  useEffect(() => {
    if (customer?.name && !name) setName(customer.name);
    if (customer?.email && !email) setEmail(customer.email);
  }, [customer?.name, customer?.email]);

  // Poll for new messages whenever there is a session (every 5s when closed,
  // every 2.5s when open).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const url = new URL(
          `${window.location.origin}/api/chat/${session.conversationId}/messages`,
        );
        if (lastSeenRef.current) url.searchParams.set("since", lastSeenRef.current);
        const res = await fetch(url.toString().replace(window.location.origin, ""), {
          headers: { "X-Chat-Token": session.guestToken },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            saveSession(null);
            if (!cancelled) {
              setSession(null);
              setMessages([]);
              lastSeenRef.current = null;
            }
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setAdminTyping(!!data.typing?.admin);
        }
        const fresh: Message[] = data.messages ?? [];
        if (fresh.length === 0) return;
        if (!cancelled) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const merged = [...prev, ...fresh.filter((m) => !seen.has(m.id))];
            return merged;
          });
          lastSeenRef.current = fresh[fresh.length - 1].createdAt;
          if (!open && fresh.some((m) => m.sender === "admin")) {
            setHasUnread(true);
          }
        }
      } catch {
        // Network errors are non-fatal for polling.
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, open ? 2500 : 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session, open]);

  // Scroll to the bottom of the message list as messages arrive.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, open, adminTyping]);

  // Ping the server (debounced to once every 2s) while the customer is typing
  // so the admin sees a live indicator on their end.
  const pingTyping = () => {
    if (!session) return;
    const now = Date.now();
    if (now - lastTypingPingRef.current < 2000) return;
    lastTypingPingRef.current = now;
    fetch(`/api/chat/${session.conversationId}/typing`, {
      method: "POST",
      headers: { "X-Chat-Token": session.guestToken },
    }).catch(() => {});
  };

  // Clear unread badge when the user opens the chat.
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  const startNewConversation = async (topic: Topic, prefilled?: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || (customer?.name ?? "Guest"),
          email: email || customer?.email || null,
          topic,
          message: prefilled ?? "",
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? "Could not start chat");
      }
      const data = await res.json();
      const newSession: Session = {
        conversationId: data.conversationId,
        guestToken: data.guestToken,
        topic: data.topic,
      };
      saveSession(newSession);
      setSession(newSession);
      setMessages([]);
      lastSeenRef.current = null;
      setPendingTopic(null);
      setDraft("");
    } catch (e: any) {
      setError(e?.message ?? "Could not start chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (body: string) => {
    if (!session || !body.trim()) return;
    setError(null);
    const trimmed = body.trim();
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender: "customer",
      senderName: name || "You",
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch(`/api/chat/${session.conversationId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Token": session.guestToken,
        },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? "Could not send message");
      }
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m)),
      );
      lastSeenRef.current = data.message.createdAt;
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(e?.message ?? "Could not send message");
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (session) {
      // Already in a conversation: just prefill the draft.
      setDraft((prev) => (prev ? prev : action.prompt));
      return;
    }
    if (!action.prompt) {
      setPendingTopic(action.topic);
      return;
    }
    setPendingTopic(action.topic);
    setDraft(action.prompt);
  };

  const handleStartFromForm = async () => {
    if (!pendingTopic) return;
    await startNewConversation(pendingTopic, draft);
  };

  const endConversation = () => {
    saveSession(null);
    setSession(null);
    setMessages([]);
    setDraft("");
    lastSeenRef.current = null;
    setPendingTopic(null);
  };

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((v) => !v)}
        className="group fixed bottom-5 right-5 z-[80] flex items-center gap-2 pl-4 pr-5 py-3 rounded-full text-white font-display tracking-widest text-xs uppercase shadow-[0_10px_30px_-5px_rgba(220,38,38,0.55)] hover:shadow-[0_15px_40px_-5px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 bg-[linear-gradient(135deg,#dc2626_0%,#7f1d1d_55%,#000_100%)] ring-1 ring-white/10 hover:ring-white/20 overflow-hidden"
        data-testid="chat-bubble-toggle"
      >
        {/* shimmer sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.18)_50%,transparent_75%)]"
        />
        {/* pulsing halo when there's an unread admin message */}
        {!open && hasUnread && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-red-500/70 animate-ping"
          />
        )}
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
          {open ? (
            <X className="h-4 w-4" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
        </span>
        <span className="relative whitespace-nowrap">
          {open ? "Close" : hasUnread ? "New reply" : "Chat with us"}
        </span>
        {!open && hasUnread && (
          <span className="relative ml-1 h-2 w-2 rounded-full bg-red-300 ring-2 ring-red-500/40" />
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-[80] w-[min(360px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-7rem))] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-label="Support chat"
        >
          <header className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-2">
              {(session || pendingTopic) && (
                <button
                  type="button"
                  onClick={() => {
                    if (pendingTopic && !session) {
                      setPendingTopic(null);
                      setDraft("");
                    } else {
                      // collapse panel back to thread; provide End to fully close
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Back"
                >
                  {pendingTopic && !session ? <ArrowLeft className="h-4 w-4" /> : null}
                </button>
              )}
              <div>
                <p className="font-display tracking-widest text-sm uppercase">
                  Support
                </p>
                <p className="text-xs text-muted-foreground">
                  {session
                    ? "We typically reply within a few hours."
                    : "Pick a topic or message us."}
                </p>
              </div>
            </div>
            {session && (
              <button
                type="button"
                onClick={endConversation}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                End chat
              </button>
            )}
          </header>

          {/* Quick actions are always visible at the top when not in a pending form */}
          {!pendingTopic && (
            <div className="px-3 pt-3 pb-2 border-b border-border bg-card/20">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
                Quick help
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.topic + a.label}
                    type="button"
                    onClick={() => handleQuickAction(a)}
                    className="text-left rounded-lg border border-border bg-background hover:border-primary/60 hover:bg-card transition px-3 py-2"
                  >
                    <p className="text-xs font-medium">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {a.hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending start form (no conversation yet, user picked a topic) */}
          {!session && pendingTopic && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Guest"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email (so we can follow up)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Message
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                  placeholder="How can we help?"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="button"
                disabled={loading || !draft.trim()}
                onClick={handleStartFromForm}
                className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-display tracking-widest uppercase disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send message"}
              </button>
            </div>
          )}

          {/* Active conversation thread */}
          {session && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && !adminTyping ? (
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    Send a message and we'll get back to you here.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender === "customer";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {!mine && (
                            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                              {m.senderName ?? "Support"}
                            </p>
                          )}
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
                        Support
                      </p>
                      <span className="inline-flex items-center gap-1" aria-label="Support is typing">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-bounce [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-bounce [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-bounce" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {error && (
                <p className="px-3 pb-1 text-xs text-red-500">{error}</p>
              )}
              <form
                className="border-t border-border p-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(draft);
                }}
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    pingTyping();
                  }}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Write a message..."
                  data-testid="chat-input"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-md bg-primary text-primary-foreground px-3 disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
