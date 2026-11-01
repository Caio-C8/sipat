import {
  CorrigirItemInventarioBodySchema,
  type CorrigirItemInventarioBodyData,
  type ItemInventarioResponse,
} from "@repo/contracts";
import type { ApiError } from "../../../lib/api/api-error";

export type CorrecaoChoice = "TRAZER_PARA_CADASTRADO" | "MANTER_ENCONTRADO";

export function buildCorrecaoBody(
  choice: CorrecaoChoice,
  observation: string,
): CorrigirItemInventarioBodyData {
  const trimmed = observation.trim();
  return CorrigirItemInventarioBodySchema.parse({
    tipoCorrecao:
      choice === "TRAZER_PARA_CADASTRADO"
        ? "RETORNO_AO_SETOR_CADASTRADO"
        : "TRANSFERENCIA_CADASTRAL",
    ...(trimmed ? { observacao: trimmed } : {}),
  });
}

export function isPendingDivergence(item: ItemInventarioResponse) {
  return (
    (item.situacao === "DIVERGENCIA" && item.statusCorrecao === "PENDENTE") ||
    (item.situacao === "NAO_LOCALIZADO" &&
      item.localizacaoPosterior?.statusCorrecao === "PENDENTE")
  );
}

export function correcaoErrorMessage(error: ApiError) {
  if (error.status === 401)
    return "Sua sessão expirou. Entre novamente para continuar.";
  if (error.status === 403) return "Seu perfil não pode corrigir ocorrências.";
  if (error.status === 404 || error.code === "ITEM_INVENTARIO_NAO_ENCONTRADO")
    return "O item do inventário não foi encontrado.";
  if (error.code === "INVENTARIO_FINALIZADO")
    return "O inventário foi finalizado e não aceita novas correções.";
  if (error.code === "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL")
    return "Esta ocorrência não está mais pendente. O resumo será atualizado.";
  if (error.status === 409)
    return "O item foi alterado por outra pessoa. Os dados foram atualizados.";
  if (error.kind === "timeout")
    return "A correção demorou mais que o esperado. Tente novamente.";
  if (error.kind === "network")
    return "Sem conexão. Não foi possível confirmar o resultado da correção; verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível confirmar a correção. Atualize os dados e tente novamente.";
  return "Não foi possível registrar a correção.";
}
