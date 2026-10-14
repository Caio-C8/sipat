# Arquitetura da API

## Organização por domínio

Cada domínio da aplicação fica em:

```text
apps/api/src/modules/<dominio>/
```

Estrutura inicial:

```text
apps/api/src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   └── utils/
│       └── <dominio>/
└── modules/
    └── <dominio>/
        ├── dtos/
        │   └── index.ts
        ├── mappers/
        │   └── index.ts
        ├── types/
        │   └── index.ts
        ├── <dominio>.controller.ts
        ├── <dominio>.module.ts
        ├── <dominio>.repository.ts
        └── <dominio>.service.ts
```

Crie outros arquivos ou diretórios somente quando houver responsabilidade
concreta. Um módulo pode ter mais de um controller quando suas rotas formarem
grupos diferentes.

Os diretórios transversais em `common` também são opcionais. Autenticação e suas
Strategies pertencem preferencialmente a `modules/auth`; componentes exclusivos
de um domínio podem permanecer dentro dele.

## Responsabilidades

| Camada     | Faz                                               | Não faz                             |
| ---------- | ------------------------------------------------- | ----------------------------------- |
| DTO        | conecta schema Zod ao NestJS                      | redefine o contrato                 |
| Controller | recebe HTTP, chama service e mapeia resposta      | regra de negócio ou query Prisma    |
| Service    | aplica regras e orquestra operações               | detalhes HTTP                       |
| Repository | executa operações mínimas no Prisma               | regra, mapper ou exceção de domínio |
| Types      | descreve payloads Prisma e tipos locais           | duplica contratos HTTP              |
| Mapper     | converte modelo/payload para response             | consulta banco ou decide regra      |
| Module     | declara providers, controllers, imports e exports | implementa comportamento            |

## Fluxo de entrada

```text
Requisição HTTP
        ↓
Middleware
        ↓
Guards
        ↓
Interceptors de entrada
        ↓
Body / Query / Params + Pipes
        ↓
ZodValidationPipe
        ↓
DTO validado
        ↓
Controller
        ↓
Service
        ↓
Repository
        ↓
Prisma
```

Na saída, Interceptors são resolvidos em ordem inversa. Uma exceção não tratada
desvia para Exception Filters. Veja o
[ciclo da requisição](./request-lifecycle/README.md) antes de posicionar um
componente transversal.

O service deve receber dados já validados pelo boundary. Validações que dependem
de banco, permissões ou estado do sistema pertencem ao service, não ao schema
Zod.

Validação de formato não substitui autenticação nem autorização. Cada rota deve
seguir as decisões de [segurança](./security/README.md).

## Fluxo de saída

```text
Prisma model ou payload
        ↓
Service
        ↓
Controller
        ↓
Mapper
        ↓
Response de @repo/contracts
```

O service pode compor resultados de aplicação, como itens e metadados de
paginação. A representação HTTP final pertence ao mapper e ao controller.

## Dependências entre domínios

Um service pode usar:

- o repository do próprio domínio;
- services exportados por outros módulos.

Não injete o repository de outro domínio diretamente. O service público daquele
domínio preserva suas regras e seu limite arquitetural.

```text
ModuloAService
├── ModuloARepository
└── ModuloBService
```

Se dois módulos precisarem importar um ao outro, reavalie os limites antes de
usar `forwardRef()`. Dependências circulares podem indicar:

- responsabilidade no módulo errado;
- regra que deveria estar em um terceiro módulo de orquestração;
- contrato interno pouco definido.

A documentação oficial do NestJS apresenta `forwardRef()` como mecanismo para
ciclos inevitáveis, não como substituto para revisar o desenho.

## Dependências compartilhadas

- contratos HTTP: `@repo/contracts`;
- persistência e tipos Prisma: `@repo/database`;
- utilitários realmente multiplataforma: `@repo/utils`;
- configurações compartilhadas: `@repo/config`.

Uma aplicação não importa arquivos internos de outra aplicação.
