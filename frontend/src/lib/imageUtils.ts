export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = url.trim();
  
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim(); // handle nested escaped quotes

  if (cleaned.startsWith('data:')) return cleaned;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned.replace(/ /g, '%20');
  }

  // Replace backslashes with forward slashes
  cleaned = cleaned.replace(/\\/g, '/');

  // Strip drive letters, file:///, or local workspace prefixes
  cleaned = cleaned.replace(/^file:\/\/\//i, '');
  cleaned = cleaned.replace(/^[a-zA-Z]:\//, '');
  cleaned = cleaned.replace(/^.*\/Images\//i, 'Images/');

  if (!cleaned.toLowerCase().startsWith('images/')) {
    if (cleaned.startsWith('/')) cleaned = cleaned.substring(1);
    if (!cleaned.toLowerCase().startsWith('images/')) {
      cleaned = `Images/${cleaned}`;
    }
  }

  const parts = cleaned.split('/');
  const filename = parts.pop() || '';
  const dir = parts.join('/');
  return `/${dir}/${encodeURIComponent(filename)}`;
}
