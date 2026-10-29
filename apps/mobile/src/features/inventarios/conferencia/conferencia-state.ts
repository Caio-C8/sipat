import {
  ItemJaVerificadoOutroSetorDadosSchema,
  NumeroPatrimonialSchema,
  type ItemJaVerificadoOutroSetorDados,
} from "@repo/contracts";
import type { ApiError } from "../../../lib/api/api-error";

export function normalizeNumeroPatrimonial(value: string) {
  return value.trim().toUpperCase();
}

export function parseNumeroPatrimonial(value: string) {
  return NumeroPatrimonialSchema.safeParse(normalizeNumeroPatrimonial(value));
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
    return "Este número não pertence à população fixa do inventário.";
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
    return "A verificação demorou mais que o esperado. Tente novamente explicitamente.";
  if (error.kind === "network")
    return "Sem conexão ou API indisponível. Nenhuma leitura foi salva; tente novamente.";
  if (error.kind === "invalid-response")
    return "A API retornou uma resposta fora do contrato esperado.";
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
