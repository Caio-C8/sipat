# Controllers

## Responsabilidade

O controller é a ponte entre HTTP e o caso de uso. Cada método deve:

1. receber body, query e params já descritos por DTOs;
2. encaminhar os valores ao service;
3. passar os dados de domínio retornados pelo service pelo mapper;
4. montar o envelope de sucesso definido pelo contrato da operação;
5. declarar e validar uma response proveniente de `@repo/contracts`.

Ele não deve implementar regras de negócio, consultar Prisma, acessar um
repository, formatar manualmente dados complexos ou usar `try/catch` para
substituir a política central de erros.

## Exemplo

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import type { RecursoResponse } from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";

@Controller("recursos")
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(RecursoResponseDto)
  async create(@Body() body: CreateRecursoDto): Promise<RecursoResponse> {
    const recurso = await this.recursoService.create(body);

    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Recurso criado com sucesso.",
      dados: RecursoResponseMapper.toHttp(recurso),
    };
  }
}
```

O exemplo presume que o DTO foi criado como classe por `createZodDto` e que o
Pipe de validação e o `ZodSerializerInterceptor` estão ativos. O DTO de response
também deve ser derivado do schema compartilhado correspondente.

O baseline atual não instala `@nestjs/swagger`. Por isso, controllers usam
`@ZodSerializerDto` para declarar o schema de serialização e `@HttpCode` para
declarar o status separadamente. No `nestjs-zod` 5.5, `@ZodResponse` também
registra metadados OpenAPI e exige `@nestjs/swagger` em runtime; ele só deve
substituir essa combinação quando Swagger/OpenAPI for adotado conscientemente.
O tipo de retorno explícito, derivado do contrato, mantém a verificação estática
do corpo retornado.

## Envelope de sucesso

O envelope de sucesso não é criado por um interceptor genérico. O controller
retorna explicitamente a estrutura definida em `@repo/contracts`, incluindo
`status`, `sucesso`, `mensagem`, `dados` e, quando aplicável, `meta`.

Essa escolha mantém visíveis as diferenças entre operações: status e mensagem
podem variar, respostas paginadas possuem `meta` e uma rota `204 No Content`
não possui corpo. Um interceptor global precisaria inferir ou configurar essas
diferenças, esconderia parte do contrato no ciclo transversal e aumentaria o
risco de produzir um envelope diferente do schema declarado.

O `ZodSerializerInterceptor` continua transversal, mas possui outra
responsabilidade: validar e serializar a resposta final declarada por
`@ZodSerializerDto`. Ele não adiciona propriedades ao retorno do controller.

## Exclusão com `204 No Content`

Uma exclusão que responde `204 No Content` não retorna envelope, JSON ou
mensagem. O status confirma que a operação terminou com sucesso; o cliente pode
usar esse resultado para apresentar uma mensagem específica da ação em sua
própria interface.

Não retorne `{ sucesso: true, mensagem, dados: null }` junto de um `204`. Se a
mensagem precisar fazer parte do contrato HTTP, use `200 OK` e declare um schema
de response próprio com `dados: null`. Essa é uma alternativa válida, mas deve
ser uma decisão explícita da operação, não uma exceção silenciosa ao significado
de `204`.

## Decisões de segurança da rota

Antes de implementar cada handler, defina:

- se a rota é pública ou autenticada;
- qual permissão ou policy é necessária;
- se existe autorização por objeto, propriedade, usuário ou tenant;
- quais campos podem entrar e sair;
- se upload, URL externa ou operação cara exige proteção adicional;
- se o limite de requisições difere do baseline.

Registre essas decisões na matriz descrita em
[Testes de segurança](./security/testing.md). Uma rota sem decorator local ainda
pode estar protegida por um Guard global; confirme a composição real.

## Paginação

Quando o service retornar dados e metadados, mapeie apenas os itens:

```ts
const result = await this.recursoService.list(query);

return {
  status: HttpStatus.OK,
  sucesso: true,
  mensagem: "Recursos encontrados com sucesso.",
  dados: result.items.map(RecursoResponseMapper.toHttp),
  meta: {
    total: result.total,
    pagina: result.page,
    ultimaPagina: result.lastPage,
    limite: result.limit,
  },
};
```

O formato exato precisa existir em `@repo/contracts`; não invente `dados`,
`meta` ou nomes de campos somente no controller.

## Decorators, Pipes e Guards

Use decorators existentes para declarar rota, status, autenticação, autorização
ou tratamento de entrada. Pipes validam e transformam dados de entrada; Guards
decidem se a requisição pode alcançar o handler.

Antes de um agente criar um decorator customizado, ele deve explicar a
necessidade e pedir autorização ao usuário. Não crie abstrações para um único
uso quando decorators nativos ou já existentes resolverem o problema.

Rotas públicas e regras de permissão devem seguir a política de autenticação do
projeto. Enquanto ela não estiver documentada, não presuma nomes de decorators
nem comportamentos de autorização.

Decorators apenas declaram metadados. Confirme qual Guard os interpreta e leia
[Guards](./request-lifecycle/guards.md) antes de criar uma abstração nova.
