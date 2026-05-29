import "./globals.css";
import { Public_Sans } from "next/font/google";
import { ActiveLink } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>LangChain RAG Chat</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="基于 LangChain.js + Next.js + Ollama 的多路 RAG 对话应用"
        />
      </head>
      <body className={publicSans.className}>
        <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
          <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
            <div className="flex gap-4 flex-col md:flex-row md:items-center">
              <span className="text-lg font-semibold">LangChain RAG</span>
              <nav className="flex gap-1 flex-col md:flex-row">
                <ActiveLink href="/">💬 对话</ActiveLink>
                <ActiveLink href="/retrieval">📄 README RAG</ActiveLink>
                <ActiveLink href="/retrieval/postgres">
                  🗄️ Supabase RAG
                </ActiveLink>
                <ActiveLink href="/retrieval/local">🐘 本地 PG RAG</ActiveLink>
              </nav>
            </div>
          </div>
          <div className="bg-background mx-4 relative grid rounded-t-2xl border border-input border-b-0">
            <div className="absolute inset-0">{children}</div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
