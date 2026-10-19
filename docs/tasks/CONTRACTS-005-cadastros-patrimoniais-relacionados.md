# `CONTRACTS-005` — Contratos dos cadastros patrimoniais relacionados

**Status:** `aprovada`

## Objetivo

Definir contratos compartilhados para responsáveis, naturezas, espécies,
setores e fornecedores antes da implementação dos módulos da API.

## Contexto e referências

- Roadmap: [CONTRACTS-005](../roadmap.md#contracts-005--contratos-dos-cadastros-patrimoniais-relacionados).
- Requisitos: RF03, RF04, RF06, RF07 e RF08; UC03, UC04, UC06, UC07 e UC08
  em [Requisitos do SIPAT](../requisitos-SIPAT.md).
- Contratos: [convenções](../contracts/conventions.md),
  [integrações](../contracts/integrations.md) e
  [testes](../contracts/testing.md).

## Escopo

- params UUID, criação, alteração, situação, listagem paginada, resumo e detalhe
  conforme as operações permitidas para cada entidade;
- limites finitos, objetos estritos, datas ISO e responses por allowlist;
- responsável e setor com situação explícita;
- natureza e espécie com nome normalizado controlado pelo servidor;
- espécie vinculada a uma natureza;
- setor vinculado a um responsável;
- fornecedor com situação e dados definidos no RF08;
- testes dos schemas e exports públicos.

## Fora do escopo

- contratos de comissão, processo de compra, nota fiscal ou arquivo;
- implementação da API, banco, Web ou mobile;
- exclusão física de registros.

## Critérios de aceite

- [ ] inputs não aceitam auditoria, normalização ou estado protegido;
- [ ] updates distinguem ausência de campo e limpeza permitida;
- [ ] listagens possuem paginação e filtros finitos;
- [ ] responses não expõem models Prisma;
- [ ] API pública e testes de limites passam.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/responsavel/`;
- `packages/contracts/src/natureza/`;
- `packages/contracts/src/especie/`;
- `packages/contracts/src/setor/`;
- `packages/contracts/src/fornecedor/`;
- `packages/contracts/src/index.ts` e teste da API pública;
- `docs/contracts/roadmap.md` após verificação.

## Verificações esperadas

- lint, typecheck e testes de `@repo/contracts`;
- validação dos consumidores afetados;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
