import fs from 'fs/promises';
import path from 'path';

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
  order: number;
}

export interface UserArticles {
  userId: string;
  articles: Article[];
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readArticlesFile(): Promise<Record<string, UserArticles>> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeArticlesFile(data: Record<string, UserArticles>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(data, null, 2));
}

export async function getUserArticles(userId: string): Promise<Article[]> {
  const allData = await readArticlesFile();
  const userData = allData[userId];
  return userData?.articles || [];
}

export async function setUserArticles(userId: string, articles: Article[]): Promise<void> {
  const allData = await readArticlesFile();
  allData[userId] = {
    userId,
    articles,
    updatedAt: Date.now(),
  };
  await writeArticlesFile(allData);
}

export async function addArticle(userId: string, article: Article): Promise<Article[]> {
  const articles = await getUserArticles(userId);
  articles.push(article);
  await setUserArticles(userId, articles);
  return articles;
}

export async function updateArticle(userId: string, articleId: string, updates: Partial<Article>): Promise<Article | null> {
  const articles = await getUserArticles(userId);
  const index = articles.findIndex(a => a.id === articleId);
  if (index === -1) return null;
  articles[index] = { ...articles[index], ...updates };
  await setUserArticles(userId, articles);
  return articles[index];
}

export async function deleteArticle(userId: string, articleId: string): Promise<Article[]> {
  const articles = await getUserArticles(userId);
  const filtered = articles.filter(a => a.id !== articleId);
  await setUserArticles(userId, filtered);
  return filtered;
}
