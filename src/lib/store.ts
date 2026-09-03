export interface Article {
  id: string;
  title: string;
  url: string;
  articleId: string;
  userId: string;
  username: string;
  category: 'industry' | 'newcar';
  pushedToGroup: boolean;
  addedToClient: boolean;
  createdAt: number;
  order?: number;
}

export type UserMap = Record<string, string>;

const ARTICLES_KEY = 'workbench_articles';
const USER_ID_KEY = 'workbench_user_id';

// 生成唯一用户ID
function generateUserId(): string {
  return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

// 获取或创建用户ID
export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// 从服务端加载文章
export async function loadArticlesFromServer(userId: string): Promise<Article[]> {
  try {
    const res = await fetch(`/api/articles?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// 保存文章到服务端
export async function saveArticlesToServer(userId: string, articles: Article[]): Promise<void> {
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, articles }),
    });
  } catch (error) {
    console.error('Failed to save articles to server:', error);
  }
}

// 本地存储（用于缓存和离线支持）
export function loadArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArticles(articles: Article[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}
