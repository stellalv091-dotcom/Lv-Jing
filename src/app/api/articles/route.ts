import { NextRequest, NextResponse } from 'next/server';
import {
  getUserArticles,
  setUserArticles,
  type Article,
} from '@/lib/articles-file';

// GET /api/articles?userId=xxx - 获取用户的文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const articles = await getUserArticles(userId);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('GET /api/articles error:', error);
    return NextResponse.json({ error: 'Failed to get articles' }, { status: 500 });
  }
}

// POST /api/articles - 保存用户的文章列表（全量覆盖）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, articles } = body as { userId: string; articles: Article[] };

    if (!userId || !articles) {
      return NextResponse.json({ error: 'Missing userId or articles' }, { status: 400 });
    }

    await setUserArticles(userId, articles);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('POST /api/articles error:', error);
    return NextResponse.json({ error: 'Failed to save articles' }, { status: 500 });
  }
}
