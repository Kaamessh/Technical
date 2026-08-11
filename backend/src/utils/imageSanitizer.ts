export function cleanImagePath(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = String(url).trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  if (cleaned.startsWith('data:')) return cleaned;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;

  cleaned = cleaned.replace(/\\/g, '/');
  cleaned = cleaned.replace(/^file:\/\/\//i, '');
  cleaned = cleaned.replace(/^[a-zA-Z]:\//, '');
  cleaned = cleaned.replace(/^.*\/Images\//i, 'Images/');

  if (!cleaned.toLowerCase().startsWith('images/')) {
    if (cleaned.startsWith('/')) cleaned = cleaned.substring(1);
    if (!cleaned.toLowerCase().startsWith('images/')) {
      cleaned = `Images/${cleaned}`;
    }
  }

  return cleaned;
}
