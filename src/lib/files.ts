import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface OpenedFile {
  path: string | null;
  name: string;
  data: ArrayBuffer;
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export async function readPdfPath(path: string): Promise<OpenedFile> {
  const buf = await invoke<ArrayBuffer>("read_file", { path });
  return { path, name: baseName(path), data: buf };
}

export async function openPdfDialog(): Promise<OpenedFile | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!selected || typeof selected !== "string") return null;
  return readPdfPath(selected);
}

export async function fileToOpened(file: File): Promise<OpenedFile> {
  return { path: null, name: file.name, data: await file.arrayBuffer() };
}
