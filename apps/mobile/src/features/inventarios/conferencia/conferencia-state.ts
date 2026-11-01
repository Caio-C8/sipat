import {
  ItemJaVerificadoOutroSetorDadosSchema,
  NumeroPatrimonialSchema,
  type ItemJaVerificadoOutroSetorDados,
} from "@repo/contracts";
import type { ApiError } from "../../../lib/api/api-error";

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
  available: boolean;
  focused: boolean;
  granted: boolean;
  modalOpen: boolean;
  submitting: boolean;
}) {
  return (
    input.available &&
    input.focused &&
    input.granted &&
    !input.modalOpen &&
    !input.submitting
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
