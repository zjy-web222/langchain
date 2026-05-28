"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function SyncLocalPgButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const sync = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastMessage(null);

    try {
      const response = await fetch("/api/retrieval/local/ingest", {
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
      const err = "网络错误，请检查 LOCAL_DATABASE_URL 与 Ollama";
      setLastMessage(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={sync} className="flex flex-col gap-3 w-full max-w-md">
      <p className="text-sm text-muted-foreground">
        通过 Prisma 从本地 PostgreSQL 业务表（默认{" "}
        <code className="text-xs">local_source</code>）读取并向量化到{" "}
        <code className="text-xs">documents</code>。表名由环境变量{" "}
        <code className="text-xs">LOCAL_PG_SOURCE_TABLE</code> 配置。
      </p>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "同步中…" : "同步本地库到向量表"}
      </Button>
      {lastMessage && (
        <p className="text-sm text-muted-foreground">{lastMessage}</p>
      )}
    </form>
  );
}
