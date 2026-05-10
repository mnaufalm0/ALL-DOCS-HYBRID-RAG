"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const chatId       = params.chatId as string;

  const [filename, setFilename] = useState(searchParams.get("filename") || "");

  useEffect(() => {
    // Get filename from localStorage chats if not in URL
    if (!filename) {
      const chats = JSON.parse(localStorage.getItem("chats") || "[]");
      const chat  = chats.find((c: any) => c.id === chatId);
      if (chat) setFilename(chat.filename);
    }
  }, [chatId]);

  return (
    <div className="h-full flex flex-col">
      <ChatInterface chatId={chatId} filename={filename} />
    </div>
  );
}
