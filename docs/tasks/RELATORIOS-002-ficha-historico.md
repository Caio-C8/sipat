# RELATORIOS-002 — Ficha e histórico consolidado

**Status:** concluída em 01/11/2026

## Objetivo

Ficha atual e agregação paginada dos 14 tipos de evento reais.

## Contexto e referências

- [Semântica, decisões e limites](../apps/api/relatorios-patrimoniais.md).
- [Roadmap](../roadmap.md).
- [Requisitos](../requisitos-SIPAT.md).

## Escopo

Cadastro atual e eventos reais RF20; paginação no banco e lacunas explícitas. Depende de CONTRACTS-017 e RELATORIOS-001.

## Fora do escopo

Operações patrimoniais novas, estorno, BI, outras exportações e publicação.

## Decisões aprovadas

Seguir a fonte de verdade vinculada; ambos os perfis, PDFKit e nenhuma alteração operacional por consulta.

## Critérios de aceite

- [x] Escopo implementado e verificado.
- [x] Evidências e limitações registradas sem antecipar conclusão.

## Arquivos ou módulos potencialmente afetados

apps/api/src/modules/relatorios/ficha.service.ts e types/fonte-eventos.ts, contratos e testes PostgreSQL.

## Verificações esperadas

Tipos de evento, ordenação, vínculos, datas desconhecidas, legados, PostgreSQL, HTTP, lint, tipos e build.

## Pendências ou decisões bloqueantes

Nenhuma decisão de produto pendente. Ambiente isolado preparado; nenhum dado operacional alterado. Capacidade de produção e bases legadas reais não foram medidas. A CI completa continua sendo o critério de integração.

## Verificações executadas em 01/11/2026

Os 14 tipos aparecem nas fixtures isoladas, com autoria legada nula, revisões individuais, localização posterior e correção separadas. Transferência de correção não é duplicada. Paginação e filtro por evento, cadastro baixado e PDF completo verificados. Lint, tipos e build API aprovados.

Resultados transversais, reprodução e limitações: [fonte única de relatórios](../apps/api/relatorios-patrimoniais.md#evidências-e-limitações).
