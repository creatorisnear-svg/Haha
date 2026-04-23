const TYPING_TTL_MS = 4000;

interface TypingState {
  admin: number;
  customer: number;
}

const typing = new Map<string, TypingState>();

function getOrInit(conversationId: string): TypingState {
  let s = typing.get(conversationId);
  if (!s) {
    s = { admin: 0, customer: 0 };
    typing.set(conversationId, s);
  }
  return s;
}

export function markTyping(conversationId: string, who: "admin" | "customer") {
  const s = getOrInit(conversationId);
  s[who] = Date.now();
}

export function getTyping(conversationId: string): { admin: boolean; customer: boolean } {
  const s = typing.get(conversationId);
  if (!s) return { admin: false, customer: false };
  const now = Date.now();
  return {
    admin: now - s.admin < TYPING_TTL_MS,
    customer: now - s.customer < TYPING_TTL_MS,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, s] of typing.entries()) {
    if (now - s.admin > TYPING_TTL_MS && now - s.customer > TYPING_TTL_MS) {
      typing.delete(k);
    }
  }
}, 30_000).unref?.();
