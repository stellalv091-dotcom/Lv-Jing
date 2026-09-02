import { NextResponse } from 'next/server';
import { readUserMapFile, writeUserMapFile } from '@/lib/usermap-file';

export async function GET() {
  const data = readUserMapFile();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entries } = body as { entries: Record<string, string> };
    if (!entries || typeof entries !== 'object') {
      return NextResponse.json({ error: 'Invalid entries' }, { status: 400 });
    }
    const current = readUserMapFile();
    const merged = { ...current, ...entries };
    writeUserMapFile(merged);
    return NextResponse.json(merged);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }
    const current = readUserMapFile();
    delete current[uid];
    writeUserMapFile(current);
    return NextResponse.json(current);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
