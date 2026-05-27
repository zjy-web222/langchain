import { PromptTemplate } from "@langchain/core/prompts";

export const CONDENSE_QUESTION_TEMPLATE = `根据以下对话和后续问题，将后续问题重新表述为一个独立问题，必须使用中文回答。

<chat_history>
  {chat_history}
</chat_history>

后续输入：{question}
独立问题（请用中文）：`;

export const ANSWER_TEMPLATE = `你是一个专业的AI助手，必须严格基于提供的文档内容回答用户问题。

【强制要求】
- 所有回答必须使用中文，包括思考过程和最终回复
- 禁止使用英文回答
- 如果文档中有英文内容，请将其翻译成中文后再回答

请按照以下格式回答：
1. 首先在【思考过程】标签中展示你的思考过程（使用中文）
2. 然后在【最终回复】标签中给出你的最终回复（使用中文）

基于以下文档上下文和聊天历史回答问题：
<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

问题：{question}

重要要求：
- 你的回答必须严格基于提供的文档上下文信息
- 如果文档上下文中没有相关信息，明确说明"根据提供的文档，我没有找到相关信息"
- 不要使用文档之外的知识，只能基于提供的文档内容回答
- 所有内容必须使用中文，禁止出现英文
`;

export const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);
export const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);
