import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { FetchClient } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { url, currentTitle } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();

    // Step 1: Fetch article content
    const fetchClient = new FetchClient(config, customHeaders);
    const fetchResponse = await fetchClient.fetch(url);

    let articleContent = '';
    if (fetchResponse.status_code === 0 && fetchResponse.content) {
      articleContent = fetchResponse.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n')
        .slice(0, 3000); // Limit content length
    }

    if (!articleContent) {
      return NextResponse.json({ error: '无法获取文章内容' }, { status: 400 });
    }

    // Step 2: Use LLM to optimize title
    const llmClient = new LLMClient(config, customHeaders);
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      {
        role: 'system',
        content: `你是一位资深汽车媒体编辑，擅长撰写精炼、吸引眼球的文章标题。
请根据文章内容，优化标题使其更加精炼有力。

要求：
1. 标题长度严格控制在17-20个中文字符之间
2. 保留核心信息，突出关键亮点
3. 语言简洁有力，适合汽车媒体传播
4. 只输出优化后的标题文本，不要任何解释或标点`,
      },
      {
        role: 'user',
        content: `当前标题：${currentTitle || '无'}

文章内容摘要：
${articleContent}

请优化这个标题，控制在17-20字：`,
      },
    ];

    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.7,
    });

    const optimizedTitle = response.content.trim().replace(/^["'"「『【]+|["'"」』】]+$/g, '');

    return NextResponse.json({ title: optimizedTitle });
  } catch (error) {
    console.error('Optimize title error:', error);
    return NextResponse.json({ error: 'AI优化失败，请重试' }, { status: 500 });
  }
}
