import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'car-calendar.json');

export interface CarLaunchEvent {
  id: string;
  brand: string;
  model: string;
  launchDate: string; // YYYY-MM-DD
  category: 'sedan' | 'suv' | 'mpv' | 'ev' | 'other';
  notes: string;
  createdAt: number;
}

export function readCarCalendarFile(): CarLaunchEvent[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      writeCarCalendarFile([]);
      return [];
    }
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeCarCalendarFile(data: CarLaunchEvent[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
