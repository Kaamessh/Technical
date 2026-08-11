export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  let cleanPath = trimmed.replace(/\\/g, '/');
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  if (!cleanPath.toLowerCase().startsWith('images/')) {
    cleanPath = `Images/${cleanPath}`;
  }
  return `/${cleanPath}`;
}
