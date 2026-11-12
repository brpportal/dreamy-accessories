// Client-side image compressor for admin uploads.
// Re-draws the photo on a canvas and re-encodes it as a brand-new file:
//  - ALL metadata is stripped (EXIF, GPS location, camera/phone info) because
//    a canvas export carries none of it — nothing about the device can leak.
//  - The long edge is capped so phone photos (often 4000px+) shrink a lot.
//  - WebP output at quality 0.82 keeps product photos crisp but small.
// If anything fails (e.g. the browser cannot decode the format), the original
// file is uploaded unchanged so a save never breaks.

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export type CompressedImage = { blob: Blob; ext: string; type: string };

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const fallback: CompressedImage = {
    blob: file,
    ext: file.name.split('.').pop()?.toLowerCase() || 'jpg',
    type: file.type || 'image/jpeg',
  };
  try {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await createImageBitmap(file);
    }
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return fallback; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', QUALITY));
    if (!blob) return fallback;
    if (blob.type === 'image/webp') return { blob, ext: 'webp', type: 'image/webp' };
    // Browser fell back to PNG (no WebP encoder) — re-encode as JPEG instead.
    const jpg = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (jpg && jpg.type === 'image/jpeg') return { blob: jpg, ext: 'jpg', type: 'image/jpeg' };
    return { blob, ext: 'png', type: blob.type || 'image/png' };
  } catch {
    return fallback;
  }
}
