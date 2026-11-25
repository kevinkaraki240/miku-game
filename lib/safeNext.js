// Chỉ cho phép đường dẫn nội bộ dạng "/abc", chặn "//evil.com" và "https://..."
export function safeNext(value) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
}