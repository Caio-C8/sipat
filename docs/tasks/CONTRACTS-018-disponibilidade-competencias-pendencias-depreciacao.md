# `CONTRACTS-018` — Disponibilidade, competências e pendências de depreciação

**Status:** aprovada

## Objetivo

Evoluir os contratos compartilhados para separar tombamento de disponibilidade
para uso, classificar espécies depreciáveis, permitir competências devidas até
o mês corrente e expor pendências sem promover cálculo, auditoria ou estado
contábil a campos controlados pelo cliente.

## Contexto e referências

- Requisitos: [RF07, RF10, RF15, RN20–RN22 e UC22](../requisitos-SIPAT.md).
- Contratos atuais: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md),
  [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md),
  [CONTRACTS-011](./CONTRACTS-011-contratos-depreciacoes-patrimoniais.md) e
  [CONTRACTS-017](./CONTRACTS-017-relatorios-patrimoniais.md).
- Execução dependente: [DEPRECIACOES-002](./DEPRECIACOES-002-disponibilidade-competencias-integridade.md).
- Convenções: [contratos](../contracts/README.md),
  [integrações](../contracts/integrations.md) e
  [testes](../contracts/testing.md).

## Ordem de execução

1. Confirmar todos os consumidores de espécie, cadastro/detalhe patrimonial,
   depreciação e relatórios.
2. Alterar os contratos de espécie e patrimônio.
3. Definir a operação de disponibilidade para uso.
4. Evoluir consulta, execução e catálogo de competências de depreciação.
5. Definir resumo de pendências, relatório e motivos públicos.
6. Atualizar fixtures e consumidores até o typecheck, sem implementar regra de
   banco no package compartilhado.

## Escopo

- adicionar `depreciavel: boolean` obrigatório à criação, alteração, resumo,
  detalhe e opções de espécie;
- tornar `parametrosDepreciacao` condicional no cadastro patrimonial: o schema
  representa presença ou ausência, enquanto a API valida a combinação com a
  espécie persistida;
- permitir `dataInicio: null` no parâmetro atual retornado enquanto o bem ainda
  não possui disponibilidade confirmada;
- adicionar ao detalhe do patrimônio a disponibilidade anulável, com data
  civil, autor e instante de confirmação;
- definir `POST /api/patrimonios/:patrimonioId/disponibilidade-uso` com body
  estrito contendo somente `chaveIdempotencia` e `dataDisponivelUso`;
- a response da disponibilidade informa o fato criado e, para bem depreciável,
  a primeira competência derivada; não aceita `dataInicio`, competência,
  autoria ou instante enviados pelo cliente;
- preservar `CompetenciaMensalSchema` como `AAAA-MM` canônico e permitir na
  query competências devidas passadas ou corrente;
- definir `GET /api/depreciacoes/competencias`, exclusivo do Diretor, como
  consulta finita das competências devidas, ordenada da mais antiga para a mais
  recente, com competência, quantidade pendente e indicação da atual;
- incluir no item pendente disponibilidade, primeira competência, próxima
  competência devida e quota prevista;
- ampliar inelegibilidades com `BEM_NAO_DEPRECIAVEL`,
  `DISPONIBILIDADE_USO_NAO_CONFIRMADA`, `PRIMEIRA_COMPETENCIA_NAO_ATINGIDA` e
  `COMPETENCIA_ANTERIOR_PENDENTE`;
- substituir o erro de “competência não corrente” por códigos que distingam
  competência futura, anterior à primeira devida, sem obrigação e fora da
  ordem;
- definir `GET /api/depreciacoes/pendencias/resumo`, exclusivo do Diretor, como
  resumo derivado para a Web, contendo quantidade de bens, quantidade de
  competências, competência mais antiga e instante de referência, sem coleção
  ilimitada;
- definir relatório `pendencias-depreciacao`, separado do relatório histórico
  `depreciacoes`, com filtros finitos por competência, patrimônio, espécie e
  setor e resposta paginada; Administrador e Diretor podem consultar
  `GET /api/relatorios/pendencias-depreciacao` e exportar
  `GET /api/relatorios/pendencias-depreciacao/pdf`, seguindo os mesmos limites
  e envelope dos relatórios existentes;
- manter respostas com allowlist e valores decimais como string.

## Fora do escopo

- Prisma, SQL, cálculo, autorização ou consulta ao relógio;
- caixa de notificações persistente, lido/não lido, e-mail, push ou agendamento;
- depreciação diária, competência futura ou quota consolidada de vários meses;
- estorno, edição ou exclusão de disponibilidade ou depreciação;
- permitir subconjunto arbitrário no processamento em massa.

## Decisões aprovadas

- Disponibilidade é fato distinto de cadastro e tombamento e ocorre por uma
  mutação própria e idempotente.
- A primeira competência é derivada no servidor e nunca enviada pelo cliente.
- Competências devidas são exibidas como `AAAA-MM` na API; localização como
  `Abril de 2026` pertence à interface.
- Pendência e lançamento realizado são conceitos distintos e usam contratos de
  relatório separados.
- O resumo do sino é estado derivado e não antecipa uma central persistente de
  notificações.
- Catálogo, consulta tabular e PDF de pendências seguem o acesso atual dos
  relatórios; catálogo operacional, resumo e processamento continuam restritos
  ao Diretor de Patrimônio.

## Critérios de aceite

- [ ] espécie exige `depreciavel` e responses/opções o expõem;
- [ ] patrimônio detalhado distingue indisponível, disponível não depreciável e
      disponível depreciável;
- [ ] cliente não controla autoria, instante, início ou primeira competência;
- [ ] query aceita competência passada devida e rejeita representação inválida;
- [ ] catálogo, resumo e relatório são finitos, ordenados e expostos nas rotas
      definidas;
- [ ] motivos públicos cobrem disponibilidade, classificação e ordem;
- [ ] fixtures e exports públicos são atualizados sem propriedades extras;
- [ ] lint, typecheck e testes de contratos passam;
- [ ] API, Web e mobile passam no typecheck como consumidores.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/especie/`;
- `packages/contracts/src/patrimonio/`;
- `packages/contracts/src/depreciacao-patrimonio/`;
- `packages/contracts/src/relatorio-patrimonial/`;
- `packages/contracts/src/index.ts` e testes da API pública;
- fixtures e consumidores de `apps/api`, `apps/web` e `apps/mobile`.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts lint`;
- `corepack pnpm --filter @repo/contracts typecheck`;
- `corepack pnpm --filter @repo/contracts test`;
- typecheck dos três consumidores;
- `corepack pnpm exec prettier --check` nos arquivos alterados;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
