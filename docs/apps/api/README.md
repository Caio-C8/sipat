# Desenvolvimento da API

Este diretório documenta o padrão de desenvolvimento da aplicação NestJS
`apps/api` para pessoas e agentes.

## Objetivo

A API é organizada em módulos por domínio. Cada camada possui uma
responsabilidade clara:

```text
requisição HTTP
      ↓
DTO + validação Zod
      ↓
controller
      ↓
service
      ↓
repository
      ↓
Prisma
```

O retorno percorre o caminho inverso e é convertido para o contrato HTTP por um
mapper antes de sair do controller.

Segurança e performance participam desse fluxo desde os contratos e queries até
a resposta e a observabilidade; não são revisões executadas somente ao final.

## Estado atual da base

No estado atual:

- a API expõe somente `GET /api/health`;
- não existe módulo de domínio registrado em `AppModule`;
- `apps/api` usa Zod 4 e `nestjs-zod` 5;
- `ZodValidationPipe` e `ZodSerializerInterceptor` estão registrados
  globalmente;
- o filtro de exceções produz o formato definido por `RespostaErroSchema`;
- o middleware de request ID cria um UUID por requisição, devolve
  `X-Request-Id` e o inclui nas respostas de erro;
- CORS usa a allowlist de `CORS_ORIGINS`, não aceita credenciais e expõe somente
  `X-Request-Id` ao navegador;
- `DatabaseModule` cria, exporta e encerra um único Prisma Client quando um
  módulo consumidor o importa;
- a base vazia não importa `DatabaseModule` diretamente em `AppModule`;
- o schema Prisma não contém models de domínio;
- testes unitários cobrem filtro e middleware, e testes E2E cobrem health,
  request ID, erro público e CORS.

O exemplo completo que validou modules, DTOs, services, repositories, mappers e
rotas permanece disponível na tag `exemplo-produto-v1.0.0`.

Os exemplos desta documentação representam o padrão desejado, não código já
implementado na base vazia.

## Pré-requisitos para um módulo

Antes de desenvolver rotas de um domínio:

1. confirme que os schemas de request e response existem em
   `@repo/contracts`;
2. confirme que os tipos de input e output foram derivados desses schemas;
3. confirme que o model e os tipos necessários existem no Prisma;
4. confirme que o Prisma Client foi gerado;
5. confirme que `DatabaseModule` pode ser importado pelo módulo do domínio;
6. confirme que os controles de acesso e limites da rota foram decididos.

Se os contratos ainda não existirem, interrompa a implementação do módulo. Não
crie silenciosamente contratos ou semânticas de campos para desbloquear a API.

## Documentos

| Assunto                                  | Documento                                            |
| ---------------------------------------- | ---------------------------------------------------- |
| Estrutura, fluxo e limites entre camadas | [Arquitetura](./architecture.md)                     |
| DTOs e validação de entrada              | [DTOs](./dtos.md)                                    |
| Tipos Prisma e mapeamento de resposta    | [Tipos e mappers](./types-and-mappers.md)            |
| Acesso ao banco                          | [Repositories](./repositories.md)                    |
| Regras de negócio e orquestração         | [Services](./services.md)                            |
| Rotas e respostas HTTP                   | [Controllers](./controllers.md)                      |
| Composição e dependências de módulos     | [Módulos](./modules.md)                              |
| Posicionamento de funções utilitárias    | [Utilitários](./utilities.md)                        |
| Ordem de implementação e testes          | [Workflow e testes](./workflow-and-testing.md)       |
| Políticas e validações de segurança      | [Segurança](./security/README.md)                    |
| Limites, métricas e eficiência           | [Performance](./performance.md)                      |
| Guards, Interceptors, Filters e Pipes    | [Ciclo da requisição](./request-lifecycle/README.md) |
| Documentações oficiais                   | [Referências](./references.md)                       |

Assuntos que definem a comunicação entre API e consumidores devem ser
documentados também em [Integrações](../../integrations/README.md). Contratos
compartilhados seguem as regras de
[docs/contracts](../../contracts/README.md).

## Decisões pendentes por projeto

Esta estrutura não escolhe antecipadamente políticas que dependem da aplicação.
Antes de implementar recursos relacionados, documente:

- autenticação, autorização e significado de rota pública;
- catálogo de erros e exceptions de domínio;
- formato e limites de paginação;
- limites e propagação de transações;
- upload, armazenamento e entrega de arquivos;
- logging, observabilidade e dados sensíveis;
- metas e alertas de performance para fluxos críticos;
- versionamento da API e geração de OpenAPI.

Quando uma decisão afetar consumidores, registre-a também em
[Integrações](../../integrations/README.md) e, se mudar formatos compartilhados,
em [Contratos](../../contracts/README.md).
