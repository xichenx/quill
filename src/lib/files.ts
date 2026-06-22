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

function isTauri(): boolean {
  return !!(window as any).__TAURI_INTERNALS__;
}

export async function readPdfPath(path: string): Promise<OpenedFile> {
  if (isTauri()) {
    const buf = await invoke<ArrayBuffer>("read_file", { path });
    return { path, name: baseName(path), data: buf };
  }
  throw new Error("readPdfPath 仅在 Tauri 环境中可用");
}

export async function openPdfDialog(): Promise<OpenedFile | null> {
  // Tauri 原生环境
  if (isTauri()) {
    const selected = await open({
      multiple: false,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!selected || typeof selected !== "string") return null;
    return readPdfPath(selected);
  }

  // 浏览器环境：使用原生 <input type="file">
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        resolve(await fileToOpened(file));
      } else {
        resolve(null);
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function fileToOpened(file: File): Promise<OpenedFile> {
  return { path: null, name: file.name, data: await file.arrayBuffer() };
}
