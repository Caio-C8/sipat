# Arquitetura dos contratos

## Responsabilidade do package

`@repo/contracts` contém código executável em runtime e tipos derivados:

- schemas de entrada e saída;
- validação estrutural;
- normalização de representação;
- primitives, normalizers e codecs reutilizáveis;
- enums pertencentes ao contrato;
- formato compartilhado de erros;
- tipos `z.input` e `z.output`.

Ele não é apenas um package de tipos TypeScript.

```text
                 @repo/contracts
                    ↑      ↑
                    │      │
                   web    api
                           │
                           ↓
                    application
                           │
                           ↓
                     @repo/database
```

## Contrato não é model do banco

Schemas devem representar operações da aplicação, não espelhar automaticamente
models do Prisma.

Uma notícia pode ter contratos diferentes para:

- criação;
- atualização;
- filtros e paginação;
- consulta por identificador;
- resposta resumida;
- resposta detalhada.

O model do banco pode conter campos internos, relacionamentos e metadados que
não pertencem à API. Da mesma forma, a API pode receber valores que precisam ser
resolvidos antes da persistência.

```text
Database model ≠ API contract
```

## Fronteira de confiança

Zod deve validar dados nos pontos em que entram na aplicação:

- body, query e params HTTP;
- formulários e `FormData`;
- variáveis de ambiente;
- webhooks;
- APIs externas;
- JSON, localStorage e outras fontes externas.

Depois da validação no boundary, controllers, services e casos de uso devem
receber o output confiável. Não repetir a mesma validação sem uma nova mudança
de fronteira.

## Separação de responsabilidades

### Normalização

Altera a representação sem consultar estado externo:

```text
" João "  → "João"
""         → undefined
"10"       → 10
"false"    → false
ISO string → Date
```

### Validação

Confirma estrutura, formato e invariantes locais do payload:

- string não vazia;
- e-mail ou UUID válido;
- número inteiro e positivo;
- valor de enum permitido;
- data final posterior à inicial;
- confirmação de senha compatível.

### Regra de negócio

Permanece em application/domain/services:

- existência de usuário ou categoria;
- unicidade de e-mail;
- permissões;
- saldo disponível;
- estado necessário para publicação;
- propriedade de um relacionamento.

Schemas compartilhados não devem executar consultas HTTP ou acessar
repositories.

## Fonte única de verdade

Quando um dado exige validação runtime, o schema Zod é a definição principal.
Derive os tipos dele em vez de manter uma interface paralela com os mesmos
campos.

```ts
export const CreateNoticiaSchema = z.strictObject({
  titulo: z.string(),
});

export type CreateNoticiaInput = z.input<typeof CreateNoticiaSchema>;
export type CreateNoticiaData = z.output<typeof CreateNoticiaSchema>;
```

Interfaces manuais continuam válidas para tipos exclusivamente internos que não
representam um contrato runtime.

## Independência da persistência

`@repo/contracts` deve permanecer independente de `@repo/database`.

Antes de importar um enum ou tipo do banco, verifique se o conceito pertence ao
contrato ou se precisa de uma camada neutra. Não adicione Prisma Client,
repositories ou código exclusivo do servidor ao package compartilhado sem uma
decisão arquitetural explícita.

Essa regra evita enviar dependências server-only para bundles web ou mobile.

## Organização feature first

Comece com uma estrutura orientada a recursos:

```text
packages/contracts/src/
├── common/
│   ├── codecs/
│   ├── normalizers/
│   └── schemas/
├── config/
├── errors/
├── noticia/
│   ├── create-noticia.schema.ts
│   ├── update-noticia.schema.ts
│   ├── get-noticias.schema.ts
│   ├── noticia-response.schema.ts
│   └── index.ts
├── documento/
├── evento/
└── index.ts
```

Não espalhe uma única feature prematuramente entre diretórios globais como
`dtos`, `types`, `schemas`, `helpers` e `enums`.

## Critério para `common`

Um item vai para `common` somente quando já representa um conceito transversal
real, por exemplo:

- `IdSchema`;
- `TextoObrigatorioSchema`;
- `PaginationQuerySchema`;
- `EmailSchema`;
- `DateTimeCodec`.

Um schema usado apenas por notícia continua em `noticia/`, mesmo que possa ser
reutilizado no futuro.

## API pública e exports

Cada feature controla seus exports pelo próprio `index.ts`. O `src/index.ts`
do package expõe apenas a API pública:

```ts
// noticia/index.ts
export * from "./create-noticia.schema";
export * from "./update-noticia.schema";
export * from "./get-noticias.schema";
export * from "./noticia-response.schema";

// src/index.ts
export * from "./noticia";
```

Não exporte implementações internas sem necessidade.
