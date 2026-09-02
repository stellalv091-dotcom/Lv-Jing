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
const USERMAP_KEY = 'workbench_usermap';

// 默认用户名映射（常见搜狐号）
const DEFAULT_USER_MAP: UserMap = {
  '185351': '车动态',
  '118560': '搜狐汽车',
  '121777': '搜狐汽车',
  '151284': '搜狐汽车',
};

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

export function loadUserMap(): UserMap {
  if (typeof window === 'undefined') return DEFAULT_USER_MAP;
  try {
    const raw = localStorage.getItem(USERMAP_KEY);
    if (raw) return { ...DEFAULT_USER_MAP, ...JSON.parse(raw) };
    return DEFAULT_USER_MAP;
  } catch {
    return DEFAULT_USER_MAP;
  }
}

export function saveUserMap(map: UserMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERMAP_KEY, JSON.stringify(map));
}
