'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCopy,
  Check,
  Plus,
  Trash2,
  Settings2,
  X,
} from 'lucide-react';
import { extractFromUrl, formatCopyText, generateId } from '@/lib/article-utils';
import {
  type Article,
  type UserMap,
  loadArticles,
  saveArticles,
  loadUserMap,
  saveUserMap,
} from '@/lib/store';

type CategoryFilter = 'all' | 'industry' | 'newcar';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [filter, setFilter] = useState<CategoryFilter>('all');

  // Input state
  const [inputTitle, setInputTitle] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputCategory, setInputCategory] = useState<'industry' | 'newcar'>('industry');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User map dialog
  const [userMapOpen, setUserMapOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    setArticles(loadArticles());
    setUserMap(loadUserMap());
  }, []);

  // Persist articles
  const updateArticles = useCallback((next: Article[]) => {
    setArticles(next);
    saveArticles(next);
  }, []);

  // Filtered articles
  const filtered = filter === 'all' ? articles : articles.filter((a) => a.category === filter);

  // Add article
  const handleAdd = () => {
    const title = inputTitle.trim();
    const url = inputUrl.trim();
    if (!title || !url) return;

    const { articleId, userId } = extractFromUrl(url);
    const username = userMap[userId] || userId;

    const article: Article = {
      id: generateId(),
      title,
      url,
      articleId,
      userId,
      username,
      category: inputCategory,
      pushedToGroup: false,
      addedToClient: false,
      createdAt: Date.now(),
    };

    updateArticles([article, ...articles]);
    setInputTitle('');
    setInputUrl('');
  };

  // Toggle checkbox
  const handleToggle = (id: string, field: 'pushedToGroup' | 'addedToClient') => {
    updateArticles(
      articles.map((a) => (a.id === id ? { ...a, [field]: !a[field] } : a))
    );
  };

  // Copy to clipboard
  const handleCopy = async (article: Article) => {
    const text = formatCopyText(article.title, article.url);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(article.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(article.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // Delete article
  const handleDelete = (id: string) => {
    updateArticles(articles.filter((a) => a.id !== id));
    setDeleteId(null);
  };

  // Add user mapping
  const handleAddUserMap = () => {
    const uid = newUserId.trim();
    const name = newUsername.trim();
    if (!uid || !name) return;
    const next = { ...userMap, [uid]: name };
    setUserMap(next);
    saveUserMap(next);
    setNewUserId('');
    setNewUsername('');
  };

  // Remove user mapping
  const handleRemoveUserMap = (uid: string) => {
    const next = { ...userMap };
    delete next[uid];
    setUserMap(next);
    saveUserMap(next);
  };

  // Batch copy all visible
  const handleBatchCopy = async () => {
    const text = filtered.map((a) => formatCopyText(a.title, a.url)).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId('__batch__');
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId('__batch__');
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // Keyboard shortcut: Enter to add
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputTitle.trim() && inputUrl.trim()) {
      handleAdd();
    }
  };

  const categoryLabel = (cat: 'industry' | 'newcar') =>
    cat === 'industry' ? '产业稿' : '新车稿';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <h1 className="text-lg font-semibold text-[#1A1A1A]">文章工作台</h1>
          <Dialog open={userMapOpen} onOpenChange={setUserMapOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]">
                <Settings2 className="h-4 w-4" />
                用户名管理
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>用户名映射管理</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Existing mappings */}
                <div className="max-h-60 space-y-1.5 overflow-y-auto">
                  {Object.entries(userMap).map(([uid, name]) => (
                    <div
                      key={uid}
                      className="flex items-center justify-between rounded-md bg-[#F8F9FA] px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="text-[#6B7280]">{uid}</span>
                        <span className="mx-2 text-[#D1D5DB]">&rarr;</span>
                        <span className="font-medium text-[#1A1A1A]">{name}</span>
                      </span>
                      <button
                        onClick={() => handleRemoveUserMap(uid)}
                        className="text-[#9CA3AF] hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {Object.keys(userMap).length === 0 && (
                    <p className="py-4 text-center text-sm text-[#9CA3AF]">暂无映射</p>
                  )}
                </div>
                {/* Add new */}
                <div className="flex gap-2">
                  <Input
                    placeholder="用户ID"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="用户名"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddUserMap} disabled={!newUserId.trim() || !newUsername.trim()}>
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-5">
        {/* Input area */}
        <div className="mb-5 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                文章标题
              </label>
              <Input
                placeholder="输入文章标题"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="min-w-[320px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                文章链接
              </label>
              <Input
                placeholder="https://www.sohu.com/a/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="w-[120px]">
              <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                分类
              </label>
              <Select
                value={inputCategory}
                onValueChange={(v) => setInputCategory(v as 'industry' | 'newcar')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">产业稿</SelectItem>
                  <SelectItem value="newcar">新车稿</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!inputTitle.trim() || !inputUrl.trim()}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>
          {/* Preview extracted info */}
          {inputUrl.trim() && (
            <div className="mt-2 flex gap-4 text-xs text-[#6B7280]">
              <span>
                文章ID:{' '}
                <span className="font-mono text-[#1A1A1A]">
                  {extractFromUrl(inputUrl).articleId || '-'}
                </span>
              </span>
              <span>
                用户ID:{' '}
                <span className="font-mono text-[#1A1A1A]">
                  {extractFromUrl(inputUrl).userId || '-'}
                </span>
              </span>
              <span>
                用户名:{' '}
                <span className="font-medium text-[#1A1A1A]">
                  {userMap[extractFromUrl(inputUrl).userId] || '未识别'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as CategoryFilter)}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">
                全部
                {articles.length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">{articles.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="industry">
                产业稿
                {articles.filter((a) => a.category === 'industry').length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">
                    {articles.filter((a) => a.category === 'industry').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="newcar">
                新车稿
                {articles.filter((a) => a.category === 'newcar').length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">
                    {articles.filter((a) => a.category === 'newcar').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchCopy}
            disabled={filtered.length === 0}
            className="gap-1.5"
          >
            {copiedId === '__batch__' ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                已复制全部
              </>
            ) : (
              <>
                <ClipboardCopy className="h-3.5 w-3.5" />
                复制全部
              </>
            )}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA]">
                <TableHead className="min-w-[360px] text-xs font-medium text-[#6B7280]">
                  标题 / 链接
                </TableHead>
                <TableHead className="w-[130px] text-xs font-medium text-[#6B7280]">
                  文章ID
                </TableHead>
                <TableHead className="w-[120px] text-xs font-medium text-[#6B7280]">
                  用户名
                </TableHead>
                <TableHead className="w-[90px] text-center text-xs font-medium text-[#6B7280]">
                  推群
                </TableHead>
                <TableHead className="w-[90px] text-center text-xs font-medium text-[#6B7280]">
                  客户端
                </TableHead>
                <TableHead className="w-[100px] text-center text-xs font-medium text-[#6B7280]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-sm text-[#9CA3AF]">
                    {articles.length === 0 ? '暂无文章，请在上方添加' : '当前分类下暂无文章'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => (
                  <TableRow key={article.id} className="group">
                    {/* Title + URL */}
                    <TableCell className="py-2.5">
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-[10px] font-normal ${
                              article.category === 'industry'
                                ? 'bg-[#EEF2FF] text-[#6366F1]'
                                : 'bg-[#ECFEFF] text-[#0891B2]'
                            }`}
                          >
                            {categoryLabel(article.category)}
                          </Badge>
                          <span className="text-sm leading-snug text-[#1A1A1A]">
                            {article.title}
                          </span>
                        </div>
                        <p className="pl-[52px] truncate text-xs text-[#9CA3AF]">
                          {article.url}
                        </p>
                      </div>
                    </TableCell>
                    {/* Article ID */}
                    <TableCell className="font-mono text-xs text-[#6B7280]">
                      {article.articleId || '-'}
                    </TableCell>
                    {/* Username */}
                    <TableCell className="text-sm text-[#1A1A1A]">
                      {article.username || '-'}
                    </TableCell>
                    {/* Pushed to group */}
                    <TableCell className="text-center">
                      <Checkbox
                        checked={article.pushedToGroup}
                        onCheckedChange={() => handleToggle(article.id, 'pushedToGroup')}
                        className={
                          article.pushedToGroup
                            ? 'border-green-600 bg-green-600 data-[state=checked]:bg-green-600'
                            : ''
                        }
                      />
                    </TableCell>
                    {/* Added to client */}
                    <TableCell className="text-center">
                      <Checkbox
                        checked={article.addedToClient}
                        onCheckedChange={() => handleToggle(article.id, 'addedToClient')}
                        className={
                          article.addedToClient
                            ? 'border-orange-500 bg-orange-500 data-[state=checked]:bg-orange-500'
                            : ''
                        }
                      />
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(article)}
                          className="h-7 px-2 text-[#6B7280] hover:text-[#2563EB]"
                        >
                          {copiedId === article.id ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <ClipboardCopy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {deleteId === article.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                            className="h-7 px-2 text-red-500 hover:text-red-600"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(article.id)}
                            className="h-7 px-2 text-[#9CA3AF] hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        {articles.length > 0 && (
          <div className="mt-3 flex gap-6 text-xs text-[#9CA3AF]">
            <span>
              推群: {articles.filter((a) => a.pushedToGroup).length}/{articles.length}
            </span>
            <span>
              客户端: {articles.filter((a) => a.addedToClient).length}/{articles.length}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
