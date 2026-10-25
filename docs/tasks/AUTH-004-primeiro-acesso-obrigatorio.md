# `AUTH-004` — Obrigar a troca da senha inicial

**Status:** `concluída`

## Objetivo

Persistir no usuário a obrigatoriedade de troca da senha inicial, restringir a
sessão criada nesse estado e concluir o primeiro acesso com troca atômica da
senha e rotação da sessão.

## Contexto e referências

- Roadmap: [AUTH-004](../roadmap.md#auth-004--obrigar-a-troca-da-senha-inicial);
- Contratos: [CONTRACTS-009](./CONTRACTS-009-primeiro-acesso.md);
- Segurança:
  [primeiro acesso e senha inicial](../security-and-access.md#primeiro-acesso-e-senha-inicial);
- API: [documentação da aplicação](../apps/api/README.md) e
  [autenticação](../apps/api/security/authentication.md);
- Consumidor futuro: [WEB-AUTH-001](./WEB-AUTH-001-integrar-autenticacao.md).

## Escopo

- adicionar `trocaSenhaObrigatoria` ao model `Usuario`, com default verdadeiro
  para novas contas e backfill verdadeiro para as contas existentes;
- marcar com o mesmo estado o primeiro administrador criado pelo comando de
  provisionamento e usuários criados administrativamente;
- carregar o estado no login e na autenticação da sessão;
- devolver o estado nas responses de login e `/auth/me`;
- criar `POST /api/auth/concluir-primeiro-acesso`, autenticado e permitido aos
  dois perfis somente enquanto a troca estiver pendente;
- impedir que uma identidade pendente use demais rotas protegidas, mantendo
  acessíveis apenas `/auth/me`, conclusão do primeiro acesso e logout;
- na conclusão, atualizar hash e estado, invalidar eventual token de
  recuperação, revogar todas as sessões anteriores e criar uma nova sessão em
  uma única transação serializável;
- substituir o cookie pela nova sessão somente depois do sucesso transacional;
- aplicar a capacidade Argon2 e limite persistente adequados ao endpoint;
- atualizar testes unitários, E2E e de integração PostgreSQL.

## Fora do escopo

- interface Web ou mobile;
- recuperação de senha por e-mail;
- MFA, histórico de senhas ou expiração periódica de senha;
- usar a tabela de sessões ou `ultimoLoginAt` como fonte de verdade;
- job de limpeza de sessões antigas.

## Decisões aprovadas

- o estado pertence a `Usuario`, porque sobrevive à revogação, expiração e
  limpeza física de sessões;
- `ultimoLoginAt` continua sendo informação operacional e não determina se a
  senha inicial foi substituída;
- o primeiro administrador também começa com troca obrigatória;
- a sessão pendente autentica a identidade, mas não autoriza operações de
  domínio;
- a API, e não apenas redirects da Web, aplica essa restrição;
- o endpoint não exige novamente a senha inicial, pois ela acabou de ser
  validada para emitir a sessão restrita;
- depois da troca, o token anterior é destruído e um token novo é emitido para
  evitar fixação e permitir o fluxo contínuo até o dashboard;
- a proteção das exceções de primeiro acesso deve ser declarativa. Se a
  implementação optar por novo metadata/decorator para o Guard global, deve
  limitar seu uso a `/auth/me` e à conclusão do primeiro acesso e revisar essa
  escolha antes de codificar, conforme as instruções da API.

## Critérios de aceite

- [x] usuário novo e administrador provisionado recebem
      `trocaSenhaObrigatoria = true`;
- [x] login válido nesse estado cria sessão restrita e informa a pendência;
- [x] sessão restrita recebe `403` com código público estável nas demais rotas
      protegidas, sem alterar a autorização por perfil;
- [x] `/auth/me`, conclusão e logout continuam acessíveis nesse estado;
- [x] conclusão inválida não modifica senha, estado, sessão ou token de
      recuperação;
- [x] conclusão concorrente produz um único sucesso;
- [x] sucesso troca o hash, limpa a pendência, invalida redefinição pendente,
      revoga sessões antigas, cria uma sessão nova e substitui o cookie;
- [x] a nova sessão acessa rotas permitidas pelo perfil e a antiga não;
- [x] limpeza da tabela de sessões não altera o estado de primeiro acesso;
- [x] logs, métricas e responses não contêm senha, hash ou token;
- [x] migrations, client Prisma, contratos, API, E2E e integração PostgreSQL
      passam nas verificações aplicáveis.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/contracts/src/auth/` após `CONTRACTS-009`;
- `apps/api/src/modules/auth/auth.controller.ts`;
- `apps/api/src/modules/auth/auth.service.ts`;
- `apps/api/src/modules/auth/auth.repository.ts`;
- `apps/api/src/modules/auth/auth.types.ts` e DTOs;
- autenticação/autorização global em `apps/api/src/modules/auth/guards/`;
- `apps/api/src/modules/auth/provisionamento-admin.ts`;
- criação de usuário em `apps/api/src/modules/usuarios/`;
- testes unitários, `apps/api/test/auth.e2e-spec.ts` e
  `apps/api/test/auth-postgres.spec.ts`.

## Verificações esperadas

- gerar e validar a migration e o Prisma Client;
- lint, typecheck, testes e build de `@repo/contracts`, `@repo/database` e
  `@repo/api`;
- E2E da API com Guards reais;
- integração PostgreSQL para atomicidade, concorrência e rotação de sessão;
- `pnpm format:check`.

## Pendências ou decisões bloqueantes

- Nenhuma de produto. A exceção do Guard usa metadata direta, sem decorator
  novo, e está limitada a `/auth/me` e à conclusão do primeiro acesso.
