# WEB-RELATORIOS-001 — Interface de relatórios

**Status:** concluída em 01/11/2026

## Objetivo

Página autenticada com catálogo, filtros, seleção real, prévia, ficha e PDF.

## Contexto e referências

- [Semântica, decisões e limites](../apps/api/relatorios-patrimoniais.md).
- [Roadmap](../roadmap.md).
- [Requisitos](../requisitos-SIPAT.md).

## Escopo

Seleção, filtros, prévia, ficha, paginação e download; extensão binária do cliente central. Depende das consultas e PDF.

## Fora do escopo

Operações patrimoniais novas, estorno, BI, outras exportações e publicação.

## Decisões aprovadas

Seguir a fonte de verdade vinculada; ambos os perfis, PDFKit e nenhuma alteração operacional por consulta.

## Critérios de aceite

- [x] Escopo implementado e verificado.
- [x] Evidências e limitações registradas sem antecipar conclusão.

## Arquivos ou módulos potencialmente afetados

apps/web/app/(sistema)/relatorios/, features/relatorios/, cliente HTTP central, navegação, observabilidade e testes.

## Verificações esperadas

Vitest, lint, tipos, build, navegador real Web–API–PostgreSQL–PDF, telas estreitas, teclado e zoom.

## Pendências ou decisões bloqueantes

Nenhuma decisão de produto pendente. Ambiente isolado preparado; nenhum dado operacional alterado. Capacidade de produção e bases legadas reais não foram medidas. A CI completa continua sendo o critério de integração.

## Verificações executadas em 01/11/2026

70 testes Vitest aprovados; lint, tipos e build Web. Três E2E em Google Chrome com API/PostgreSQL reais: nove tipos e PDF nos dois perfis, login real, seletores paginados, 25 registros com página 2, invalidação de prévia ao editar, vazio, teclado e larguras 390/768/1440. Axe sem violações no main. Zoom de 200% simulado por viewport CSS de 640×450 e densidade 2 em janela de referência 1280×900, com conteúdo acessível e sem overflow.

Resultados transversais, reprodução e limitações: [fonte única de relatórios](../apps/api/relatorios-patrimoniais.md#evidências-e-limitações).
