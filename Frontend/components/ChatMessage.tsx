"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm    from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme }  from "@/context/ThemeContext";
import type { Message } from "@/lib/types";
import { Bot, User } from "lucide-react";

export default function ChatMessage({ msg }: { msg: Message }) {
  const { theme } = useTheme();
  const isUser = msg.role === "user";

  return (
    <div className={`msg-in flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? "var(--accent)" : "var(--bg-3)",
          color:      isUser ? "#fff" : "var(--text-2)"
        }}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser ? "var(--accent)" : "var(--bg-2)",
            color:      isUser ? "#fff" : "var(--text)",
            border:     isUser ? "none" : "1px solid var(--border)",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px"
          }}>

          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const inline = !match;
                  return inline ? (
                    <code className="px-1.5 py-0.5 rounded font-mono text-xs"
                      style={{ background: "var(--bg-3)", color: "var(--accent)" }} {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={theme === "dark" ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-xl text-xs my-2 !bg-transparent">
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
                p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul:         ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol:         ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li:         ({ children }) => <li className="text-sm">{children}</li>,
                strong:     ({ children }) => <strong className="font-semibold">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 pl-3 my-2 italic"
                    style={{ borderColor: "var(--accent)", color: "var(--text-2)" }}>
                    {children}
                  </blockquote>
                ),
              }}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp + cache badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {msg.was_cached && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              cached
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
