# RIVA — React Frontend Integration Guide

## Base URL

```
http://localhost:8080
```

> For production, replace with your deployed host. CORS is pre-configured to accept any origin.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actuator/health` | Health check |
| `POST` | `/api/sessions` | Create / retrieve a user session |
| `POST` | `/api/chat/messages` | Send a message — streams AI response as SSE |
| `GET` | `/api/chat/{caseId}/messages?userId=` | Load chat history for a case |

---

## 1. Types (TypeScript)

```ts
// api/riva.types.ts

export interface CreateSessionRequest {
  userId: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  userId: string;
}

export interface ChatMessageRequest {
  userId: string;
  caseId: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status: "PENDING" | "STREAMING" | "COMPLETED" | "ERROR";
  createdAt: string; // ISO-8601
}

export interface ChatHistoryResponse {
  caseId: string;
  messages: ChatMessage[];
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
```

---

## 2. API Client

```ts
// api/riva.client.ts

const BASE_URL = "http://localhost:8080";

export async function createSession(userId: string) {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // CreateSessionResponse
}

export async function getChatHistory(caseId: string, userId: string) {
  const res = await fetch(
    `${BASE_URL}/api/chat/${caseId}/messages?userId=${encodeURIComponent(userId)}`
  );
  if (!res.ok) throw await res.json();
  return res.json() as Promise<ChatHistoryResponse>;
}

/**
 * Streams AI response tokens via SSE.
 * onChunk   — called for each text token streamed
 * onDone    — called when the stream completes
 * onError   — called on network / server error
 * Returns a cleanup function to abort the stream.
 */
export function streamChat(
  request: ChatMessageRequest,
  onChunk: (token: string) => void,
  onDone: () => void,
  onError: (err: unknown) => void
): () => void {
  const controller = new AbortController();

  fetch(`${BASE_URL}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        onError(err);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const token = line.slice(5); // strip "data:" prefix
            onChunk(token);
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err);
    });

  return () => controller.abort();
}
```

---

## 3. React Hook — `useRivaChat`

```tsx
// hooks/useRivaChat.ts
import { useState, useCallback, useRef } from "react";
import { streamChat, getChatHistory } from "../api/riva.client";
import type { ChatMessage, ChatMessageRequest } from "../api/riva.types";

export function useRivaChat(userId: string, caseId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  // Load existing history for the case
  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory(caseId, userId);
      setMessages(history.messages);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load history");
    }
  }, [caseId, userId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (streaming) return;
      setError(null);

      // Optimistic: add user message immediately
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "USER",
        content: text,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      };

      // Placeholder for streaming assistant response
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "ASSISTANT",
        content: "",
        status: "STREAMING",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const request: ChatMessageRequest = { userId, caseId, message: text };

      abortRef.current = streamChat(
        request,
        (token) => {
          // Append each token to the assistant message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        () => {
          // Stream complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, status: "COMPLETED" } : m
            )
          );
          setStreaming(false);
        },
        (err: any) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, status: "ERROR", content: "Failed to get response." }
                : m
            )
          );
          setError(err?.message ?? "Stream error");
          setStreaming(false);
        }
      );
    },
    [caseId, userId, streaming]
  );

  const stopStream = useCallback(() => {
    abortRef.current?.();
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, loadHistory, stopStream };
}
```

---

## 4. Chat UI Component

```tsx
// components/RivaChat.tsx
import { useEffect, useRef, useState } from "react";
import { useRivaChat } from "../hooks/useRivaChat";

interface Props {
  userId: string;
  caseId: string;
}

export function RivaChat({ userId, caseId }: Props) {
  const { messages, streaming, error, sendMessage, loadHistory, stopStream } =
    useRivaChat(userId, caseId);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history on mount / case change
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "1rem",
              textAlign: msg.role === "USER" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "75%",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                background: msg.role === "USER" ? "#0ea5e9" : "#f1f5f9",
                color: msg.role === "USER" ? "#fff" : "#0f172a",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
              {msg.status === "STREAMING" && (
                <span style={{ opacity: 0.5 }}> ▌</span>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div style={{ color: "red", fontSize: "0.875rem" }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "1rem", borderTop: "1px solid #e2e8f0" }}>
        <input
          style={{ flex: 1, padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask RIVA about this case..."
          disabled={streaming}
        />
        {streaming ? (
          <button onClick={stopStream} style={{ padding: "0.5rem 1rem" }}>
            Stop
          </button>
        ) : (
          <button onClick={handleSend} style={{ padding: "0.5rem 1rem" }}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 5. Usage in a Case Detail Page

```tsx
// pages/CaseDetail.tsx
import { RivaChat } from "../components/RivaChat";

export function CaseDetailPage() {
  const userId = "analyst1";          // from your auth context
  const caseId = "d99c9cc0-7f4a-4318-aaa4-b3bc2f618337"; // from route params

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh" }}>
      {/* Left: your existing case detail UI */}
      <div>
        <h2>Case {caseId}</h2>
        {/* ... transaction table, timeline, etc. */}
      </div>

      {/* Right: RIVA chat panel */}
      <div style={{ borderLeft: "1px solid #e2e8f0" }}>
        <h3 style={{ padding: "1rem", margin: 0 }}>RIVA Assistant</h3>
        <RivaChat userId={userId} caseId={caseId} />
      </div>
    </div>
  );
}
```

---

## 6. Error Handling Reference

| HTTP Status | Meaning | What to show |
|-------------|---------|--------------|
| `400` | Missing / invalid field in request | Inline field validation error |
| `404` | Case or session not found | "Case not found" toast |
| `502` | Case service at `:7051` is down | "Could not fetch case data, try again" |
| `500` | Unexpected server error | Generic error toast |

Error response body shape:
```json
{
  "status": 502,
  "error": "External Service Error",
  "message": "...",
  "timestamp": "2026-05-25T13:00:00Z"
}
```

---

## 7. Environment Variable (React / Vite)

```env
# .env
VITE_RIVA_BASE_URL=http://localhost:8080
```

```ts
const BASE_URL = import.meta.env.VITE_RIVA_BASE_URL;
```

---

## 8. CORS

CORS is already configured on the backend — all origins are allowed on `/api/**`. No proxy setup needed in development.
