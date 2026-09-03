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
const USERNAME_KEY = 'workbench_username';

// 获取已登录的用户名
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USERNAME_KEY);
}

// 设置用户名（登录）
export function setUsername(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERNAME_KEY, username);
}

// 清除用户名（登出）
export function clearUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USERNAME_KEY);
}

// 兼容旧版本：获取用户ID（现在返回用户名）
export function getUserId(): string {
  return getUsername() || '';
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
