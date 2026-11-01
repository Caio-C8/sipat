# RELATORIOS-001 — Consultas tabulares

**Status:** concluída em 01/11/2026

## Objetivo

Catálogo, oito consultas tabulares e seletores de leitura autorizados.

## Contexto e referências

- [Semântica, decisões e limites](../apps/api/relatorios-patrimoniais.md).
- [Roadmap](../roadmap.md).
- [Requisitos](../requisitos-SIPAT.md).

## Escopo

Catálogo, seletores e oito consultas reais, totais no banco e snapshot consistente. Depende de CONTRACTS-017.

## Fora do escopo

Operações patrimoniais novas, estorno, BI, outras exportações e publicação.

## Decisões aprovadas

Seguir a fonte de verdade vinculada; ambos os perfis, PDFKit e nenhuma alteração operacional por consulta.

## Critérios de aceite

- [x] Escopo implementado e verificado.
- [x] Evidências e limitações registradas sem antecipar conclusão.

## Arquivos ou módulos potencialmente afetados

apps/api/src/modules/relatorios/{relatorios.repository.ts,relatorios.service.ts,types/fontes-tabulares.ts,types/resumos-tabulares.ts,dtos,mappers}, AppModule e testes PostgreSQL.

## Verificações esperadas

Guards reais, PostgreSQL isolado, filtros, inativos/baixados, não duplicação, totais, planos, limites, lint, tipos e build.

## Pendências ou decisões bloqueantes

Nenhuma decisão de produto pendente. Ambiente isolado preparado; nenhum dado operacional alterado. Capacidade de produção e bases legadas reais não foram medidas. A CI completa continua sendo o critério de integração.

## Verificações executadas em 01/11/2026

Integração PostgreSQL 17 com Guards reais nos dois perfis: totais exatos, filtros, paginação, vazios, inativos/baixados, período em São Paulo, revisões sem inflação e planos EXPLAIN. Consultas somente leitura em RepeatableRead e timeout explícito. Lint, tipos e build API aprovados.

Resultados transversais, reprodução e limitações: [fonte única de relatórios](../apps/api/relatorios-patrimoniais.md#evidências-e-limitações).
