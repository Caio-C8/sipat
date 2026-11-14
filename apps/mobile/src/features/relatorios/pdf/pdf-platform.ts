import { randomUUID } from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const CACHE_DIRECTORY = "relatorios-pdf";
const PDF_MIME = "application/pdf";
const webUrls = new Set<string>();

export type PdfOpenMethod = "preview" | "sharing" | "download";

export class PdfPresentationError extends Error {
  constructor(
    readonly kind:
      | "file-create"
      | "directory-create"
      | "file-write"
      | "file-validation"
      | "viewer-unavailable"
      | "open",
    options?: ErrorOptions,
  ) {
    super("Não foi possível abrir o documento.", options);
    this.name = "PdfPresentationError";
  }
}

export function releaseWebPdfUrls() {
  for (const url of webUrls) URL.revokeObjectURL(url);
  webUrls.clear();
}

export async function cleanupRelatorioPdfTemporaries() {
  if (Platform.OS === "web") {
    releaseWebPdfUrls();
    return;
  }
  try {
    const directory = new Directory(Paths.cache, CACHE_DIRECTORY);
    if (directory.exists) directory.delete();
  } catch {
    // Cache é limpo em melhor esforço e nunca bloqueia sessão ou nova emissão.
  }
}

async function openNative(bytes: Uint8Array): Promise<PdfOpenMethod> {
  let file: File;
  let directory: InstanceType<typeof Directory>;
  try {
    directory = new Directory(Paths.cache, CACHE_DIRECTORY);
    directory.create({ idempotent: true, intermediates: true });
  } catch (cause) {
    throw new PdfPresentationError("directory-create", { cause });
  }

  try {
    file = new File(directory, `${randomUUID()}.pdf`);
    file.create();
  } catch (cause) {
    throw new PdfPresentationError("file-create", { cause });
  }

  try {
    await file.write(bytes);
  } catch (cause) {
    throw new PdfPresentationError("file-write", { cause });
  }

  if (!file.exists || file.size !== bytes.length) {
    if (file.exists) file.delete();
    throw new PdfPresentationError("file-validation");
  }

  try {
    if (await file.canPreview({ mimeType: PDF_MIME })) {
      await file.preview({ mimeType: PDF_MIME, title: "Relatório SIPAT" });
      return "preview";
    }
  } catch {
    // O compartilhamento explícito é o fallback aprovado para falha do viewer.
  }

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        dialogTitle: "Abrir relatório SIPAT",
        mimeType: PDF_MIME,
        UTI: "com.adobe.pdf",
      });
      return "sharing";
    }
    throw new PdfPresentationError("viewer-unavailable");
  } catch (cause) {
    if (cause instanceof PdfPresentationError) throw cause;
    throw new PdfPresentationError("viewer-unavailable", { cause });
  }
}

async function openWeb(bytes: Uint8Array): Promise<PdfOpenMethod> {
  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  )
    throw new PdfPresentationError("open");
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([buffer], { type: PDF_MIME }));
  webUrls.add(url);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${randomUUID()}.pdf`;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      webUrls.delete(url);
    }, 1_000);
    return "download";
  } catch (cause) {
    URL.revokeObjectURL(url);
    webUrls.delete(url);
    throw new PdfPresentationError("open", { cause });
  }
}

export async function openRelatorioPdf(
  bytes: Uint8Array,
): Promise<PdfOpenMethod> {
  return Platform.OS === "web" ? openWeb(bytes) : openNative(bytes);
}
