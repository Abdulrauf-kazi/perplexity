import { BACKEND_URL } from "./config";

export interface ConversationSummary {
  id: string;
  slug: string;
  title: string | null;
}

export interface Message {
  id: number;
  content: string;
  role: "User" | "Assistance";
  conversatoinId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  slug: string;
  userId: string;
  messages: Message[];
}

export interface ParsedResponse {
  answer: string;
  sources: { url: string }[];
  followUps: string[];
}

function authHeaders(token: string) {
  return { Authorization: token };
}

export async function fetchConversations(token: string): Promise<ConversationSummary[]> {
  const res = await fetch(`${BACKEND_URL}/conversations`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  return data.conversatoins ?? [];
}

export async function fetchConversation(token: string, id: string): Promise<Conversation | null> {
  const res = await fetch(`${BACKEND_URL}/conversation/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.conversation;
}

export async function deleteConversation(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/conversation/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return res.ok;
}

export async function streamAsk(
  token: string,
  query: string,
  onChunk: (text: string) => void,
  onDone: (parsed: ParsedResponse) => void,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/perplexity_ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ query }),
  });

  await readStream(res, onChunk, onDone);
}

export async function streamFollowUp(
  token: string,
  conversationId: string,
  query: string,
  onChunk: (text: string) => void,
  onDone: (parsed: ParsedResponse) => void,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/perplexity_ask/followup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ conversationId, query }),
  });

  await readStream(res, onChunk, onDone);
}

async function readStream(
  res: Response,
  onChunk: (text: string) => void,
  onDone: (parsed: ParsedResponse) => void,
) {
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // Only stream the answer portion (before <SOURCES>)
    const sourcesIdx = fullText.indexOf("\n<SOURCES>\n");
    const displayText = sourcesIdx >= 0 ? fullText.slice(0, sourcesIdx) : fullText;
    onChunk(displayText);
  }

  onDone(parseResponse(fullText));
}

export function parseResponse(raw: string): ParsedResponse {
  let answer = raw;
  let sources: { url: string }[] = [];
  const followUps: string[] = [];

  // Extract <SOURCES>...</SOURCES>
  const sourcesMatch = raw.match(/<SOURCES>\s*([\s\S]*?)\s*<\/SOURCES>/);
  if (sourcesMatch?.[1]) {
    try {
      sources = JSON.parse(sourcesMatch[1]);
    } catch {
      // ignore parse errors
    }
    answer = raw.slice(0, raw.indexOf("\n<SOURCES>"));
  }

  // Extract <ANSWER>...</ANSWER> if present
  const answerMatch = answer.match(/<ANSWER>\s*([\s\S]*?)\s*<\/ANSWER>/);
  if (answerMatch?.[1]) {
    answer = answerMatch[1].trim();
  }

  // Extract <FOLLOW_UPS>...</FOLLOW_UPS>
  const followUpsMatch = raw.match(/<FOLLOW_UPS>\s*([\s\S]*?)\s*<\/FOLLOW_UPS>/);
  if (followUpsMatch?.[1]) {
    const questions = followUpsMatch[1].matchAll(/<question>\s*(.*?)\s*<\/question>/g);
    for (const q of questions) {
      if (q[1]) followUps.push(q[1].trim());
    }
    // Remove the follow-ups block from the answer
    answer = answer.replace(/<FOLLOW_UPS>[\s\S]*?<\/FOLLOW_UPS>/, "").trim();
  }

  return { answer, sources, followUps };
}
