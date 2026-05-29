"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

/** 触发 README 入库：读取项目根目录 README.md → 本地 vectorstore */
export function UploadDocumentsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ingest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/retrieval/ingest", { method: "POST" });
      const json = await response.json();

      if (response.ok) {
        const msg = json.message ?? "README 已向量化完成";
        setMessage(msg);
        toast.success(msg);
      } else {
        const err = json.error ?? "入库失败";
        setMessage(err);
        toast.error(err);
      }
    } catch {
      const err = "网络错误，请确认 Ollama 已启动且项目根目录存在 README.md";
      setMessage(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={ingest} className="flex flex-col gap-3 w-full max-w-md">
      <p className="text-sm text-muted-foreground">
        将项目根目录的 <code className="text-xs">README.md</code>{" "}
        切块并向量化，写入本地 <code className="text-xs">vectorstore/</code>。
      </p>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "处理中…" : "导入 README 并向量化"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
