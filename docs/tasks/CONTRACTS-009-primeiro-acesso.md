# `CONTRACTS-009` — Contratos do primeiro acesso

**Status:** `concluída`

## Objetivo

Definir os contratos compartilhados que permitem à API e à Web distinguir uma
sessão comum de uma sessão cujo usuário ainda precisa substituir a senha
inicial, sem expor senha, hash, token ou detalhes de persistência.

## Contexto e referências

- Roadmaps: [contratos](../contracts/roadmap.md) e
  [autenticação transversal](../roadmap.md#auth-004--obrigar-a-troca-da-senha-inicial);
- Requisitos e decisões:
  [identidade, sessão e controle de acesso](../security-and-access.md#primeiro-acesso-e-senha-inicial);
- Integração consumidora:
  [Web–API](../integrations/web-api/README.md#fluxo-web-de-autenticação-planejado).

## Escopo

- acrescentar `trocaSenhaObrigatoria: boolean` à identidade autenticada e,
  consequentemente, às responses de login e `/auth/me`;
- criar `ConcluirPrimeiroAcessoBodySchema` estrito com `novaSenha` e
  `confirmacaoNovaSenha`, reutilizando a política pública de senha;
- rejeitar confirmação divergente no boundary;
- exportar schema e tipos derivados pelo entrypoint público;
- atualizar testes diretos e de API pública dos contratos.

## Fora do escopo

- model, migration, endpoint, cookie ou transação da API;
- formulário, redirect ou estado visual da Web;
- recuperação de senha por token;
- expor `ultimoLoginAt`, identificador de sessão ou motivo interno da
  obrigatoriedade.

## Decisões aprovadas

- `trocaSenhaObrigatoria` é estado público mínimo de autenticação, não perfil
  nem permissão configurável;
- o body não recebe senha atual: a sessão restrita foi criada imediatamente
  após a verificação da senha inicial no login;
- a response de conclusão é `204 No Content`; a rotação do cookie pertence ao
  transporte HTTP e não cria payload público;
- a identidade continua usando allowlist estrita e nunca inclui segredo.

## Critérios de aceite

- [x] login e `/auth/me` aceitam exatamente a identidade segura acrescida de
      `trocaSenhaObrigatoria`;
- [x] o contrato de conclusão aceita somente nova senha e confirmação válidas;
- [x] propriedades extras, confirmação divergente e limites inválidos falham;
- [x] testes impedem senha, hash, token, cookie e campos de banco nas responses;
- [x] exports públicos, lint, typecheck e testes de `@repo/contracts` passam;
- [x] consumidores afetados compilam depois da atualização coordenada.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/auth/identidade-autenticada.schema.ts`;
- `packages/contracts/src/auth/login.schema.ts`;
- novo contrato em `packages/contracts/src/auth/`;
- `packages/contracts/src/auth/index.ts` e `packages/contracts/src/index.ts`;
- testes em `packages/contracts/src/auth/tests/` e da API pública do package.

## Verificações esperadas

- `pnpm --filter @repo/contracts lint`;
- `pnpm --filter @repo/contracts typecheck`;
- `pnpm --filter @repo/contracts test`;
- typecheck dos consumidores API e Web após a integração.

## Pendências ou decisões bloqueantes

- Nenhuma.
