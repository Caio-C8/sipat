import { isApiError } from "./api-error";

export type TentativaIdempotente = {
  assinatura: string;
  chave: string;
};

export function obterTentativaIdempotente(
  atual: TentativaIdempotente | null,
  assinatura: string,
  gerarChave: () => string = () => crypto.randomUUID(),
): TentativaIdempotente {
  return atual?.assinatura === assinatura
    ? atual
    : { assinatura, chave: gerarChave() };
}

export const MENSAGEM_OPERACAO_JA_PROCESSADA =
  "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.";

export type DecisaoIdempotencia =
  | {
      tipo: "ja_processada";
      manterChave: false;
      atualizarConsultas: true;
    }
  | {
      tipo: "chave_reutilizada";
      manterChave: false;
      atualizarConsultas: false;
    }
  | {
      tipo: "em_processamento";
      manterChave: true;
      atualizarConsultas: false;
    }
  | {
      tipo: "resultado_incerto";
      manterChave: true;
      atualizarConsultas: false;
    }
  | {
      tipo: "falha_conclusiva";
      manterChave: false;
      atualizarConsultas: false;
    };

export function decidirAposFalha(erro: unknown): DecisaoIdempotencia {
  if (!isApiError(erro)) {
    return {
      tipo: "resultado_incerto",
      manterChave: true,
      atualizarConsultas: false,
    };
  }

  if (erro.codigo === "OPERACAO_JA_PROCESSADA") {
    return {
      tipo: "ja_processada",
      manterChave: false,
      atualizarConsultas: true,
    };
  }
  if (erro.codigo === "CHAVE_IDEMPOTENCIA_REUTILIZADA") {
    return {
      tipo: "chave_reutilizada",
      manterChave: false,
      atualizarConsultas: false,
    };
  }
  if (erro.codigo === "OPERACAO_EM_PROCESSAMENTO") {
    return {
      tipo: "em_processamento",
      manterChave: true,
      atualizarConsultas: false,
    };
  }

  const resultadoIncerto =
    erro.status === null ||
    erro.status >= 500 ||
    ["rede", "timeout", "resposta_invalida"].includes(erro.categoria) ||
    [
      "CONFLITO_CONCORRENTE_MOVIMENTACAO",
      "CONFLITO_CONCORRENTE_REAVALIACAO",
    ].includes(erro.codigo);

  return resultadoIncerto
    ? {
        tipo: "resultado_incerto",
        manterChave: true,
        atualizarConsultas: false,
      }
    : {
        tipo: "falha_conclusiva",
        manterChave: false,
        atualizarConsultas: false,
      };
}

export function mensagemConflitoIdempotencia(erro: unknown): string | null {
  if (!isApiError(erro)) return null;
  if (erro.codigo === "OPERACAO_JA_PROCESSADA") {
    return MENSAGEM_OPERACAO_JA_PROCESSADA;
  }
  if (erro.codigo === "CHAVE_IDEMPOTENCIA_REUTILIZADA") {
    return "A confirmação anterior não pode ser reutilizada com estes dados. Revise o formulário e confirme novamente.";
  }
  if (erro.codigo === "OPERACAO_EM_PROCESSAMENTO") {
    return "Esta operação ainda está em processamento. Aguarde e tente novamente manualmente; os dados e a chave foram preservados.";
  }
  return null;
}

export function isConflitoIdempotencia(erro: unknown): boolean {
  return mensagemConflitoIdempotencia(erro) !== null;
}

export function tentativaAposFalha<T>(tentativa: T, erro: unknown): T | null {
  return decidirAposFalha(erro).manterChave ? tentativa : null;
}
