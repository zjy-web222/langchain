import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function AgentsPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="hidden text-l md:block">
          🔗
          <span className="ml-2">
            此模板展示了如何使用{
              " "
            }
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            链和 Vercel{
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
            项目中执行检索。
          </span>
        </li>
        <li className="hidden text-l md:block">
          🪜
          <span className="ml-2">该链分两步工作：</span>
          <ul>
            <li className="ml-4">
              1️⃣
              <span className="ml-2">
                首先，它将输入问题重新表述为一个
                &quot;独立&quot;问题，根据聊天历史解析代词。
              </span>
            </li>
            <li className="ml-4">
              2️⃣
              <span className="ml-2">
                然后，它查询检索器以获取与解析后问题相似的文档并撰写答案。
              </span>
            </li>
          </ul>
        </li>
        <li className="hidden text-l md:block">
          💻
          <span className="ml-2">
            您可以在{
              " "
            }
            <code>app/api/chat/retrieval/route.ts</code>中找到此用例的提示和模型逻辑。
          </span>
        </li>
        <li>
          🐶
          <span className="ml-2">
            默认情况下，代理假装是一只会说话的小狗，但您可以将提示更改为任何您想要的内容！
          </span>
        </li>
        <li className="text-l">
          🎨
          <span className="ml-2">
            主要前端逻辑位于{
              " "
            }
            <code>app/retrieval/page.tsx</code> 中。
          </span>
        </li>
        <li className="hidden text-l md:block">
          🔱
          <span className="ml-2">
            在自己运行此示例之前，您首先需要设置 Supabase 向量存储。有关更多详细信息，请参阅 README。
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            上传一些文本，然后尝试在下面询问例如：{
              " "
            }
            <code>什么是文档加载器？</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/chat/retrieval"
      emptyStateComponent={InfoCard}
      showIngestForm={true}
      placeholder={
        '我有寻找正确文档的敏锐嗅觉！请问："什么是文档加载器？"'
      }
      emoji="🐶"
    />
  );
}
