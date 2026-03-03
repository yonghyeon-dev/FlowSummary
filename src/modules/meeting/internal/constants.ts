export const ALLOWED_EXTENSIONS = [
  "mp3",
  "m4a",
  "wav",
  "mp4",
  "mov",
] as const;

export const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "video/mp4",
  "video/quicktime",
] as const;

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function isAllowedFile(fileName: string, mimeType: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (
    ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]) &&
    ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])
  );
}

export function isWithinSizeLimit(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}
