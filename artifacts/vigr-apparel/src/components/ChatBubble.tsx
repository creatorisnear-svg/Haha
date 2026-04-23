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

// Lightweight keyword-based topic detection. Returns null when nothing
// jumps out (so we don't override the user's intent).
function detectTopic(text: string): Topic | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;
  // Order tracking — order numbers or explicit tracking words
  if (
    /\b(track(ing)?|where('?s| is) my order|ship(ped|ping) status|wism[oy])\b/.test(t) ||
    /\b(order|tracking)\s*(number|#|no\.?)?\s*[:#]?\s*[a-z0-9-]{4,}\b/.test(t)
  ) {
    return "order_status";
  }
  if (/\brefund(ed|s)?\b|\bmoney back\b|\bcharge ?back\b/.test(t)) return "refunds";
  if (/\breturn(s|ing|ed)?\b|\bsend (it )?back\b|\bexchange\b/.test(t)) return "returns";
  if (
    /\b(ship(ping)?|deliver(y|ed)?|arrive(s|d)?|address|postage|courier|usps|ups|fedex|dhl)\b/.test(
      t,
    )
  ) {
    return "shipping";
  }
  if (/\b(size|sizing|fit|fits|small|medium|large|xl|xxl|measurement)\b/.test(t)) return "sizing";
  return null;
}

function topicLabel(t: Topic): string {
  return QUICK_ACTIONS.find((a) => a.topic === t)?.label ?? "this";
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
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcriptEmail, setTranscriptEmail] = useState("");
  const [transcriptSending, setTranscriptSending] = useState(false);
  const [transcriptStatus, setTranscriptStatus] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [topicManuallySet, setTopicManuallySet] = useState(false);
  const lastSeenRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastTypingPingRef = useRef<number>(0);

  // Auto-detect topic from the draft and quietly apply it unless the user
  // has manually picked one already.
  const suggestedTopic = detectTopic(draft);
  useEffect(() => {
    if (topicManuallySet) return;
    if (!session && suggestedTopic && suggestedTopic !== pendingTopic) {
      setPendingTopic(suggestedTopic);
    }
  }, [suggestedTopic, session, topicManuallySet, pendingTopic]);

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

  const handleQuickAction = async (action: QuickAction) => {
    setTopicManuallySet(true);
    if (session) {
      // Re-tag the existing conversation with the chosen topic.
      if (action.topic !== session.topic) {
        try {
          await fetch(`/api/chat/${session.conversationId}/topic`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-Chat-Token": session.guestToken,
            },
            body: JSON.stringify({ topic: action.topic }),
          });
          const updated = { ...session, topic: action.topic };
          saveSession(updated);
          setSession(updated);
        } catch {}
      }
      if (action.prompt) {
        setDraft((prev) => (prev ? prev : action.prompt));
      }
      return;
    }
    // No session yet: just remember the topic + prefill the draft.
    setPendingTopic(action.topic);
    if (action.prompt) {
      setDraft((prev) => (prev ? prev : action.prompt));
    }
  };

  const handleSendOrStart = async () => {
    if (!draft.trim()) return;
    if (session) {
      sendMessage(draft);
    } else {
      await startNewConversation(pendingTopic ?? "general", draft);
    }
  };

  const endConversation = () => {
    saveSession(null);
    setSession(null);
    setMessages([]);
    setDraft("");
    lastSeenRef.current = null;
    setPendingTopic(null);
    setTranscriptOpen(false);
    setTranscriptStatus(null);
    setTopicManuallySet(false);
  };

  const openTranscript = () => {
    setTranscriptEmail(email || customer?.email || "");
    setTranscriptStatus(null);
    setTranscriptOpen(true);
  };

  const sendTranscript = async () => {
    if (!session) return;
    const target = transcriptEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setTranscriptStatus({ type: "error", text: "Enter a valid email address." });
      return;
    }
    setTranscriptSending(true);
    setTranscriptStatus(null);
    try {
      const res = await fetch(`/api/chat/${session.conversationId}/transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Token": session.guestToken,
        },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTranscriptStatus({
          type: "error",
          text: data?.error ?? "Couldn't send transcript.",
        });
      } else {
        setTranscriptStatus({
          type: "success",
          text: `Sent to ${data.sentTo ?? target}. Check your inbox.`,
        });
      }
    } catch {
      setTranscriptStatus({ type: "error", text: "Network error. Try again." });
    } finally {
      setTranscriptSending(false);
    }
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openTranscript}
                  disabled={messages.length === 0}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Email transcript
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={endConversation}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  End chat
                </button>
              </div>
            )}
          </header>

          {session && transcriptOpen && (
            <div className="border-b border-border bg-card/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Email me a transcript
                </p>
                <button
                  type="button"
                  onClick={() => setTranscriptOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Close transcript form"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={transcriptEmail}
                  onChange={(e) => setTranscriptEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={sendTranscript}
                  disabled={transcriptSending || !transcriptEmail.trim()}
                  className="rounded-md bg-primary text-primary-foreground px-3 text-sm disabled:opacity-50"
                >
                  {transcriptSending ? "Sending…" : "Send"}
                </button>
              </div>
              {transcriptStatus && (
                <p
                  className={`text-xs ${
                    transcriptStatus.type === "success"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {transcriptStatus.text}
                </p>
              )}
            </div>
          )}

          {/* Quick help chips: select a topic before or after starting the chat */}
          <div className="px-3 pt-3 pb-2 border-b border-border bg-card/20">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
              {session ? "Topic" : "Optional · pick a topic"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => {
                const activeTopic = session ? session.topic : pendingTopic;
                const selected = activeTopic === a.topic;
                return (
                  <button
                    key={a.topic + a.label}
                    type="button"
                    onClick={() => handleQuickAction(a)}
                    title={a.hint}
                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/60 hover:bg-card text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guest contact fields shown only before a session exists and user isn't signed in */}
          {!session && !customer && (
            <div className="px-3 py-2 border-b border-border grid grid-cols-2 gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                placeholder="Your name (optional)"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                placeholder="Email (for follow-up)"
              />
            </div>
          )}

          {/* Conversation thread */}
          <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && !adminTyping ? (
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    {session
                      ? "Send a message and we'll get back to you here."
                      : "Type a message below to start. We typically reply within a few hours."}
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
              {session && suggestedTopic && suggestedTopic !== session.topic && (
                <div className="px-3 pb-1 text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>Sounds like this is about {topicLabel(suggestedTopic)}.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const action = QUICK_ACTIONS.find((a) => a.topic === suggestedTopic);
                      if (action) handleQuickAction({ ...action, prompt: "" });
                    }}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Switch topic
                  </button>
                </div>
              )}
              <form
                className="border-t border-border p-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOrStart();
                }}
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (session) pingTyping();
                  }}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder={session ? "Write a message..." : "Type a message to start..."}
                  data-testid="chat-input"
                />
                <button
                  type="submit"
                  disabled={loading || !draft.trim()}
                  className="rounded-md bg-primary text-primary-foreground px-3 disabled:opacity-50"
                  aria-label={session ? "Send" : "Start chat"}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
        </div>
      )}
    </>
  );
}
