import * as z from "zod";
import { RespostaErroSchema } from "./resposta.schema";

export const ChaveIdempotenciaSchema = z
  .uuid({
    error: "A chave de idempotência deve ser um UUID válido.",
  })
  .transform((chave) => chave.toLowerCase());

export const CODIGOS_CONFLITO_IDEMPOTENCIA = [
  "OPERACAO_JA_PROCESSADA",
  "CHAVE_IDEMPOTENCIA_REUTILIZADA",
  "OPERACAO_EM_PROCESSAMENTO",
] as const;

export const CodigoConflitoIdempotenciaSchema = z.enum(
  CODIGOS_CONFLITO_IDEMPOTENCIA,
);

export const MENSAGENS_CONFLITO_IDEMPOTENCIA = {
  OPERACAO_JA_PROCESSADA:
    "A operação anterior foi concluída. Nenhuma nova alteração foi feita.",
  CHAVE_IDEMPOTENCIA_REUTILIZADA:
    "A chave de idempotência já foi utilizada com outra operação ou conteúdo.",
  OPERACAO_EM_PROCESSAMENTO:
    "A operação ainda está em processamento. Tente novamente com a mesma chave.",
} as const satisfies Record<CodigoConflitoIdempotencia, string>;

const criarErrosConflitoSchema = <TCodigo extends CodigoConflitoIdempotencia>(
  codigo: TCodigo,
) => {
  const mensagem = MENSAGENS_CONFLITO_IDEMPOTENCIA[codigo];
  const erroCampo = z.strictObject({
    campo: z.literal("chaveIdempotencia"),
    codigo: z.literal(codigo),
    mensagem: z.literal(mensagem),
  });

  return z.union([z.tuple([]), z.tuple([erroCampo])]);
};

export const RespostaOperacaoJaProcessadaSchema = RespostaErroSchema.safeExtend(
  {
    status: z.literal(409),
    codigo: z.literal("OPERACAO_JA_PROCESSADA"),
    mensagem: z.literal(MENSAGENS_CONFLITO_IDEMPOTENCIA.OPERACAO_JA_PROCESSADA),
    erros: criarErrosConflitoSchema("OPERACAO_JA_PROCESSADA"),
  },
);
export const RespostaChaveIdempotenciaReutilizadaSchema =
  RespostaErroSchema.safeExtend({
    status: z.literal(409),
    codigo: z.literal("CHAVE_IDEMPOTENCIA_REUTILIZADA"),
    mensagem: z.literal(
      MENSAGENS_CONFLITO_IDEMPOTENCIA.CHAVE_IDEMPOTENCIA_REUTILIZADA,
    ),
    erros: criarErrosConflitoSchema("CHAVE_IDEMPOTENCIA_REUTILIZADA"),
  });
export const RespostaOperacaoEmProcessamentoSchema =
  RespostaErroSchema.safeExtend({
    status: z.literal(409),
    codigo: z.literal("OPERACAO_EM_PROCESSAMENTO"),
    mensagem: z.literal(
      MENSAGENS_CONFLITO_IDEMPOTENCIA.OPERACAO_EM_PROCESSAMENTO,
    ),
    erros: criarErrosConflitoSchema("OPERACAO_EM_PROCESSAMENTO"),
  });

export const RespostaConflitoIdempotenciaSchema = z.union([
  RespostaOperacaoJaProcessadaSchema,
  RespostaChaveIdempotenciaReutilizadaSchema,
  RespostaOperacaoEmProcessamentoSchema,
]);

export type ChaveIdempotenciaInput = z.input<typeof ChaveIdempotenciaSchema>;
export type ChaveIdempotencia = z.output<typeof ChaveIdempotenciaSchema>;
export type CodigoConflitoIdempotencia = z.output<
  typeof CodigoConflitoIdempotenciaSchema
>;
export type RespostaConflitoIdempotencia = z.output<
  typeof RespostaConflitoIdempotenciaSchema
>;
