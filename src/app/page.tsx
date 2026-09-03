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
  ChevronDown,
  Copy,
} from 'lucide-react';
import { extractFromUrl, formatCopyText, generateId } from '@/lib/article-utils';
import {
  type Article,
  type UserMap,
  loadArticles,
  saveArticles,
  getUserId,
  getUsername,
  setUsername,
  clearUsername,
  loadArticlesFromServer,
  saveArticlesToServer,
} from '@/lib/store';
import * as XLSX from 'xlsx';
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

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
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

async function addUserMapEntries(entries: Record<string, string>): Promise<UserMap | null> {
  try {
    const res = await fetch('/api/usermap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return null;
}

async function removeUserMapEntry(uid: string): Promise<UserMap | null> {
  try {
    const res = await fetch(`/api/usermap?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return null;
}

// User map entry component with edit functionality
function UserMapEntry({ uid, name, onUpdate, onRemove }: {
  uid: string;
  name: string;
  onUpdate: (newName: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== name) {
      onUpdate(editValue.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md bg-[#F8F9FA] px-3 py-2 text-sm">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[#6B7280]">{uid}</span>
          <span className="text-[#D1D5DB]">&rarr;</span>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className="flex-1 rounded border border-[#E5E7EB] bg-white px-2 py-0.5 text-sm focus:border-[#2563EB] focus:outline-none"
          />
        </div>
      ) : (
        <span
          className="cursor-pointer flex-1"
          onClick={() => setEditing(true)}
          title="点击编辑"
        >
          <span className="text-[#6B7280]">{uid}</span>
          <span className="mx-2 text-[#D1D5DB]">&rarr;</span>
          <span className="font-medium text-[#1A1A1A] hover:text-[#2563EB]">{name}</span>
        </span>
      )}
      <button
        onClick={onRemove}
        className="ml-2 text-[#9CA3AF] hover:text-red-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
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
  // Login state
  const [username, setUsernameState] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // User ID for server-side storage
  const [userId, setUserId] = useState<string>('');
  // Today's articles (blank on load)
  const [todayArticles, setTodayArticles] = useState<Article[]>([]);
  // All historical articles
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [userMapLoading, setUserMapLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);

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
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [historySelectedIds, setHistorySelectedIds] = useState<Set<string>>(new Set());

  // Check login status on mount
  useEffect(() => {
    const storedUsername = getUsername();
    if (storedUsername) {
      setUsernameState(storedUsername);
      setUserId(storedUsername);
    }
    fetchUserMap().then((map) => {
      setUserMap(map);
      setUserMapLoading(false);
    });
  }, []);

  // Load articles when user is logged in
  useEffect(() => {
    if (!username) return;

    // Load articles from server
    loadArticlesFromServer(username).then((serverArticles) => {
      // Also check localStorage for migration
      const localArticles = loadArticles();

      // If server has no data but local does, migrate to server
      if (serverArticles.length === 0 && localArticles.length > 0) {
        saveArticlesToServer(username, localArticles);
        setAllArticles(localArticles);
      } else {
        setAllArticles(serverArticles);
      }
      setLoading(false);
    });

    // Today's articles: only those created today (start blank)
    const todayKey = getTodayKey();
    const today = allArticles.filter((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    });
    setTodayArticles(today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Handle login
  const handleLogin = useCallback(() => {
    const trimmed = loginInput.trim();
    if (!trimmed) return;
    setLoginLoading(true);
    setUsername(trimmed);
    setUsernameState(trimmed);
    setUserId(trimmed);
    setLoginLoading(false);
  }, [loginInput]);

  // Handle logout
  const handleLogout = useCallback(() => {
    clearUsername();
    setUsernameState(null);
    setUserId('');
    setTodayArticles([]);
    setAllArticles([]);
    setLoginInput('');
  }, []);

  // Persist all articles to server
  const updateAllArticles = useCallback((next: Article[]) => {
    setAllArticles(next);
    saveArticles(next); // Keep local cache
    if (userId) {
      saveArticlesToServer(userId, next); // Save to server
    }
    // Update today's articles
    const todayKey = getTodayKey();
    const today = next.filter((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey;
    });
    setTodayArticles(today);
  }, [userId]);

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

  // Export to Excel
  const handleExportExcel = () => {
    const data = filtered.map((a) => ({
      '日期': new Date(a.createdAt).toLocaleDateString('zh-CN'),
      '标题': a.title,
      '链接': a.url,
      '文章ID': a.articleId,
      '用户ID': a.userId,
      '用户名': a.username,
      '分类': a.category === 'industry' ? '产业稿' : '新车稿',
      '已推群': a.pushedToGroup ? '是' : '否',
      '已加客户端': a.addedToClient ? '是' : '否',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '文章列表');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // 日期
      { wch: 40 }, // 标题
      { wch: 50 }, // 链接
      { wch: 15 }, // 文章ID
      { wch: 10 }, // 用户ID
      { wch: 12 }, // 用户名
      { wch: 8 },  // 分类
      { wch: 8 },  // 已推群
      { wch: 10 }, // 已加客户端
    ];

    const fileName = `文章工作台_${getTodayKey()}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
      if (updated) {
        setUserMap(updated);
        // Update usernames in articles
        setTodayArticles((prev) =>
          prev.map((a) =>
            entries[a.userId] ? { ...a, username: entries[a.userId] } : a
          )
        );
        setAllArticles((prev) =>
          prev.map((a) =>
            entries[a.userId] ? { ...a, username: entries[a.userId] } : a
          )
        );
      } else {
        alert('添加失败，请重试');
      }
    }
    setBatchInput('');
    setBatchAdding(false);
  };

  // Remove user mapping via API
  const handleRemoveUserMap = async (uid: string) => {
    const updated = await removeUserMapEntry(uid);
    if (updated) {
      setUserMap(updated);
    } else {
      alert('删除失败，请重试');
    }
  };

  // Update user mapping via API
  const handleUpdateUserMap = async (uid: string, newName: string) => {
    const updated = await addUserMapEntries({ [uid]: newName });
    if (updated) {
      setUserMap(updated);
      // Also update usernames in today's articles and all articles
      setTodayArticles((prev) =>
        prev.map((a) => (a.userId === uid ? { ...a, username: newName } : a))
      );
      setAllArticles((prev) =>
        prev.map((a) => (a.userId === uid ? { ...a, username: newName } : a))
      );
    } else {
      alert('更新失败，请重试');
    }
  };

  // History panel functions
  const toggleDateExpanded = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const toggleHistorySelect = (id: string) => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleHistoryGroupSelect = (date: string) => {
    const groupArticles = historyGroups[date];
    const allSelected = groupArticles.every((a) => historySelectedIds.has(a.id));
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupArticles.forEach((a) => next.delete(a.id));
      } else {
        groupArticles.forEach((a) => next.add(a.id));
      }
      return next;
    });
  };

  const handleHistoryCopySingle = async (article: Article) => {
    const text = formatCopyText(article.title, article.url);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag(`history_${article.id}`);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  const handleHistoryCopyGroup = async (date: string) => {
    const groupArticles = historyGroups[date];
    const text = groupArticles
      .map((a) => formatCopyText(a.title, a.url))
      .join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag(`history_group_${date}`);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  const handleHistoryCopySelected = async () => {
    const selected = allArticles.filter((a) => historySelectedIds.has(a.id));
    const text = selected
      .map((a) => formatCopyText(a.title, a.url))
      .join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag('history_selected');
      setTimeout(() => setCopiedTag(null), 1500);
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

  const selectedCount = filtered.filter((a) => selectedIds.has(a.id)).length;
  const historySelectedCount = allArticles.filter((a) => historySelectedIds.has(a.id)).length;

  // History data grouped by date
  const historyGroups = groupByDate(allArticles);
  const historyDates = Object.keys(historyGroups).sort((a, b) => b.localeCompare(a));
  const todayKey = getTodayKey();

  // Login screen
  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-xl font-semibold text-[#1A1A1A]">文章工作台</h1>
          <p className="mb-6 text-center text-sm text-[#6B7280]">输入用户名开始使用</p>
          <div className="space-y-4">
            <Input
              placeholder="请输入用户名"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loginLoading) {
                  handleLogin();
                }
              }}
              className="h-10"
              autoFocus
            />
            <Button
              className="w-full h-10"
              onClick={handleLogin}
              disabled={!loginInput.trim() || loginLoading}
            >
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '进入'}
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            用户名用于标识你的数据，换设备输入相同用户名即可恢复
          </p>
        </div>
      </div>
    );
  }

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
            <span className="text-sm text-[#6B7280]">
              用户：<span className="font-medium text-[#1A1A1A]">{username}</span>
            </span>
            <Button variant="ghost" size="sm" className="text-[#9CA3AF]" onClick={handleLogout}>
              切换
            </Button>
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
              <SheetContent className="w-[90vw] overflow-y-auto sm:max-w-[1200px]">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>历史记录</SheetTitle>
                    {historySelectedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleHistoryCopySelected()}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        复制选中 ({historySelectedCount})
                      </Button>
                    )}
                  </div>
                  {/* Overall statistics */}
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>共 {allArticles.length} 篇</span>
                    <span className="text-[#6366F1]">产业稿 {allArticles.filter(a => a.category === 'industry').length}</span>
                    <span className="text-[#0891B2]">新车稿 {allArticles.filter(a => a.category === 'newcar').length}</span>
                    <span className="text-green-600">已推群 {allArticles.filter(a => a.pushedToGroup).length}</span>
                    <span className="text-orange-500">已加客户端 {allArticles.filter(a => a.addedToClient).length}</span>
                  </div>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {historyDates.map((date) => {
                    const groupArticles = historyGroups[date];
                    const industryCount = groupArticles.filter(a => a.category === 'industry').length;
                    const newcarCount = groupArticles.filter(a => a.category === 'newcar').length;
                    const pushedCount = groupArticles.filter(a => a.pushedToGroup).length;
                    const clientCount = groupArticles.filter(a => a.addedToClient).length;
                    const isExpanded = expandedDates.has(date);
                    const allGroupSelected = groupArticles.every(a => historySelectedIds.has(a.id));
                    const someGroupSelected = groupArticles.some(a => historySelectedIds.has(a.id));

                    return (
                      <div key={date} className="rounded-lg border bg-white">
                        {/* Date group header */}
                        <div className="flex items-center gap-3 border-b px-4 py-2.5">
                          <button
                            onClick={() => toggleDateExpanded(date)}
                            className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A] hover:text-[#2563EB]"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                            {date === todayKey ? '今天' : date}
                          </button>
                          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                            <span>{groupArticles.length} 篇</span>
                            {industryCount > 0 && <span className="text-[#6366F1]">产业 {industryCount}</span>}
                            {newcarCount > 0 && <span className="text-[#0891B2]">新车 {newcarCount}</span>}
                            {pushedCount > 0 && <span className="text-green-600">已推群 {pushedCount}</span>}
                            {clientCount > 0 && <span className="text-orange-500">已加客户端 {clientCount}</span>}
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Checkbox
                              checked={allGroupSelected}
                              ref={someGroupSelected && !allGroupSelected ? undefined : undefined}
                              onCheckedChange={() => toggleHistoryGroupSelect(date)}
                              aria-label={`选择${date}全部`}
                              data-state={allGroupSelected ? 'checked' : someGroupSelected ? 'indeterminate' : 'unchecked'}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs text-[#6B7280]"
                              onClick={() => handleHistoryCopyGroup(date)}
                            >
                              <Copy className="h-3 w-3" />
                              复制全部
                            </Button>
                          </div>
                        </div>
                        {/* Expanded table */}
                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-[#F8F9FA] text-xs text-[#6B7280]">
                                  <th className="w-10 px-3 py-2"></th>
                                  <th className="w-20 px-3 py-2 text-left">时间</th>
                                  <th className="min-w-[200px] px-3 py-2 text-left">标题 + 链接</th>
                                  <th className="w-28 px-3 py-2 text-left">文章ID</th>
                                  <th className="w-24 px-3 py-2 text-left">用户名</th>
                                  <th className="w-16 px-3 py-2 text-center">推群</th>
                                  <th className="w-16 px-3 py-2 text-center">客户端</th>
                                  <th className="w-20 px-3 py-2 text-center">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupArticles.map((article) => (
                                  <tr
                                    key={article.id}
                                    className={`border-b transition-colors ${
                                      historySelectedIds.has(article.id) ? 'bg-blue-50/50' : 'hover:bg-[#F8F9FA]'
                                    }`}
                                  >
                                    <td className="px-3 py-2">
                                      <Checkbox
                                        checked={historySelectedIds.has(article.id)}
                                        onCheckedChange={() => toggleHistorySelect(article.id)}
                                        aria-label={`选择 ${article.title}`}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-xs text-[#6B7280]">
                                      {formatTime(article.createdAt)}
                                    </td>
                                    <td className="px-3 py-2">
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
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-[#1A1A1A]">{article.title}</p>
                                          <p className="truncate text-xs text-[#9CA3AF]">{article.url}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className="cursor-pointer font-mono text-xs text-[#6B7280] hover:text-[#2563EB]"
                                        title="双击复制"
                                        onDoubleClick={() => handleCopyArticleId(article.articleId)}
                                      >
                                        {article.articleId}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-[#6B7280]">{article.username}</td>
                                    <td className="px-3 py-2 text-center">
                                      <Checkbox
                                        checked={article.pushedToGroup}
                                        onCheckedChange={() =>
                                          updateAllArticles(
                                            allArticles.map((a) =>
                                              a.id === article.id ? { ...a, pushedToGroup: !a.pushedToGroup } : a
                                            )
                                          )
                                        }
                                        aria-label="推群"
                                        className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <Checkbox
                                        checked={article.addedToClient}
                                        onCheckedChange={() =>
                                          updateAllArticles(
                                            allArticles.map((a) =>
                                              a.id === article.id ? { ...a, addedToClient: !a.addedToClient } : a
                                            )
                                          )
                                        }
                                        aria-label="客户端"
                                        className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        onClick={() => handleHistoryCopySingle(article)}
                                        className="text-[#9CA3AF] hover:text-[#2563EB]"
                                        title="复制"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allArticles.length === 0 && (
                    <p className="py-8 text-center text-sm text-[#9CA3AF]">
                      暂无历史记录
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Dialog open={userMapOpen} onOpenChange={(open) => {
              setUserMapOpen(open);
              // Refresh userMap when dialog opens
              if (open) {
                fetchUserMap().then((map) => setUserMap(map));
              }
            }}>
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
                    所有用户共享此映射库，点击可编辑用户名
                  </p>
                  <div className="max-h-60 space-y-1.5 overflow-y-auto">
                    {Object.entries(userMap).map(([uid, name]) => (
                      <UserMapEntry
                        key={uid}
                        uid={uid}
                        name={name}
                        onUpdate={(newName) => handleUpdateUserMap(uid, newName)}
                        onRemove={() => handleRemoveUserMap(uid)}
                      />
                    ))}
                    {Object.keys(userMap).length === 0 && !userMapLoading && (
                      <p className="py-4 text-center text-sm text-[#9CA3AF]">暂无映射</p>
                    )}
                    {userMapLoading && (
                      <p className="py-4 text-center text-sm text-[#9CA3AF]">加载中...</p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              className="gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M8 13h2l2 4 2-4h2"/>
              </svg>
              导出 Excel
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
