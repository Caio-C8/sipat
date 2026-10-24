# `CONTRACTS-008` — Contratos de inventários

**Status:** `concluída`

## Objetivo

Definir os contratos compartilhados das operações de inventário antes da
implementação da persistência e da API, incluindo seus estados, resultados de
conferência, correções e conflitos de domínio.

## Contexto e referências

- Roadmap: [CONTRACTS-008](../roadmap.md#contracts-008--contratos-de-inventários).
- Requisitos: [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial),
  [UC19](../requisitos-SIPAT.md#uc19---realizar-inventário-patrimonial), RN08,
  RN09, RN11, RN19, RNF05, RNF06, RNF07, RNF10 e RNF11.
- Contratos: [convenções](../contracts/conventions.md),
  [integrações](../contracts/integrations.md),
  [testes](../contracts/testing.md) e
  [roadmap](../contracts/roadmap.md#contracts-008--operações-de-inventários).
- Dependências: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md) e
  [CONTRACTS-007](./CONTRACTS-007-contratos-comissoes.md).

## Escopo

- criar `packages/contracts/src/inventario/` com schemas, tipos derivados,
  testes e barrel próprio;
- exportar a feature pelo entrypoint público de `@repo/contracts` e proteger os
  exports com o teste da API pública;
- expor os enums de inventário já confirmados pelo domínio sem importar
  `@repo/database`;
- definir params UUID próprios para inventário, setor do inventário e item;
- definir criação estrita com `nome`, `descricao`, `observacao` e `comissaoId`,
  sem aceitar status, datas, setores, itens ou auditoria derivados pelo servidor;
- definir listagem paginada e filtros finitos por status, comissão e texto, além
  de resumo e detalhe com progresso agregado, setores e contagens de itens;
- definir responses paginadas dos setores e itens sem exigir que a API carregue
  coleções ilimitadas no detalhe do inventário;
- expor em cada item verificado o `statusPatrimonioNaVerificacao` e referências
  opcionais e seguras ao empréstimo ou item de manutenção vigente, sem depender
  do status atual mutável do patrimônio;
- definir a operação de início e conclusão de setor e a finalização do
  inventário, incluindo confirmação explícita quando houver correções pendentes;
- definir identificação por `numeroPatrimonial`, usada tanto por leitura de
  código de barras quanto por entrada manual, sem contrato específico de câmera;
- representar os resultados de conferência `CORRETO`, `DIVERGENCIA`,
  `NAO_LOCALIZADO`, leitura idempotente e patrimônio já verificado em outro
  setor;
- definir correção com escolha estrita entre
  `RETORNO_AO_SETOR_CADASTRADO` e `TRANSFERENCIA_CADASTRAL`; IDs de
  transferência, datas, estados e auditoria permanecem derivados pelo servidor;
- definir códigos públicos e estáveis para inventário finalizado, setor fora de
  andamento, outro setor em andamento, item já verificado, movimentação física
  sem histórico, correção incompatível e conflito concorrente.

## Fora do escopo

- Prisma, migration, banco ou módulo NestJS;
- consultar banco em refinements para validar comissão, setor, patrimônio,
  transferência ou concorrência;
- contratos das operações gerais de transferência, empréstimo, devolução,
  manutenção ou baixa;
- câmera, scanner, autenticação ou qualquer interface Web/mobile;
- reabertura ou alteração de inventário finalizado.

## Decisões aprovadas

- entram no inventário somente setores ativos e patrimônios ATIVOS existentes
  na criação;
- `ItemInventario` é o nome persistido e público do item; não haverá renomeação
  para `ItemSetorInventario` nesta entrega;
- o mesmo número patrimonial atende leitura de etiqueta e busca manual;
- leitura repetida no mesmo setor é idempotente; leitura após verificação em
  outro setor é conflito de domínio e não sobrescreve o resultado anterior;
- `NAO_LOCALIZADO` encerra a conferência do item com
  `statusVerificacao = VERIFICADO`;
- ausência conhecida por empréstimo ou manutenção continua sendo
  `NAO_LOCALIZADO`, mas preserva o status e a operação que existiam no instante
  da conclusão do setor;
- correções são aceitas somente antes da finalização do inventário;
- a finalização pode preservar correções pendentes, mas exige confirmação
  explícita nesse caso e torna o inventário imutável.

## Critérios de aceite

- [x] schemas distinguem inputs de estados e auditoria derivados;
- [x] criação não permite ao cliente escolher setores, itens, status ou datas;
- [x] paginação e filtros possuem limites finitos e defaults documentados;
- [x] responses usam allowlist, expõem progresso sem paths internos e não
      importam models Prisma;
- [x] início, conferência, correção, conclusão e finalização possuem contratos
      próprios, sem PATCH genérico de estado;
- [x] os dois tipos de correção são mutuamente exclusivos e não aceitam uma
      transferência criada pelo cliente;
- [x] resultados idempotentes e conflitos possuem payloads discriminados e
      testáveis;
- [x] datas usam `DateOnly` somente no inventário e instantes ISO 8601 nos
      setores, verificações e correções;
- [x] API pública, limites, propriedades extras e combinações inválidas possuem
      testes.

Concluída em 24 de outubro de 2026. As listagens reutilizam a paginação comum,
com página 1, limite padrão 20 e máximo 50. Lint, typecheck e 88 testes do
package passaram, assim como o typecheck dos consumidores API, Web e mobile.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/inventario/`;
- `packages/contracts/src/index.ts`;
- `packages/contracts/src/public-api.test.ts` ou teste público equivalente;
- testes da feature;
- `docs/contracts/roadmap.md`, `docs/roadmap.md` e esta tarefa após verificação.

## Verificações esperadas

- `pnpm --filter @repo/contracts lint`;
- `pnpm --filter @repo/contracts typecheck`;
- `pnpm --filter @repo/contracts test`;
- typecheck dos consumidores API, Web e mobile somente para detectar regressões
  nos exports, sem implementar interfaces;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
