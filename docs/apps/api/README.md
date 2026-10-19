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

## Estado atual do SIPAT

No estado atual:

- a API expõe `GET /api/health`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/me`,
  `POST /api/auth/alterar-senha`, `POST /api/auth/esqueceu-senha`,
  `POST /api/auth/redefinir-senha`, as cinco rotas protegidas de `/api/usuarios`
  e `POST /api/patrimonios`;
- `AuthModule` registra autenticação, autorização e CSRF como Guards globais,
  nessa ordem;
- rotas não públicas exigem sessão válida e declaração de perfis; a ausência de
  perfis nega acesso;
- a sessão é consultada pelo hash SHA-256 do token e a identidade anexada à
  request contém somente `id`, `nome`, `email` e `perfil`;
- `UsuariosModule` separa DTOs Zod, controller, service, repository, tipos e
  mappers; somente `ADMINISTRADOR` acessa suas rotas;
- `PatrimoniosModule` aplica o mesmo corte por camadas ao cadastro; somente
  `DIRETOR_PATRIMONIO` cria, e a API deriva numeração, status, normalização,
  situação contábil e auditoria dentro de uma transação;
- listagem usa paginação finita, busca e filtros com seleção mínima e ordenação
  determinística; criação usa Argon2id e auditoria derivada da sessão;
- inativação é atômica com a revogação de sessões e protege autoinativação e o
  último administrador ativo;
- login, logout e `/auth/me` usam contratos Zod, cookie `HttpOnly`, sessão opaca
  revogável e rate limit persistente;
- alteração da própria senha exige a senha atual, usa limite persistente por
  escopo, troca o hash e revoga todas as sessões atomicamente e expira o cookie;
- recuperação usa response neutra, token aleatório armazenado somente por hash,
  uso único, validade de 15 minutos, SMTP desacoplado e revogação atômica das
  sessões; fora de desenvolvimento, permanece desligada por flag até haver
  consumidor HTTPS e SMTP;
- a duração absoluta é 8 horas, a inatividade efetiva fica entre
  aproximadamente 25 e 30 minutos e no máximo cinco sessões ficam ativas por
  usuário;
- o trabalho Argon2 possui concorrência e fila finitas configuradas por
  ambiente;
- `apps/api` usa Zod 4 e `nestjs-zod` 5;
- `ZodValidationPipe` e `ZodSerializerInterceptor` estão registrados
  globalmente;
- o filtro de exceções produz o formato definido por `RespostaErroSchema`;
- o middleware de request ID cria um UUID por requisição, devolve
  `X-Request-Id` e o inclui nas respostas de erro;
- CORS usa a allowlist de `CORS_ORIGINS`, não aceita credenciais, permite o
  header `X-SIPAT-CSRF` e expõe somente `X-Request-Id` ao navegador;
- `DatabaseModule` cria, exporta e encerra um único Prisma Client quando um
  módulo consumidor o importa;
- `AuthModule`, `UsuariosModule` e `PatrimoniosModule` importam
  `DatabaseModule`; `AppModule` não acessa o client diretamente;
- `SessaoUsuario.lastActivityAt` sustenta inatividade e `TentativaLogin`
  persiste o rate limit com expiração e limpeza em lotes;
- testes unitários e E2E cobrem infraestrutura, Guards reais e as operações de
  usuários, autenticação e cadastro patrimonial, incluindo `401`, `403`, `429`,
  CSRF, conflitos, regras administrativas e corridas reais no PostgreSQL.

Os exemplos desta documentação representam o padrão desejado, não código já
implementado no SIPAT.

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
| Roadmap transversal inicial              | [Roadmap do SIPAT](../../roadmap.md)                 |
| Identidade, sessão e controle de acesso  | [Decisão do SIPAT](../../security-and-access.md)     |
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

- parâmetros operacionais e decisões abertas de autenticação listados em
  [Identidade, sessão e controle de acesso](../../security-and-access.md);
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
