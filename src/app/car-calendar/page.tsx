'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Car,
} from 'lucide-react';
import Link from 'next/link';

interface CarLaunchEvent {
  id: string;
  brand: string;
  model: string;
  launchDate: string;
  category: 'sedan' | 'suv' | 'mpv' | 'ev' | 'other';
  notes: string;
  createdAt: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  sedan: '轿车',
  suv: 'SUV',
  mpv: 'MPV',
  ev: '新能源',
  other: '其他',
};

const CATEGORY_COLORS: Record<string, string> = {
  sedan: 'bg-blue-100 text-blue-700',
  suv: 'bg-green-100 text-green-700',
  mpv: 'bg-purple-100 text-purple-700',
  ev: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function generateId(): string {
  return new Date().getTime().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CarCalendarPage() {
  const [events, setEvents] = useState<CarLaunchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<CarLaunchEvent['category']>('sedan');
  const [newNotes, setNewNotes] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selected day for quick add
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/car-calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Add event
  const handleAddEvent = async () => {
    if (!newBrand.trim() || !newModel.trim() || !newDate) return;
    const now = new Date().getTime();
    const event: CarLaunchEvent = {
      id: generateId(),
      brand: newBrand.trim(),
      model: newModel.trim(),
      launchDate: newDate,
      category: newCategory,
      notes: newNotes.trim(),
      createdAt: now,
    };
    try {
      const res = await fetch('/api/car-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch { /* ignore */ }
    setDialogOpen(false);
    resetForm();
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/car-calendar?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  const resetForm = () => {
    setNewBrand('');
    setNewModel('');
    setNewDate('');
    setNewCategory('sedan');
    setNewNotes('');
    setSelectedDay(null);
  };

  // Open dialog with pre-filled date
  const openAddDialog = (day?: number) => {
    resetForm();
    if (day !== undefined) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setNewDate(dateStr);
      setSelectedDay(day);
    }
    setDialogOpen(true);
  };

  // Navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (day: number): CarLaunchEvent[] => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.launchDate === dateStr);
  };

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day;

  // Upcoming events (next 30 days)
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.launchDate);
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();
      return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => a.launchDate.localeCompare(b.launchDate));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-[#6B7280] hover:text-[#2563EB]"
            >
              &larr; 工作台
            </Link>
            <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
              <Car className="h-5 w-5" />
              新车上市日历
            </h1>
          </div>
          <Button onClick={() => openAddDialog()} className="gap-1.5">
            <Plus className="h-4 w-4" />
            添加新车
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <div className="rounded-lg border bg-white p-5">
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold text-[#1A1A1A]">
                {currentYear}年{currentMonth + 1}月
              </h2>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-[#6B7280]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 rounded border border-transparent" />
              ))}
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDate(day);
                const hasEvents = dayEvents.length > 0;
                return (
                  <div
                    key={day}
                    className={`group relative h-20 cursor-pointer rounded border p-1.5 transition-colors hover:border-[#2563EB]/30 hover:bg-[#F0F4FF] ${
                      isToday(day) ? 'border-[#2563EB] bg-blue-50/50' : 'border-[#E5E7EB]'
                    }`}
                    onDoubleClick={() => openAddDialog(day)}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-xs font-medium ${
                          isToday(day) ? 'text-[#2563EB]' : 'text-[#6B7280]'
                        }`}
                      >
                        {day}
                      </span>
                      {hasEvents && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    {/* Event dots */}
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                            CATEGORY_COLORS[event.category]
                          }`}
                          title={`${event.brand} ${event.model}`}
                        >
                          {event.brand} {event.model}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-[#9CA3AF]">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[#9CA3AF]">
              双击日期可快速添加新车上市信息
            </p>
          </div>

          {/* Sidebar - Upcoming events */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">
                近期上市 ({upcomingEvents.length})
              </h3>
              {loading ? (
                <p className="py-4 text-center text-sm text-[#9CA3AF]">加载中...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#9CA3AF]">暂无近期上市新车</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between rounded-md bg-[#F8F9FA] p-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1A1A1A]">
                            {event.brand} {event.model}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              CATEGORY_COLORS[event.category]
                            }`}
                          >
                            {CATEGORY_LABELS[event.category]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#6B7280]">
                          {event.launchDate}
                        </p>
                        {event.notes && (
                          <p className="mt-0.5 text-xs text-[#9CA3AF]">{event.notes}</p>
                        )}
                      </div>
                      {deleteId === event.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-green-600"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-[#9CA3AF] hover:text-red-500"
                          onClick={() => setDeleteId(event.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All events list */}
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">
                全部记录 ({events.length})
              </h3>
              <div className="max-h-[400px] space-y-1.5 overflow-y-auto">
                {events
                  .sort((a, b) => b.launchDate.localeCompare(a.launchDate))
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-[#F8F9FA]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#9CA3AF]">{event.launchDate.slice(5)}</span>
                        <span className="text-[#1A1A1A]">
                          {event.brand} {event.model}
                        </span>
                      </div>
                      <span
                        className={`rounded px-1 py-0.5 text-[10px] ${
                          CATEGORY_COLORS[event.category]
                        }`}
                      >
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    </div>
                  ))}
                {events.length === 0 && (
                  <p className="py-4 text-center text-sm text-[#9CA3AF]">暂无记录</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `添加新车 - ${currentMonth + 1}月${selectedDay}日` : '添加新车上市'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  品牌
                </label>
                <Input
                  placeholder="如：比亚迪"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  车型
                </label>
                <Input
                  placeholder="如：海豹06"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  上市日期
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  车型分类
                </label>
                <Select
                  value={newCategory}
                  onValueChange={(v) => setNewCategory(v as CarLaunchEvent['category'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">轿车</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="mpv">MPV</SelectItem>
                    <SelectItem value="ev">新能源</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                备注（可选）
              </label>
              <Input
                placeholder="如：预计售价15-20万"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddEvent}
              disabled={!newBrand.trim() || !newModel.trim() || !newDate}
              className="w-full"
            >
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
