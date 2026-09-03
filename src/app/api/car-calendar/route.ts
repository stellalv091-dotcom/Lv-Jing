import { NextResponse } from 'next/server';
import { readCarCalendarFile, writeCarCalendarFile, type CarLaunchEvent } from '@/lib/car-calendar-file';

export async function GET() {
  const data = readCarCalendarFile();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event } = body as { event: CarLaunchEvent };
    if (!event || !event.brand || !event.model || !event.launchDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const current = readCarCalendarFile();
    current.push(event);
    writeCarCalendarFile(current);
    return NextResponse.json(current);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const current = readCarCalendarFile();
    const filtered = current.filter((e) => e.id !== id);
    writeCarCalendarFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
