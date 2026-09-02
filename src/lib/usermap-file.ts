import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'usermap.json');

// 默认用户名映射
const DEFAULT_MAP: Record<string, string> = {
  '185351': '车动态',
  '118560': '搜狐汽车',
  '121777': '搜狐汽车',
  '151284': '搜狐汽车',
};

export function readUserMapFile(): Record<string, string> {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      writeUserMapFile(DEFAULT_MAP);
      return { ...DEFAULT_MAP };
    }
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return { ...DEFAULT_MAP, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MAP };
  }
}

export function writeUserMapFile(data: Record<string, string>): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
