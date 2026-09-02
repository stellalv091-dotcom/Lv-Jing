/**
 * 从搜狐文章链接中提取文章ID和用户ID
 * 例如: https://www.sohu.com/a/1070085031_185351
 * 文章ID: 1070085031 (倒数第二组数字)
 * 用户ID: 185351 (最后一组数字)
 */
export function extractFromUrl(url: string): { articleId: string; userId: string } {
  const trimmed = url.trim();
  // 匹配 URL 中所有连续数字组
  const matches = trimmed.match(/\/(\d+)_(\d+)/);
  if (matches) {
    return { articleId: matches[1], userId: matches[2] };
  }
  // fallback: 提取所有数字组
  const allNumbers = trimmed.match(/\d+/g);
  if (allNumbers && allNumbers.length >= 2) {
    return {
      articleId: allNumbers[allNumbers.length - 2],
      userId: allNumbers[allNumbers.length - 1],
    };
  }
  return { articleId: '', userId: '' };
}

/**
 * 生成纯文本格式的复制内容
 * 格式: 标题\n链接
 */
export function formatCopyText(title: string, url: string): string {
  return `${title}\n${url}`;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
