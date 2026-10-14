# Exemplos conceituais

Estes exemplos demonstram as convenções aprovadas. Eles não indicam que as
features já existem no package.

## Primitive de texto obrigatório

```ts
import * as z from "zod";

export const TextoObrigatorioSchema = z.string().trim().min(1, {
  error: "Este campo é obrigatório.",
});
```

## String vazia opcional

Use somente quando o contrato declarar que string vazia equivale a campo não
informado:

```ts
import * as z from "zod";

export function optionalEmptyString<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, schema.optional());
}
```

`null` não é convertido automaticamente.

## Boolean de query

```ts
import * as z from "zod";

export const BooleanQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
});
```

## Paginação

```ts
import * as z from "zod";

const PageQuerySchema = z
  .string()
  .regex(/^[0-9]+$/, {
    error: "A página deve conter somente dígitos.",
  })
  .transform((value) => Number(value))
  .pipe(z.number().int().min(1));

const LimitQuerySchema = z
  .string()
  .regex(/^[0-9]+$/, {
    error: "O limite deve conter somente dígitos.",
  })
  .transform((value) => Number(value))
  .pipe(z.number().int().min(1).max(100));

export const PaginationQuerySchema = z.strictObject({
  page: PageQuerySchema.default(1),
  limit: LimitQuerySchema.default(20),
});
```

Esse contrato aceita os valores textuais presentes na URL e entrega números
validados à aplicação. Ele não aceita valores de outros tipos apenas porque
seriam convertíveis pela função `Number()` do JavaScript.

## Codec de data e hora

```ts
import * as z from "zod";

export const DateTimeCodec = z.codec(
  z.iso.datetime({ offset: true }),
  z.date(),
  {
    decode: (value) => new Date(value),
    encode: (value) => value.toISOString(),
  },
);
```

Antes de adotá-lo, confirme se o boundary aceita qualquer offset ou exige UTC.

## Feature Notícia

### Enum do contrato

```ts
export const TipoNoticia = {
  NORMAL: "NORMAL",
  AVISO: "AVISO",
} as const;
```

### Create

```ts
import * as z from "zod";

export const CreateNoticiaSchema = z.strictObject({
  titulo: TextoObrigatorioSchema,
  resumo: TextoObrigatorioSchema,
  tipo: z.enum(TipoNoticia).default(TipoNoticia.NORMAL),
  corpo: z.string().trim().nullable().optional(),
  dataPublicacao: z.iso.datetime({ offset: true }).optional(),
  autor: TextoObrigatorioSchema,
  destaque: z.boolean().default(false),
  categoriaNome: TextoObrigatorioSchema,
  documentos: z.array(InsertDocumentoSchema).optional(),
});

export type CreateNoticiaInput = z.input<typeof CreateNoticiaSchema>;
export type CreateNoticiaData = z.output<typeof CreateNoticiaSchema>;
```

### Update

Declare explicitamente quando defaults e semântica diferirem da criação:

```ts
export const UpdateNoticiaSchema = z.strictObject({
  titulo: TextoObrigatorioSchema.optional(),
  resumo: TextoObrigatorioSchema.optional(),
  tipo: z.enum(TipoNoticia).optional(),
  corpo: z.string().trim().nullable().optional(),
  dataPublicacao: z.iso.datetime({ offset: true }).nullable().optional(),
  autor: TextoObrigatorioSchema.optional(),
  destaque: z.boolean().optional(),
  categoriaNome: TextoObrigatorioSchema.optional(),
  documentos: z.array(InsertDocumentoSchema).optional(),
});

export type UpdateNoticiaInput = z.input<typeof UpdateNoticiaSchema>;
export type UpdateNoticiaData = z.output<typeof UpdateNoticiaSchema>;
```

### Query

```ts
export const GetNoticiasQuerySchema = PaginationQuerySchema.extend({
  pesquisa: z.string().trim().optional(),
  tipo: z.enum(TipoNoticia).optional(),
  destaque: BooleanQuerySchema.optional(),
});
```

Trate string vazia em `pesquisa` conforme a política explícita da operação.

## Refinement entre campos

```ts
const PeriodoSchema = z
  .strictObject({
    dataMin: z.iso.date().optional(),
    dataMax: z.iso.date().optional(),
  })
  .refine(
    ({ dataMin, dataMax }) => !dataMin || !dataMax || dataMax >= dataMin,
    {
      path: ["dataMax"],
      error: "A data final deve ser posterior à data inicial.",
    },
  );
```

O refinement compara apenas campos do payload. Existência no banco, permissões
e outras regras dependentes de estado permanecem na camada de negócio.
