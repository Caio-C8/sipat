# `CONTRACTS-007` — Contratos de comissões

**Status:** `concluída`

## Objetivo

Definir os contratos compartilhados das operações de comissões e integrantes
antes da implementação do banco e da API.

## Contexto e referências

- Roadmap: [CONTRACTS-007](../roadmap.md#contracts-007--contratos-de-comissões).
- Requisitos: [RF03](../requisitos-SIPAT.md#rf03-gestão-de-responsáveis),
  [RF05](../requisitos-SIPAT.md#rf05-gestão-de-comissões),
  [UC05](../requisitos-SIPAT.md#uc05---gerenciar-comissões), RN11, RNF03,
  RNF05 e RNF06.
- Contratos: [convenções](../contracts/conventions.md),
  [integrações](../contracts/integrations.md),
  [testes](../contracts/testing.md) e
  [roadmap](../contracts/roadmap.md#contracts-007--operações-de-comissões).
- Dependência funcional:
  [RESPONSAVEIS-001](./RESPONSAVEIS-001-gerenciar-responsaveis.md).

## Escopo

- criar `packages/contracts/src/comissao/` com schemas, tipos derivados, testes
  e barrel próprio;
- exportar a feature pelo entrypoint público de `@repo/contracts` e proteger os
  exports com o teste da API pública;
- definir `TipoMembroComissaoSchema` com `PRESIDENTE | MEMBRO`;
- definir params UUID separados para comissão e integrante;
- definir criação com `nome` de até 150 caracteres, `descricao` opcional de até
  2.000 caracteres, `numeroAto` textual opcional de até 100 caracteres,
  `dataVigenciaInicio`, `dataVigenciaFim` e `membros` opcional com zero a 50
  itens;
- cada item inicial contém somente `responsavelId` e `papel`; rejeitar no mesmo
  payload responsável repetido e mais de um presidente;
- definir PATCH de comissão sem defaults de criação, preservando a diferença
  entre ausência e limpeza explícita dos campos opcionais;
- definir bodies próprios para adicionar um integrante e alterar somente seu
  papel; a alteração não aceita `responsavelId`;
- definir listagem paginada com padrão e máximo já adotados no projeto, busca
  textual finita, response resumida, detalhada e paginada;
- representar as datas de vigência como `DateOnly`, rejeitar data final anterior
  à inicial e manter os dois limites como parte do período;
- expor integrantes e auditoria permitida nas responses por allowlist, sem
  importar `@repo/database`.

## Fora do escopo

- Prisma, migration, banco ou módulo NestJS;
- consultar o banco em refinements para validar responsável ativo, comissão já
  utilizada ou concorrência de presidente;
- operações patrimoniais consumidoras de comissão;
- exclusão de comissão, Web e mobile.

## Decisões aprovadas

- uma comissão pode ser criada sem integrantes;
- a criação aceita no máximo 50 integrantes;
- adições posteriores não podem elevar a composição acima de 50 integrantes;
- pode existir zero ou um presidente, nunca dois;
- integrantes posteriores são adicionados e removidos individualmente;
- um vínculo existente só permite alterar o papel; trocar o responsável exige
  remover o vínculo e criar outro;
- `numeroAto` é texto opcional, não data;
- vigência usa datas civis e limites inclusivos;
- a restrição de alterações após uso é regra dependente de persistência e será
  aplicada pela API em `COMISSOES-001`.

## Critérios de aceite

- [x] payload mínimo cria comissão sem membros;
- [x] payload completo aceita até 50 responsáveis distintos e no máximo um
      presidente;
- [x] 51º integrante, responsável repetido, segundo presidente, papel inválido
      e datas invertidas são rejeitados com path corrigível;
- [x] alteração de papel aceita somente `papel` e rejeita propriedades extras;
- [x] PATCH diferencia campo ausente de `null` onde a limpeza for permitida;
- [x] responses não aceitam campos internos ou models Prisma;
- [x] tipos distinguem input de output quando houver transformação;
- [x] exports públicos e casos limítrofes possuem testes.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/comissao/`;
- `packages/contracts/src/index.ts`;
- `packages/contracts/src/public-api.test.ts` ou teste público equivalente;
- testes da feature;
- `docs/contracts/roadmap.md`, `docs/roadmap.md` e esta tarefa após verificação.

## Verificações esperadas

- `pnpm --filter @repo/contracts lint`;
- `pnpm --filter @repo/contracts typecheck`;
- `pnpm --filter @repo/contracts test`;
- typecheck dos consumidores API, Web e mobile para detectar regressões de
  exports, sem implementar interfaces nesses apps;
- Prettier nos documentos e arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
