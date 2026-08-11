export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = String(url).trim();
  
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  if (cleaned.startsWith('data:')) return cleaned;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned.replace(/ /g, '%20');
  }

  // Replace backslashes with forward slashes
  cleaned = cleaned.replace(/\\/g, '/');

  // Extract base filename (e.g., "Screenshot 2026-08-11 171129.png")
  const parts = cleaned.split('/');
  const filename = parts.pop() || '';
  if (!filename) return '';

  return `/Images/${encodeURIComponent(filename)}`;
}
