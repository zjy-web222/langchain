import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import { useState, useEffect } from "react";

/** 去掉 Qwen 等模型的原生 think 思考块，避免与【思考过程】重复 */
function stripNativeThinking(content: string) {
  const lower = content.toLowerCase();
  const openTag = "<" + "think" + ">";
  const closeTag = "<" + "/" + "think" + ">";
  const openIndex = lower.indexOf(openTag);

  if (openIndex === -1) {
    return { nativeThinking: null, rest: content.trim(), inNativeThinking: false };
  }

  const closeIndex = lower.indexOf(closeTag, openIndex + openTag.length);
  if (closeIndex !== -1) {
    const nativeThinking =
      content.slice(openIndex + openTag.length, closeIndex).trim() || null;
    const rest = (
      content.slice(0, openIndex) + content.slice(closeIndex + closeTag.length)
    ).trim();
    return { nativeThinking, rest, inNativeThinking: false };
  }

  const nativeThinking =
    content.slice(openIndex + openTag.length).trim() || null;
  return {
    nativeThinking,
    rest: content.slice(0, openIndex).trim(),
    inNativeThinking: true,
  };
}

function parseMessageContent(content: string) {
  const { nativeThinking, rest, inNativeThinking } =
    stripNativeThinking(content);

  const thinkingMatch = rest.match(/【思考过程】([\s\S]*?)(?=【最终回复】|$)/);
  const finalMatch = rest.match(/【最终回复】([\s\S]*)/);

  const structuredThinking = thinkingMatch?.[1]?.trim() || null;
  const thinking = structuredThinking || nativeThinking;

  let final: string;
  if (finalMatch) {
    final = finalMatch[1].trim();
  } else if (thinkingMatch || inNativeThinking) {
    // 仍在输出思考过程时，不要把整段内容再显示到「最终回复」区域
    final = "";
  } else {
    final = rest;
  }

  return { thinking, final };
}

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  const { thinking, final } = parseMessageContent(props.message.content);
  const [showThinking, setShowThinking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (final && final.trim().length > 0) {
      // 添加短暂延迟，让用户能看到思考过程
      const timer = setTimeout(() => {
        setIsComplete(true);
        setShowThinking(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [final]);
  
  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
        props.message.role === "user"
          ? "bg-secondary text-secondary-foreground px-4 py-2"
          : null,
        props.message.role === "user" ? "ml-auto" : "mr-auto",
      )}
    >
      {props.message.role !== "user" && (
        <div className="mr-4 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {props.aiEmoji}
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col flex-1">
        {/* 思考过程 */}
        {thinking && showThinking && !isComplete && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-l-4 border-blue-500 shadow-sm transition-all duration-300 ease-in-out">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center">
              <span className="mr-2 animate-pulse">🧠</span>
              思考过程
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {thinking}
            </div>
          </div>
        )}
        
        {/* 最终回复：思考阶段尚未开始时不要渲染空块，避免与上方思考区重复 */}
        {(!thinking || final.length > 0) && (
        <div className={`${thinking ? "p-4 bg-white dark:bg-gray-900 rounded-xl border-l-4 border-green-500 shadow-md transition-all duration-300 ease-in-out" : ""}`}>
          {thinking && isComplete && (
            <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center">
              <span className="mr-2">✨</span>
              最终回复
            </div>
          )}
          <span className={`${thinking ? "text-base leading-relaxed" : ""}`}>{final}</span>
        </div>
        )}

        {/* 来源信息 */}
        {props.sources && props.sources.length ? (
          <div className="mt-4 space-y-2">
            <code className="block bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">🔍 参考资料:</span>
            </code>
            <div className="space-y-2">
              {props.sources?.map((source, i) => (
                <code key={"source:" + i} className="block bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg text-xs">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{i + 1}. &quot;{source.pageContent}&quot;</div>
                  {source.metadata?.loc?.lines !== undefined ? (
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      行 {source.metadata?.loc?.lines?.from} 到 {source.metadata?.loc?.lines?.to}
                    </div>
                  ) : null}
                </code>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}