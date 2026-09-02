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
}

export type UserMap = Record<string, string>;

const ARTICLES_KEY = 'workbench_articles';

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
