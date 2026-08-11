export function cleanImagePath(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = String(url).trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  if (cleaned.startsWith('data:')) return cleaned;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;

  cleaned = cleaned.replace(/\\/g, '/');

  const parts = cleaned.split('/');
  const filename = parts.pop() || '';
  if (!filename) return '';

  return `Images/${filename}`;
}
