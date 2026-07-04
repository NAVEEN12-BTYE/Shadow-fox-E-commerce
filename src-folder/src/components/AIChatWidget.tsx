import React, { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { ChatMessage, Product } from "../types";
import { useCart } from "../contexts/CartContext";

interface Props {
  products: Product[];
}

export default function AIChatWidget({ products }: Props) {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", content: "Hi! I'm your AI shopping assistant. What are you looking for today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, products }),
      });
      const data = await res.json();
      setMessages([...nextMessages, { role: "model", content: data.content || data.error || "Something went wrong." }]);
    } catch {
      setMessages([...nextMessages, { role: "model", content: "I couldn't reach the assistant right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function quickAddByName(name: string) {
    const product = products.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (product) addToCart(product);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white rounded-full p-4 shadow-xl hover:bg-neutral-800 transition-colors"
        aria-label="Open AI shopping assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
          <div className="bg-neutral-900 text-white px-4 py-3">
            <p className="font-semibold text-sm">AI Shopping Assistant</p>
            <p className="text-xs text-neutral-300">Ask me anything about our products</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 whitespace-pre-wrap ${
                    m.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {m.content}
                  {m.role === "model" &&
                    products
                      .filter((p) => m.content.includes(p.name))
                      .slice(0, 3)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => quickAddByName(p.name)}
                          className="block mt-2 text-xs font-medium underline"
                        >
                          + Add {p.name} to cart
                        </button>
                      ))}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-neutral-400">Assistant is typing...</p>}
          </div>

          <form onSubmit={sendMessage} className="border-t border-neutral-200 p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Show me running shoes under 5000"
              className="flex-1 bg-neutral-100 rounded-full px-4 py-2 text-sm focus:outline-none"
            />
            <button type="submit" className="bg-neutral-900 text-white rounded-full p-2.5" disabled={loading}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
