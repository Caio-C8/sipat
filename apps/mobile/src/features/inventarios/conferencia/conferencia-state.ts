import {
  ItemJaVerificadoOutroSetorDadosSchema,
  NumeroPatrimonialSchema,
  type ItemJaVerificadoOutroSetorDados,
} from "@repo/contracts";
import type { BarcodeScanningResult } from "expo-camera";
import type { ApiError } from "../../../lib/api/api-error";

const SCAN_GUIDE = {
  left: 0.1,
  right: 0.9,
  top: 0.24,
  bottom: 0.76,
} as const;

export function normalizeNumeroPatrimonial(value: string) {
  const normalized = value.trim().toUpperCase();
  const match = /^(SP-)?(\d+)$/.exec(normalized);
  if (!match) return normalized;
  const numericPart = match[2];
  if (!numericPart) return normalized;
  const digits = numericPart.replace(/^0+(?=\d)/, "");
  return `${match[1] ?? ""}${digits}`;
}

export function parseNumeroPatrimonial(value: string) {
  return NumeroPatrimonialSchema.safeParse(normalizeNumeroPatrimonial(value));
}

export function numeroPatrimonialDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function composeNumeroPatrimonial(
  digits: string,
  withoutOfficialNumber: boolean,
) {
  const numericPart = numeroPatrimonialDigits(digits);
  return withoutOfficialNumber ? `SP-${numericPart}` : numericPart;
}

export function itemJaVerificadoData(
  error: ApiError,
): ItemJaVerificadoOutroSetorDados | null {
  if (error.code !== "ITEM_INVENTARIO_JA_VERIFICADO") return null;
  const parsed = ItemJaVerificadoOutroSetorDadosSchema.safeParse(error.data);
  return parsed.success ? parsed.data : null;
}

export function conferenciaErrorMessage(error: ApiError) {
  if (error.status === 401)
    return "Sua sessão expirou. Entre novamente para continuar.";
  if (error.status === 403)
    return "Seu perfil não pode registrar conferências.";
  if (error.code === "ITEM_INVENTARIO_NAO_ENCONTRADO")
    return "Este número não faz parte deste inventário.";
  if (error.code === "ITEM_INVENTARIO_JA_VERIFICADO") {
    const data = itemJaVerificadoData(error);
    return data
      ? `Este item já foi verificado em ${data.setorPrimeiraVerificacao.nome}.`
      : "Este item já foi verificado em outro setor.";
  }
  if (error.code === "SETOR_INVENTARIO_FORA_DE_ANDAMENTO")
    return "Este setor não está mais em andamento. Atualize os dados antes de continuar.";
  if (error.code === "INVENTARIO_FORA_DE_ANDAMENTO")
    return "O inventário não está mais em andamento.";
  if (error.status === 409)
    return "A conferência foi alterada por outra pessoa. Os dados foram atualizados.";
  if (error.kind === "timeout")
    return "A verificação demorou mais que o esperado. Tente novamente.";
  if (error.kind === "network")
    return "Sem conexão. Não foi possível confirmar o resultado da leitura; verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível confirmar a leitura. Atualize os dados e tente novamente.";
  return "Não foi possível verificar este item.";
}

export function shouldMountCamera(input: {
  appActive: boolean;
  available: boolean;
  focused: boolean;
  granted: boolean;
  modalOpen: boolean;
  paused: boolean;
  submitting: boolean;
}) {
  return (
    input.appActive &&
    input.available &&
    input.focused &&
    input.granted &&
    !input.modalOpen &&
    !input.paused &&
    !input.submitting
  );
}

export function isBarcodeInsideScanGuide(
  result: BarcodeScanningResult,
  frame: Readonly<{ height: number; width: number }>,
) {
  const points = result.cornerPoints.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  const bounds = result.bounds;
  const boundsUsable =
    Number.isFinite(bounds.origin.x) &&
    Number.isFinite(bounds.origin.y) &&
    Number.isFinite(bounds.size.width) &&
    Number.isFinite(bounds.size.height) &&
    bounds.size.width > 0 &&
    bounds.size.height > 0;

  let center: Readonly<{ x: number; y: number }> | null = null;
  if (points.length > 0) {
    center = {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
  } else if (boundsUsable) {
    center = {
      x: bounds.origin.x + bounds.size.width / 2,
      y: bounds.origin.y + bounds.size.height / 2,
    };
  }

  // Some barcode types and platforms omit geometry. Keep those compatible
  // instead of making otherwise valid patrimonial labels impossible to read.
  if (!center || frame.width <= 0 || frame.height <= 0) return true;

  return (
    center.x >= frame.width * SCAN_GUIDE.left &&
    center.x <= frame.width * SCAN_GUIDE.right &&
    center.y >= frame.height * SCAN_GUIDE.top &&
    center.y <= frame.height * SCAN_GUIDE.bottom
  );
}

export function tryAcquireSubmission(lock: { current: boolean }) {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function releaseSubmission(lock: { current: boolean }) {
  lock.current = false;
}
