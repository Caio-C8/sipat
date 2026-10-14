import * as z from "zod";

const MensagemRespostaSchema = z
  .string()
  .trim()
  .min(1, {
    error: "A mensagem de resposta não pode ser vazia.",
  })
  .max(500, {
    error: "A mensagem de resposta deve possuir no máximo 500 caracteres.",
  });

const CodigoErroSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*$/, {
    error: "O código do erro deve estar em SNAKE_CASE maiúsculo.",
  })
  .max(100);

const StatusSucessoSchema = z.number().int().min(200).max(299);

const StatusErroSchema = z.number().int().min(400).max(599);

export const MetaPaginacaoSchema = z
  .strictObject({
    total: z.number().int().min(0),

    pagina: z.number().int().min(1),

    ultimaPagina: z.number().int().min(1),

    limite: z.number().int().min(1),
  })
  .superRefine((meta, contexto) => {
    const ultimaPaginaEsperada = Math.max(
      1,
      Math.ceil(meta.total / meta.limite),
    );

    if (meta.ultimaPagina !== ultimaPaginaEsperada) {
      contexto.addIssue({
        code: "custom",
        path: ["ultimaPagina"],
        message:
          "A última página não corresponde ao total e ao limite informados.",
      });
    }
  });

export const ErroCampoSchema = z.strictObject({
  campo: z.string().trim().min(1).max(200),

  codigo: CodigoErroSchema,

  mensagem: MensagemRespostaSchema,
});

export const RespostaErroSchema = z.strictObject({
  status: StatusErroSchema,

  sucesso: z.literal(false),

  codigo: CodigoErroSchema,

  mensagem: MensagemRespostaSchema,

  erros: z.array(ErroCampoSchema).max(100),

  requisicaoId: z.string().trim().min(1).max(128),
});

export type MetaPaginacao = z.output<typeof MetaPaginacaoSchema>;
export type ErroCampo = z.output<typeof ErroCampoSchema>;
export type RespostaErro = z.output<typeof RespostaErroSchema>;

export function criarRespostaSucessoSchema<TDadosSchema extends z.ZodType>(
  dadosSchema: TDadosSchema,
) {
  return z.strictObject({
    status: StatusSucessoSchema,

    sucesso: z.literal(true),

    mensagem: MensagemRespostaSchema,

    dados: dadosSchema,
  });
}

export function criarRespostaSucessoPaginadaSchema<
  TItemSchema extends z.ZodType,
>(itemSchema: TItemSchema) {
  return z
    .strictObject({
      status: StatusSucessoSchema,

      sucesso: z.literal(true),

      mensagem: MensagemRespostaSchema,

      dados: z.array(itemSchema),

      meta: MetaPaginacaoSchema,
    })
    .superRefine((resposta, contexto) => {
      if (resposta.dados.length > resposta.meta.limite) {
        contexto.addIssue({
          code: "custom",
          path: ["dados"],
          message:
            "A quantidade de itens não pode ser maior do que o limite da página.",
        });
      }
    });
}
