import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export function uploadsRootDirectory(): string {
  return path.resolve(process.env.UPLOADS_DIR?.trim() || path.resolve(__dirname, '../../..', 'uploads'));
}

export async function ensureUploadsDirectory(): Promise<string> {
  const dir = uploadsRootDirectory();
  await mkdir(dir, { recursive: true });
  return dir;
}

export function uploadsPublicUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}

export function uploadsRelativePath(fileName: string): string {
  return `uploads/${fileName}`;
}
