# `CONTRACTS-003` — Contratos de alteração e recuperação de senha

**Status:** concluída

## Objetivo

Entregar em `@repo/contracts` os schemas e tipos necessários para alteração e
recuperação de senha no backend, preservando os contratos existentes e sem
expor token, hash ou informação sobre a existência de uma conta.

## Contexto e referências

- Roadmap: [roadmap do SIPAT](../roadmap.md#contracts-003--contratos-de-alteração-e-recuperação-de-senha)
  e [roadmap de contratos](../contracts/roadmap.md#contracts-003--alteração-e-recuperação-de-senha).
- Requisitos e decisões: [RF01 e UC01](../requisitos-SIPAT.md#rf01-autenticação-e-controle-de-acesso)
  e [segurança de senha](../security-and-access.md#alteração-autenticada-da-própria-senha).
- Convenções: [arquitetura](../contracts/architecture.md),
  [convenções](../contracts/conventions.md), [erros](../contracts/errors.md),
  [integrações](../contracts/integrations.md) e
  [testes](../contracts/testing.md).
- Estado relacionado: `CONTRACTS-002`, `AUTH-001` e os contratos atuais em
  `packages/contracts/src/auth` e `packages/contracts/src/usuario`.

## Ordem de execução

1. Confirmar o estado Git e os exports atuais de autenticação e usuário.
2. Promover a regra de 15 a 128 pontos de código para uma primitive de senha
   reutilizável, sem alterar normalização, espaços ou limites já aprovados.
3. Preservar a compatibilidade do input de criação de usuário.
4. Implementar os três schemas de body e a response genérica de solicitação.
5. Exportar schemas e tipos pelos barrels de autenticação e do package.
6. Adicionar testes dos contratos e da API pública.
7. Executar as verificações e só então atualizar o status documental.

## Escopo

- `AlterarSenhaBodySchema` estrito com:
  - `senhaAtual` com 1 a 128 pontos de código, sem `trim`;
  - `novaSenha` com 15 a 128 pontos de código, sem `trim`;
  - `confirmacaoNovaSenha`, com a mesma representação de `novaSenha`;
  - refinamento que exija igualdade entre nova senha e confirmação.
- `SolicitarRedefinicaoSenhaBodySchema` estrito com `email`, reutilizando a
  normalização determinística já aplicada pelo projeto.
- `RedefinirSenhaBodySchema` estrito com:
  - `token` Base64url sem padding, com 43 caracteres correspondentes a 32
    bytes;
  - `novaSenha` e `confirmacaoNovaSenha`;
  - refinamento de confirmação.
- `SolicitarRedefinicaoSenhaResponseSchema` com status `202`, sucesso e uma
  única mensagem neutra para conta elegível, inexistente ou inativa.
- tipos TypeScript derivados dos schemas e exports públicos.
- testes de Unicode, espaços, limites, confirmação, token malformado,
  propriedades extras e campos sensíveis.

## Fora do escopo

- controller, service, repository, Prisma, SMTP ou variáveis de ambiente;
- mensagens que confirmem existência, situação ou recebimento do e-mail;
- token em response;
- mudança da política de senha aprovada;
- formulário, página, operação ou hook Web;
- qualquer mudança no aplicativo mobile;
- MFA, verificação de e-mail e senha administrativa.

## Decisões aprovadas

- Todos os e-mails cadastrados são institucionais e confiáveis nesta etapa.
- A confirmação integra o contrato externo, mas a API continua sendo a
  autoridade da validação.
- A senha permanece sem `trim`, normalização Unicode ou transformação.
- O token não identifica a conta fora da API e nunca aparece em response.
- Responses de sucesso de alteração e redefinição serão `204`, portanto não
  exigem schema de body.

## Critérios de aceite

- [x] os schemas rejeitam propriedades não declaradas;
- [x] nova senha e confirmação divergentes são rejeitadas;
- [x] limites contam pontos de código Unicode e preservam espaços;
- [x] token aceita somente a representação Base64url definida;
- [x] response `202` é idêntica para todos os estados de conta;
- [x] senha e token existem somente nos inputs necessários;
- [x] exports existentes permanecem compatíveis;
- [x] nenhum arquivo de Web ou mobile é alterado.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/auth/`;
- `packages/contracts/src/usuario/usuario-fields.schema.ts`;
- `packages/contracts/src/auth/index.ts`;
- `packages/contracts/src/index.ts`;
- testes de `packages/contracts/src/auth` e da API pública do package;
- `docs/contracts/roadmap.md`, somente após verificação.

## Verificações esperadas

- [x] `corepack pnpm --filter @repo/contracts lint`;
- [x] `corepack pnpm --filter @repo/contracts typecheck`;
- [x] `corepack pnpm --filter @repo/contracts test`;
- [x] typecheck dos consumidores API, Web e mobile para confirmar compatibilidade,
      sem alterar seus arquivos;
- [x] `corepack pnpm format:check`;
- [x] `git diff --check`.

As verificações acima passaram em 18 de outubro de 2026. A implementação ficou
restrita a `packages/contracts` e não alterou arquivos de Web ou mobile.

## Pendências ou decisões bloqueantes

- Nenhuma.
