# DTOs e validação

## Fonte de verdade

Schemas de entrada pertencem a `@repo/contracts`. O diretório `dtos` do módulo
apenas cria a classe necessária para integrar esse schema ao NestJS.

Não replique campos ou validações dentro da API.

## Padrão com `nestjs-zod`

Exemplo genérico:

```ts
import { CreateRecursoSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class CreateRecursoDto extends createZodDto(CreateRecursoSchema) {}
```

A classe é importante porque o NestJS usa metadados runtime para identificar o
DTO. A documentação oficial de `nestjs-zod` exige uma classe para usar o DTO
como tipo e para que o `ZodValidationPipe` encontre seu schema.

Não use como padrão:

```ts
export const CreateRecursoDto = createZodDto(CreateRecursoSchema);
export type CreateRecursoDto = CreateRecursoInput;
```

O alias existe apenas no sistema de tipos e pode impedir que o Pipe receba a
classe esperada nos metadados do parâmetro.

## Tipos do contrato

Os tipos continuam vindo de `@repo/contracts`:

```ts
import type { CreateRecursoData, CreateRecursoInput } from "@repo/contracts";
```

- `CreateRecursoInput`: representação aceita antes do parse;
- `CreateRecursoData`: output validado e normalizado.

Depois do Pipe, o service deve trabalhar preferencialmente com o output
confiável. Se input e output divergirem por transform, preprocess, default ou
codec, não os trate como equivalentes nem use cast para esconder a diferença.

O dado bruto recebido pelo boundary corresponde a `z.input`. O
`ZodValidationPipe` executa o schema e entrega ao controller o `z.output`.
Portanto, o service recebe o tipo `Data`, não o tipo `Input`:

```text
request HTTP (z.input)
        ↓ ZodValidationPipe
controller (z.output)
        ↓
service (z.output)
```

Essa diferença aparece, por exemplo, quando uma string é normalizada, um campo
recebe default ou query params de paginação são transformados de strings HTTP
em números. Documente essas transformações no contrato do domínio e use o tipo
de output depois do Pipe.

Tipos TypeScript não executam validação. Ao chamar o service diretamente em um
teste ou fluxo interno, o chamador deve fornecer dados já validados e
normalizados ou passar explicitamente pelo schema antes da chamada.

## Body, query e params

Crie DTOs separados quando os boundaries forem diferentes:

```text
CreateRecursoBodyDto
UpdateRecursoBodyDto
ListRecursosQueryDto
RecursoParamsDto
```

No controller:

```ts
async create(@Body() body: CreateRecursoBodyDto) {}

async list(@Query() query: ListRecursosQueryDto) {}

async findOne(@Param() params: RecursoParamsDto) {}
```

Use Pipes específicos do NestJS para parâmetros primitivos somente quando não
existir um contrato Zod para o conjunto de params e essa escolha estiver
documentada.

## Configuração do Pipe

Criar DTOs não ativa validação sozinho. O `ZodValidationPipe` precisa estar
registrado globalmente ou no controller/rota.

A configuração global é a recomendada por `nestjs-zod`. Antes de adotá-la,
alinhe o formato de erro com
[docs/contracts/errors.md](../../contracts/errors.md).

## Exports

O `dtos/index.ts` expõe somente DTOs públicos do módulo:

```ts
export * from "./create-recurso.dto";
export * from "./list-recursos-query.dto";
export * from "./recurso-params.dto";
export * from "./update-recurso.dto";
```

## Pré-condição obrigatória

Antes de criar um DTO:

1. localize o schema em `@repo/contracts`;
2. confirme sua semântica de input e output;
3. confirme que ele corresponde ao boundary da rota;
4. confirme que o Pipe está configurado.

Se o contrato estiver ausente ou ambíguo, o agente deve avisar o usuário antes
de implementar o módulo.

## Limite de segurança

Um DTO validado confirma o formato definido pelo schema, mas não autentica o
cliente nem autoriza acesso ao recurso. Limites dependentes de identidade, banco
ou estado continuam no service ou policy apropriado. Consulte
[Segurança de input e output](./security/input-and-output.md).
