"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function SyncUser2Button() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const sync = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastMessage(null);

    try {
      const response = await fetch("/api/retrieval/postgres/ingest", {
        method: "POST",
      });
      const json = await response.json();

      if (response.ok) {
        const msg = json.message ?? "同步成功";
        setLastMessage(msg);
        toast.success(msg);
      } else {
        const err = json.error ?? "同步失败";
        setLastMessage(err);
        toast.error(err);
      }
    } catch {
      const err = "网络错误，请检查 Supabase 与 Ollama 是否可用";
      setLastMessage(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={sync} className="flex flex-col gap-3 w-full max-w-md">
      <p className="text-sm text-muted-foreground">
        从 Supabase 的 <code className="text-xs">user2</code>{" "}
        表读取数据，向量化后写入 Supabase 向量表{" "}
        <code className="text-xs">documents</code>，供下方对话检索使用。
      </p>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "同步中…" : "从 user2 同步到向量库"}
      </Button>
      {lastMessage && (
        <p className="text-sm text-muted-foreground">{lastMessage}</p>
      )}
    </form>
  );
}
