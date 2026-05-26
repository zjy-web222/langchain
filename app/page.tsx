import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🤝
          <span className="ml-2">
            此模板展示了一个使用{
              " "
            }
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            和 Vercel{
              " "
            }
            <a href="https://sdk.vercel.ai/docs" target="_blank">
              AI SDK
            </a>{" "}
            在{
              " "
            }
            <a href="https://nextjs.org/" target="_blank">
              Next.js
            </a>{" "}
            项目中构建的简单聊天机器人。
          </span>
        </li>
        <li className="hidden text-l md:block">
          💻
          <span className="ml-2">
            您可以在{
              " "
            }
            <code>app/api/chat/route.ts</code>中找到此用例的提示和模型逻辑。
          </span>
        </li>
        <li>
          🏴‍☠️
          <span className="ml-2">
            默认情况下，机器人假装是一个海盗，但您可以将提示更改为任何您想要的内容！
          </span>
        </li>
        <li className="hidden text-l md:block">
          🎨
          <span className="ml-2">
            主要前端逻辑位于 <code>app/page.tsx</code> 中。
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            尝试在下面询问例如：<code>当海盗是什么感觉？</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/chat"
      emoji="🏴‍☠️"
      placeholder="我是一个假装成海盗的LLM！向我询问海盗生活！"
      emptyStateComponent={InfoCard}
    />
  );
}
