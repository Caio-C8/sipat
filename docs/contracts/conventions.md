# Convenções de schemas

## Zod 4

Todo código novo da camada de validação deve usar Zod 4. Antes de empregar uma
API pouco conhecida, confirme seu comportamento na
[documentação oficial](https://zod.dev/api) e no
[guia de migração](https://zod.dev/v4/changelog).

Diferenças relevantes em relação ao Zod 3:

| Zod 3                | Zod 4              |
| -------------------- | ------------------ |
| `ZodTypeAny`         | `ZodType`          |
| `z.nativeEnum(Enum)` | `z.enum(Enum)`     |
| `required_error`     | parâmetro `error`  |
| `invalid_type_error` | parâmetro `error`  |
| `.errorMap`          | parâmetro `error`  |
| `.strict()`          | `z.strictObject()` |

## Nomear pela operação e pelo boundary

Prefira nomes que revelem o papel do contrato:

```text
CreateNoticiaBodySchema
UpdateNoticiaBodySchema
GetNoticiasQuerySchema
NoticiaParamsSchema
NoticiaResumoResponseSchema
NoticiaDetalhadaResponseSchema
```

Não é obrigatório usar `Body`, `Query` ou `Params` em todos os nomes, mas a
diferença entre os boundaries deve permanecer explícita na organização.

## Input e output

Não use `z.infer` automaticamente quando houver coercion, preprocess,
transform, pipe, default ou codec.

```ts
export type CreateNoticiaInput = z.input<typeof CreateNoticiaSchema>;
export type CreateNoticiaData = z.output<typeof CreateNoticiaSchema>;
```

- `Input`: formato aceito antes da validação.
- `Data` ou `Output`: formato confiável produzido pelo schema.

Se os dois tipos forem iguais e não houver transformação, `z.infer` continua
válido, mas a convenção escolhida deve permanecer consistente no package.

## `undefined`, `null` e string vazia

Não trate automaticamente esses valores como equivalentes:

| Valor                              | Semântica padrão                  |
| ---------------------------------- | --------------------------------- |
| `undefined` ou propriedade ausente | não informado                     |
| `null`                             | ausência informada explicitamente |
| `""`                               | string enviada sem conteúdo       |

Em PATCH, propriedade ausente normalmente significa “não alterar”, enquanto
`null` pode significar “limpar”. Um normalizer não pode apagar essa diferença
sem uma decisão do contrato.

## Strings obrigatórias

`z.string()` aceita string vazia. Para texto obrigatório:

```ts
export const TextoObrigatorioSchema = z.string().trim().min(1, {
  error: "Este campo é obrigatório.",
});
```

## Body, query, params, form e response

Cada origem tem características diferentes:

| Boundary | Representação comum          |
| -------- | ---------------------------- |
| Body     | JSON                         |
| Query    | strings                      |
| Params   | strings                      |
| Form     | strings, `File` e `FormData` |
| Response | JSON serializado             |

Não reutilize um schema apenas porque os campos parecem iguais. Reutilize quando
a semântica e a representação também forem iguais.

## Booleanos em query

Não use `z.coerce.boolean()` para interpretar `"false"`, pois a coerção segue
`Boolean(input)` e strings não vazias resultam em `true`.

Use `z.stringbool()` com o vocabulário aceito pelo contrato:

```ts
export const BooleanQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
});
```

Valores fora dessas listas devem produzir erro. Declare `case: "insensitive"`
quando essa semântica fizer parte do contrato, mesmo sendo o comportamento
padrão do Zod 4, para tornar a decisão explícita e protegê-la com testes.

## Números em query

Uma query HTTP possui representação textual. Valide essa representação antes
de convertê-la, para impedir que valores aceitos por `Number(input)`, como
booleanos, `null`, string vazia, notação científica ou hexadecimal, atravessem
o contrato acidentalmente:

```ts
const PageSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .transform((value) => Number(value))
  .pipe(z.number().int().min(1));
```

O schema anterior recebe `string` e produz `number`. Defaults aplicados depois
do pipe devem pertencer ao tipo de output, como `.default(1)`.

No Zod 4, o input de schemas `z.coerce.*` é `unknown` e a coerção numérica usa
`Number(input)`. Quando `z.coerce.number()` for necessário, restrinja primeiro
o tipo e o formato de entrada com um schema anterior e um pipe. Teste também
valores limítrofes e representações alternativas que o contrato não aceita.

## Datas

Defina primeiro o significado:

- `DateOnly`;
- `DateTime`;
- `DateTimeUTC`;
- `DateTimeWithOffset`;
- `LocalDateTime`.

`2026-08-26` e `2026-08-26T12:30:00.000Z` não são contratos equivalentes.
Valide ISO quando esse for o formato acordado e não dependa indiscriminadamente
da interpretação de `new Date(value)`.

Em respostas JSON, represente datas como strings no formato acordado. Objetos
`Date` existem na aplicação, não no JSON.

## Codecs

Use `z.codec()` quando:

1. a representação externa difere da interna; e
2. a conversão nos dois sentidos faz parte do contrato.

```ts
export const DateTimeCodec = z.codec(
  z.iso.datetime({ offset: true }),
  z.date(),
  {
    decode: (value) => new Date(value),
    encode: (value) => value.toISOString(),
  },
);
```

Não crie codecs apenas porque a API existe.

## Objetos strict

Avalie `z.strictObject()` em boundaries nos quais propriedades inesperadas
devem causar erro:

```ts
const Schema = z.strictObject({
  titulo: TextoObrigatorioSchema,
});
```

Não torne todos os objetos strict automaticamente; compatibilidade e evolução
do contrato também importam.

## Chaves de idempotência

Mutações protegidas usam `ChaveIdempotenciaSchema`, com UUID normalizado para
minúsculas, no body estrito da operação. Em multipart, a chave permanece no
objeto JSON do campo `dados`; não crie parte multipart separada, header ou
middleware transversal para transportá-la.

A mesma chave identifica somente uma tentativa lógica por usuário e tipo de
operação. Reutilizá-la não transforma um conflito em sucesso e não substitui
locks, constraints ou validações do domínio.

## Enums

No Zod 4, use:

```ts
z.enum(TipoNoticia);
```

`z.nativeEnum()` foi descontinuado em favor da API unificada `z.enum()`.

## Defaults

Use `.default()` somente quando o valor padrão pertencer à operação:

```ts
destaque: z.boolean().default(false);
```

Não derive automaticamente um UPDATE de um CREATE com defaults. Em PATCH, um
campo ausente normalmente significa “não alterar”, não “aplicar o default da
criação”.

## Create e update

`.partial()` é adequado apenas quando todas as regras de criação continuam
semanticamente corretas na atualização. Caso contrário, declare o update de
forma explícita.

Uma pequena duplicação é preferível a uma abstração semanticamente errada.

## Responses

Crie schemas de resposta quando a saída fizer parte do contrato runtime:

```text
NoticiaResumoResponseSchema
NoticiaDetalhadaResponseSchema
DocumentoResponseSchema
PaginatedResponseSchema
```

Derive o tipo com `z.output`. Não mantenha uma interface manual paralela com os
mesmos campos.

## Limites de consumo

Contratos que controlam trabalho variável devem possuir limites coerentes com a
operação:

- máximo de itens em paginação e arrays;
- tamanho de strings, filtros e estruturas aninhadas;
- quantidade e tamanho de arquivos;
- resposta resumida quando a detalhada carregar relações ou conteúdo caro.

Não defina um único número para todos os domínios. O SIPAT exige que
o limite seja finito e testado; o contexto do projeto define seu valor. Consulte
[Performance de contratos e integrações](../performance/contracts-and-integrations.md).

## Refinements

Use `.refine()` ou `.superRefine()` para relações locais do payload, como:

- data final posterior à inicial;
- senha e confirmação iguais.

Sempre que possível, aponte `path` para o campo que o usuário consegue corrigir.
Não consulte banco em refinements compartilhados.

## `.catch()`

Não use `.catch(undefined)` apenas para ocultar filtros inválidos. O
comportamento padrão esperado é:

```text
ausente  → undefined
válido   → valor normalizado
inválido → erro
```

Use `.catch()` somente quando ignorar um valor inválido fizer parte explícita do
contrato.

## Helpers, primitives e abstração

O Zod já é a DSL. Não recrie sua API com `zString`, `zNumber`, `zEnum` ou
um helper configurável que esconda todas as opções do schema.

Um helper aceitável representa uma transformação específica:

- `emptyStringToUndefined`;
- `stringToInteger`;
- `normalizeSearch`.

Uma primitive representa um conceito do sistema:

- `IdSchema`;
- `EmailSchema`;
- `TextoObrigatorioSchema`;
- `SlugSchema`;
- `PaginationQuerySchema`.

Implemente diretamente na primeira ocorrência, observe a repetição e só extraia
quando houver o mesmo conceito em mais de um contrato. A abstração deve reduzir
carga cognitiva; se for preciso ler o helper para entender um campo simples, ela
provavelmente foi longe demais.

## DRY

DRY significa não duplicar conhecimento que precisa permanecer sincronizado.
Não significa eliminar toda repetição de sintaxe.

Duplicar uma propriedade simples entre Create e Update pode ser aceitável.
Duplicar manualmente uma interface e um schema que representam o mesmo contrato
é mais arriscado.
