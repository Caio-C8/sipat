# `AUTH-002` — Alterar a própria senha

**Status:** concluída

## Objetivo

Implementar no backend a alteração da senha da identidade autenticada, exigindo
a senha atual e encerrando todas as sessões após o sucesso.

## Contexto e referências

- Roadmap: [AUTH-002](../roadmap.md#auth-002--alterar-a-própria-senha).
- Dependência: [CONTRACTS-003](./CONTRACTS-003-contratos-senha.md) concluído e
  verificado.
- Requisitos e decisões: [RF01 e UC01](../requisitos-SIPAT.md#rf01-autenticação-e-controle-de-acesso)
  e [alteração autenticada](../security-and-access.md#alteração-autenticada-da-própria-senha).
- API: [índice](../apps/api/README.md),
  [autenticação](../apps/api/security/authentication.md),
  [autorização](../apps/api/security/authorization.md),
  [proteção HTTP](../apps/api/security/http-protection.md),
  [testes](../apps/api/security/testing.md) e
  [workflow](../apps/api/workflow-and-testing.md).

## Ordem de execução

1. Confirmar branch, worktree, contratos e o estado atual do módulo `auth`.
2. Mapear a operação para a identidade já anexada pelo Guard, sem aceitar ID,
   e-mail ou perfil no body, params ou query.
3. Reutilizar a capacidade Argon2 e o limite persistente de operações de senha.
4. Implementar repository e transação para atualizar o hash e revogar todas as
   sessões.
5. Implementar service, DTO e `POST /api/auth/alterar-senha`.
6. Expirar o cookie no controller somente após sucesso.
7. Cobrir unidades, integração PostgreSQL e E2E com Guards e CSRF reais.
8. Executar lint, tipos, testes, build e verificações transversais.
9. Atualizar documentação de estado e status somente após as evidências.

## Escopo

- rota protegida `POST /api/auth/alterar-senha`, permitida a
  `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`;
- identidade derivada exclusivamente da sessão válida;
- verificação Argon2 da senha atual;
- validação da nova senha e confirmação pelo contrato compartilhado;
- limite persistente por chave HMAC do usuário e escopo da operação, com as
  mesmas janelas quantitativas do login;
- alteração atômica do hash e revogação de todas as sessões do usuário;
- expiração do cookie atual com os mesmos atributos do logout;
- `204 No Content` em sucesso e exigência de novo login;
- erro público estável para senha atual inválida, sem modificar estado.

## Fora do escopo

- ID, e-mail ou perfil de usuário no contrato da operação;
- senha de outro usuário, mesmo quando o ator for administrador;
- alteração pelo CRUD de `/api/usuarios`;
- recuperação sem a senha atual;
- login automático ou preservação da sessão atual;
- histórico de senhas, rotação periódica e MFA;
- página, formulário, operação ou hook Web;
- qualquer alteração no aplicativo mobile.

## Decisões aprovadas

- Sessão válida não substitui a comprovação da senha atual.
- Os dois perfis podem alterar a própria senha nas mesmas condições.
- A senha atual incorreta não revoga sessões nem invalida recuperação.
- O endpoint nunca aceita um identificador de usuário selecionável pelo
  cliente.
- Todas as sessões, inclusive a usada na requisição, são revogadas em sucesso.
- O administrador não possui capacidade especial sobre senhas alheias.

## Critérios de aceite

- [x] requisição anônima ou com sessão inválida recebe `401`;
- [x] os dois perfis autenticados podem alterar somente a própria senha;
- [x] body com ID, e-mail, perfil ou propriedade extra é rejeitado;
- [x] senha atual inválida não altera senha nem sessões;
- [x] nova senha fora da política ou confirmação divergente é rejeitada;
- [x] sucesso muda o hash, revoga todas as sessões e expira o cookie;
- [x] concorrência não deixa senha alterada com sessões antigas válidas;
- [x] senha, hash e cookie não aparecem em response, log ou métrica;
- [x] nenhum arquivo de Web ou mobile é alterado.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/auth/auth.controller.ts`;
- `apps/api/src/modules/auth/auth.service.ts`;
- `apps/api/src/modules/auth/auth.repository.ts` e repositories relacionados;
- `apps/api/src/modules/auth/dtos/`;
- testes unitários do módulo e `apps/api/test/auth.e2e-spec.ts`;
- testes de integração PostgreSQL das transações e corridas;
- documentação de estado e roadmaps afetados, somente após verificação.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts test`;
- `corepack pnpm --filter @repo/database typecheck`;
- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test`;
- `corepack pnpm --filter @repo/api build`;
- integração PostgreSQL para atomicidade e concorrência;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. As verificações passaram em 18 de outubro de 2026, incluindo os
  testes de integração em PostgreSQL descartável. A invalidação de uma futura
  redefinição pendente será integrada quando o model correspondente for criado
  pelo `AUTH-003`, conforme a ordem de execução dessa tarefa.
