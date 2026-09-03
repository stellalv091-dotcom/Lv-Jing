'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ClipboardCopy,
  Check,
  Plus,
  Trash2,
  Settings2,
  X,
  GripVertical,
  Loader2,
  History,
  Sparkles,
  Car,
} from 'lucide-react';
import { extractFromUrl, formatCopyText, generateId } from '@/lib/article-utils';
import {
  type Article,
  type UserMap,
  loadArticles,
  saveArticles,
} from '@/lib/store';
import Link from 'next/link';

type CategoryFilter = 'all' | 'industry' | 'newcar';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${h}:${min}`;
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}

// API helpers for shared user map
async function fetchUserMap(): Promise<UserMap> {
  try {
    const res = await fetch('/api/usermap');
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return {};
}

async function addUserMapEntries(entries: Record<string, string>): Promise<UserMap> {
  try {
    const res = await fetch('/api/usermap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return {};
}

async function removeUserMapEntry(uid: string): Promise<UserMap> {
  try {
    const res = await fetch(`/api/usermap?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return {};
}

// Group articles by date
function groupByDate(articles: Article[]): Record<string, Article[]> {
  const groups: Record<string, Article[]> = {};
  for (const article of articles) {
    const key = getTodayKey() === new Date(article.createdAt).toDateString()
      ? getTodayKey()
      : new Date(article.createdAt).toISOString().slice(0, 10);
    // Use the date from createdAt
    const d = new Date(article.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(article);
  }
  return groups;
}

export default function Home() {
  // Today's articles (blank on load)
  const [todayArticles, setTodayArticles] = useState<Article[]>([]);
  // All historical articles
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [userMapLoading, setUserMapLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  // Input state
  const [inputTitle, setInputTitle] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputCategory, setInputCategory] = useState<'industry' | 'newcar'>('industry');

  // Copy feedback
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // User map dialog
  const [userMapOpen, setUserMapOpen] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchAdding, setBatchAdding] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag and drop
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // AI optimize
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  // History panel
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load articles: today's are blank, load all for history
  useEffect(() => {
    const all = loadArticles();
    setAllArticles(all);
    // Today's articles: only those created today
    const todayKey = getTodayKey();
    const today = all.filter((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    });
    setTodayArticles(today);
    fetchUserMap().then((map) => {
      setUserMap(map);
      setUserMapLoading(false);
    });
  }, []);

  // Persist all articles
  const updateAllArticles = useCallback((next: Article[]) => {
    setAllArticles(next);
    saveArticles(next);
    // Update today's articles
    const todayKey = getTodayKey();
    const today = next.filter((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    });
    setTodayArticles(today);
  }, []);

  // Filtered today articles
  const filtered = filter === 'all' ? todayArticles : todayArticles.filter((a) => a.category === filter);

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

    updateAllArticles([article, ...allArticles]);
    setInputTitle('');
    setInputUrl('');
  };

  // Toggle checkbox
  const handleToggle = (id: string, field: 'pushedToGroup' | 'addedToClient') => {
    updateAllArticles(
      allArticles.map((a) => (a.id === id ? { ...a, [field]: !a[field] } : a))
    );
  };

  // Copy single
  const handleCopySingle = async (article: Article) => {
    const text = formatCopyText(article.title, article.url);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag(article.id);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  // Copy article ID on double-click
  const handleCopyArticleId = async (articleId: string) => {
    if (!articleId) return;
    const ok = await copyToClipboard(articleId);
    if (ok) {
      setCopiedTag(`id_${articleId}`);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  // Copy selected
  const handleCopySelected = async () => {
    const selected = filtered.filter((a) => selectedIds.has(a.id));
    if (selected.length === 0) return;
    const text = selected.map((a) => formatCopyText(a.title, a.url)).join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag('__selected__');
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  // Copy all visible
  const handleCopyAll = async () => {
    const text = filtered.map((a) => formatCopyText(a.title, a.url)).join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag('__all__');
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  // Delete article
  const handleDelete = (id: string) => {
    updateAllArticles(allArticles.filter((a) => a.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteId(null);
  };

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = '0.5';
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDragId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    const dragIndex = allArticles.findIndex((a) => a.id === dragId);
    const targetIndex = allArticles.findIndex((a) => a.id === targetId);
    if (dragIndex === -1 || targetIndex === -1) return;

    const newArticles = [...allArticles];
    const [removed] = newArticles.splice(dragIndex, 1);
    newArticles.splice(targetIndex, 0, removed);
    updateAllArticles(newArticles);

    setDragId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  };

  // AI Optimize title
  const handleOptimizeTitle = async (articleId: string, url: string, currentTitle: string) => {
    setOptimizingId(articleId);
    try {
      const res = await fetch('/api/optimize-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, currentTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          updateAllArticles(
            allArticles.map((a) =>
              a.id === articleId ? { ...a, title: data.title } : a
            )
          );
          setCopiedTag(`optimized_${articleId}`);
          setTimeout(() => setCopiedTag(null), 2000);
        }
      }
    } catch { /* ignore */ }
    setOptimizingId(null);
  };

  // Batch add user mappings via API
  const handleBatchAddUserMap = async () => {
    const lines = batchInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setBatchAdding(true);
    const entries: Record<string, string> = {};
    for (const line of lines) {
      const parts = line.split(/[\s,，\t]+/);
      if (parts.length >= 2) {
        const uid = parts[0].trim();
        const name = parts.slice(1).join(' ').trim();
        if (uid && name) {
          entries[uid] = name;
        }
      }
    }

    if (Object.keys(entries).length > 0) {
      const updated = await addUserMapEntries(entries);
      setUserMap(updated);
    }
    setBatchInput('');
    setBatchAdding(false);
  };

  // Remove user mapping via API
  const handleRemoveUserMap = async (uid: string) => {
    const updated = await removeUserMapEntry(uid);
    setUserMap(updated);
  };

  // Keyboard shortcut: Enter to add
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputTitle.trim() && inputUrl.trim()) {
      handleAdd();
    }
  };

  const categoryLabel = (cat: 'industry' | 'newcar') =>
    cat === 'industry' ? '产业稿' : '新车稿';

  const selectedCount = filtered.filter((a) => selectedIds.has(a.id)).length;

  // History data grouped by date
  const historyGroups = groupByDate(allArticles);
  const historyDates = Object.keys(historyGroups).sort((a, b) => b.localeCompare(a));
  const todayKey = getTodayKey();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-[#1A1A1A]">文章工作台</h1>
            <span className="text-xs text-[#9CA3AF]">{todayKey}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/car-calendar">
              <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]">
                <Car className="h-4 w-4" />
                新车日历
              </Button>
            </Link>
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]">
                  <History className="h-4 w-4" />
                  历史记录
                  {allArticles.length > 0 && (
                    <span className="ml-0.5 text-xs text-[#9CA3AF]">{allArticles.length}</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[500px] overflow-y-auto sm:max-w-[500px]">
                <SheetHeader>
                  <SheetTitle>历史记录</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {historyDates.map((date) => (
                    <div key={date}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {date === todayKey ? '今天' : date}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          {historyGroups[date].length} 篇
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {historyGroups[date].map((article) => (
                          <div
                            key={article.id}
                            className="rounded-md border bg-white p-2.5"
                          >
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
                              <span className="text-sm text-[#1A1A1A]">
                                {article.title}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-[#9CA3AF]">
                              {article.url}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-[#9CA3AF]">
                              <span>{article.username}</span>
                              {article.pushedToGroup && (
                                <span className="text-green-600">已推群</span>
                              )}
                              {article.addedToClient && (
                                <span className="text-orange-500">已加客户端</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {allArticles.length === 0 && (
                    <p className="py-8 text-center text-sm text-[#9CA3AF]">
                      暂无历史记录
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Dialog open={userMapOpen} onOpenChange={setUserMapOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]">
                  <Settings2 className="h-4 w-4" />
                  用户名管理
                  {userMapLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>共享用户名映射</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-xs text-[#9CA3AF]">
                    所有用户共享此映射库，添加后对所有人可见
                  </p>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto">
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
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#6B7280]">
                      批量添加（每行一条，格式：用户ID 用户名）
                    </label>
                    <Textarea
                      placeholder={"185351 车动态\n118560 搜狐汽车\n121777 汽车公社"}
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      rows={4}
                      className="resize-none text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleBatchAddUserMap}
                      disabled={!batchInput.trim() || batchAdding}
                      className="w-full"
                    >
                      {batchAdding ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      批量添加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                今日
                {todayArticles.length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">{todayArticles.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="industry">
                产业稿
                {todayArticles.filter((a) => a.category === 'industry').length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">
                    {todayArticles.filter((a) => a.category === 'industry').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="newcar">
                新车稿
                {todayArticles.filter((a) => a.category === 'newcar').length > 0 && (
                  <span className="ml-1.5 text-xs text-[#9CA3AF]">
                    {todayArticles.filter((a) => a.category === 'newcar').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleCopySelected}
                className="gap-1.5"
              >
                {copiedTag === '__selected__' ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    已复制 {selectedCount} 条
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    复制选中 ({selectedCount})
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              disabled={filtered.length === 0}
              className="gap-1.5"
            >
              {copiedTag === '__all__' ? (
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA]">
                <TableHead className="w-[32px]"></TableHead>
                <TableHead className="w-[44px] text-center">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[90px] text-xs font-medium text-[#6B7280]">
                  日期
                </TableHead>
                <TableHead className="min-w-[320px] text-xs font-medium text-[#6B7280]">
                  标题 / 链接
                </TableHead>
                <TableHead className="w-[140px] text-xs font-medium text-[#6B7280]">
                  文章ID <span className="text-[#B0B0B0]">(双击复制)</span>
                </TableHead>
                <TableHead className="w-[100px] text-xs font-medium text-[#6B7280]">
                  用户名
                </TableHead>
                <TableHead className="w-[60px] text-center text-xs font-medium text-[#6B7280]">
                  推群
                </TableHead>
                <TableHead className="w-[60px] text-center text-xs font-medium text-[#6B7280]">
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
                  <TableCell colSpan={9} className="h-40 text-center text-sm text-[#9CA3AF]">
                    {todayArticles.length === 0
                      ? '今日暂无文章，请在上方添加'
                      : '当前分类下暂无文章'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => {
                  const isSelected = selectedIds.has(article.id);
                  const isDragging = dragId === article.id;
                  const isDragOver = dragOverId === article.id && dragId !== article.id;
                  const isOptimizing = optimizingId === article.id;
                  return (
                    <TableRow
                      key={article.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, article.id)}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(e) => handleDragEnter(e, article.id)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, article.id)}
                      className={`group cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-50/60' : ''
                      } ${isDragging ? 'opacity-50' : ''} ${
                        isDragOver ? 'border-t-2 border-t-blue-400' : ''
                      }`}
                      onClick={() => toggleSelect(article.id)}
                    >
                      {/* Drag handle */}
                      <TableCell className="cursor-grab px-1 text-center text-[#D1D5DB] hover:text-[#9CA3AF] active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="inline-block h-4 w-4" />
                      </TableCell>
                      {/* Select */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(article.id)}
                        />
                      </TableCell>
                      {/* Date */}
                      <TableCell className="text-xs text-[#6B7280]">
                        {formatShortDate(article.createdAt)}
                      </TableCell>
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
                            {copiedTag === `optimized_${article.id}` && (
                              <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
                                AI已优化
                              </span>
                            )}
                          </div>
                          <p className="pl-[52px] truncate text-xs text-[#9CA3AF]">
                            {article.url}
                          </p>
                        </div>
                      </TableCell>
                      {/* Article ID */}
                      <TableCell
                        className="cursor-pointer select-none font-mono text-xs text-[#6B7280] hover:text-[#2563EB]"
                        onDoubleClick={() => handleCopyArticleId(article.articleId)}
                        onClick={(e) => e.stopPropagation()}
                        title="双击复制文章ID"
                      >
                        {copiedTag === `id_${article.articleId}` ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            已复制
                          </span>
                        ) : (
                          article.articleId || '-'
                        )}
                      </TableCell>
                      {/* Username */}
                      <TableCell className="text-sm text-[#1A1A1A]">
                        {article.username || '-'}
                      </TableCell>
                      {/* Pushed to group */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          {/* AI Optimize */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOptimizeTitle(article.id, article.url, article.title)}
                            disabled={isOptimizing}
                            className="h-7 px-1.5 text-[#6B7280] hover:text-purple-600"
                            title="AI优化标题"
                          >
                            {isOptimizing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySingle(article)}
                            className="h-7 px-1.5 text-[#6B7280] hover:text-[#2563EB]"
                            title="复制单条"
                          >
                            {copiedTag === article.id ? (
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
                              className="h-7 px-1.5 text-red-500 hover:text-red-600"
                              title="确认删除"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(article.id)}
                              className="h-7 px-1.5 text-[#9CA3AF] hover:text-red-500"
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        {todayArticles.length > 0 && (
          <div className="mt-3 flex gap-6 text-xs text-[#9CA3AF]">
            <span>
              推群: {todayArticles.filter((a) => a.pushedToGroup).length}/{todayArticles.length}
            </span>
            <span>
              客户端: {todayArticles.filter((a) => a.addedToClient).length}/{todayArticles.length}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
