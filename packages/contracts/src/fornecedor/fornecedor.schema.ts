import * as z from "zod";
import {
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";

const calcularDigitoCnpj = (base: string): number => {
  let peso = 2;
  let soma = 0;

  for (let indice = base.length - 1; indice >= 0; indice -= 1) {
    soma += (base.charCodeAt(indice) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

const cnpjValido = (cnpj: string): boolean => {
  const base = cnpj.slice(0, 12);
  if (/^0{12}$/.test(base)) return false;

  const primeiroDigito = calcularDigitoCnpj(base);
  const segundoDigito = calcularDigitoCnpj(`${base}${primeiroDigito}`);
  return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`);
};

export const CnpjFornecedorSchema = z
  .string()
  .trim()
  .transform((valor) => valor.toUpperCase())
  .refine(
    (valor) =>
      /^(?:[A-Z0-9]{12}\d{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})$/.test(
        valor,
      ),
    { error: "Informe um CNPJ válido." },
  )
  .transform((valor) => valor.replace(/[./-]/g, ""))
  .refine(cnpjValido, { error: "Informe um CNPJ válido." });

const RazaoSocialFornecedorSchema = z.string().trim().min(1).max(150);
const NomeOpcionalFornecedorSchema = z.string().trim().min(1).max(150);
const EmailFornecedorSchema = z
  .string()
  .trim()
  .transform((valor) => valor.normalize("NFC").toLowerCase())
  .pipe(z.email().max(150));
const TelefoneFornecedorSchema = z.string().trim().min(1).max(30);
const EnderecoFornecedorSchema = z.string().trim().min(1).max(500);
const AtivoQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
  error: "O filtro de situação deve ser true, false, 1 ou 0.",
});
const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const FornecedorParamsSchema = z.strictObject({
  fornecedorId: z.uuid({
    error: "O identificador do fornecedor deve ser um UUID válido.",
  }),
});

export const CriarFornecedorSchema = z.strictObject({
  razaoSocial: RazaoSocialFornecedorSchema,
  nomeFantasia: NomeOpcionalFornecedorSchema.optional(),
  nomeRepresentante: NomeOpcionalFornecedorSchema.optional(),
  cnpj: CnpjFornecedorSchema.optional(),
  email: EmailFornecedorSchema.optional(),
  telefone: TelefoneFornecedorSchema.optional(),
  endereco: EnderecoFornecedorSchema.optional(),
});

export const AlterarFornecedorSchema = z
  .strictObject({
    razaoSocial: RazaoSocialFornecedorSchema.optional(),
    nomeFantasia: NomeOpcionalFornecedorSchema.nullable().optional(),
    nomeRepresentante: NomeOpcionalFornecedorSchema.nullable().optional(),
    cnpj: CnpjFornecedorSchema.nullable().optional(),
    email: EmailFornecedorSchema.nullable().optional(),
    telefone: TelefoneFornecedorSchema.nullable().optional(),
    endereco: EnderecoFornecedorSchema.nullable().optional(),
  })
  .refine(
    (dados) => Object.values(dados).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export const AlterarSituacaoFornecedorSchema = z.strictObject({
  ativo: z.boolean({ error: "A situação do fornecedor deve ser informada." }),
});

export const ListarFornecedoresQuerySchema = PaginacaoQuerySchema.extend({
  busca: z.string().trim().min(1).max(150).optional(),
  ativo: AtivoQuerySchema.optional(),
});

export const FornecedorResumoSchema = z.strictObject({
  id: z.uuid(),
  razaoSocial: RazaoSocialFornecedorSchema,
  nomeFantasia: NomeOpcionalFornecedorSchema.nullable(),
  cnpj: z
    .string()
    .regex(/^[A-Z0-9]{12}\d{2}$/)
    .refine(cnpjValido)
    .nullable(),
  ativo: z.boolean(),
});

export const FornecedorDetalheSchema = FornecedorResumoSchema.extend({
  nomeRepresentante: NomeOpcionalFornecedorSchema.nullable(),
  email: z.email().max(150).nullable(),
  telefone: TelefoneFornecedorSchema.nullable(),
  endereco: EnderecoFornecedorSchema.nullable(),
  createdById: z.uuid(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarFornecedoresResponseSchema =
  criarRespostaSucessoPaginadaSchema(FornecedorResumoSchema);
export const CriarFornecedorResponseSchema = criarRespostaSucessoSchema(
  FornecedorDetalheSchema,
);
export const ConsultarFornecedorResponseSchema = criarRespostaSucessoSchema(
  FornecedorDetalheSchema,
);
export const AlterarFornecedorResponseSchema = criarRespostaSucessoSchema(
  FornecedorDetalheSchema,
);
export const AlterarSituacaoFornecedorResponseSchema =
  criarRespostaSucessoSchema(FornecedorDetalheSchema);

export type FornecedorParamsInput = z.input<typeof FornecedorParamsSchema>;
export type FornecedorParamsData = z.output<typeof FornecedorParamsSchema>;
export type CriarFornecedorInput = z.input<typeof CriarFornecedorSchema>;
export type CriarFornecedorData = z.output<typeof CriarFornecedorSchema>;
export type AlterarFornecedorInput = z.input<typeof AlterarFornecedorSchema>;
export type AlterarFornecedorData = z.output<typeof AlterarFornecedorSchema>;
export type AlterarSituacaoFornecedorData = z.output<
  typeof AlterarSituacaoFornecedorSchema
>;
export type AlterarSituacaoFornecedorInput = z.input<
  typeof AlterarSituacaoFornecedorSchema
>;
export type ListarFornecedoresQueryInput = z.input<
  typeof ListarFornecedoresQuerySchema
>;
export type ListarFornecedoresQueryData = z.output<
  typeof ListarFornecedoresQuerySchema
>;
export type FornecedorResumo = z.output<typeof FornecedorResumoSchema>;
export type FornecedorDetalhe = z.output<typeof FornecedorDetalheSchema>;
export type ListarFornecedoresResponse = z.output<
  typeof ListarFornecedoresResponseSchema
>;
export type CriarFornecedorResponse = z.output<
  typeof CriarFornecedorResponseSchema
>;
export type ConsultarFornecedorResponse = z.output<
  typeof ConsultarFornecedorResponseSchema
>;
export type AlterarFornecedorResponse = z.output<
  typeof AlterarFornecedorResponseSchema
>;
export type AlterarSituacaoFornecedorResponse = z.output<
  typeof AlterarSituacaoFornecedorResponseSchema
>;
