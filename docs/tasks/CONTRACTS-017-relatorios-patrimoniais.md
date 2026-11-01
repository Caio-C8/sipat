# CONTRACTS-017 — Contratos de relatórios patrimoniais

**Status:** concluída em 01/11/2026

## Objetivo

Schemas estritos dos nove relatórios, filtros/PDF, catálogo/opções, linhas/resumos e 14 variantes de eventos.

## Contexto e referências

- [Semântica, decisões e limites](../apps/api/relatorios-patrimoniais.md).
- [Roadmap](../roadmap.md).
- [Requisitos](../requisitos-SIPAT.md).

## Escopo

Schemas de filtros, respostas específicas, ficha/eventos, opções, catálogo, erros e limites.

## Fora do escopo

Operações patrimoniais novas, estorno, BI, outras exportações e publicação.

## Decisões aprovadas

Seguir a fonte de verdade vinculada; ambos os perfis, PDFKit e nenhuma alteração operacional por consulta.

## Critérios de aceite

- [x] Escopo implementado e verificado.
- [x] Evidências e limitações registradas sem antecipar conclusão.

## Arquivos ou módulos potencialmente afetados

packages/contracts/src/relatorio-patrimonial/ e export público.

## Verificações esperadas

Lint, tipos, parsing, datas, intervalos, propriedades desconhecidas, decimais, paginação e exports.

## Pendências ou decisões bloqueantes

Nenhuma decisão de produto pendente. Ambiente isolado preparado; nenhum dado operacional alterado. Capacidade de produção e bases legadas reais não foram medidas. A CI completa continua sendo o critério de integração.

## Verificações executadas em 01/11/2026

146 testes aprovados; lint e typecheck do package. API, Web e mobile passaram em tipos. Decimais como strings, totais de magnitude maior, campos nulos, períodos, enums, paginação e propriedades desconhecidas verificados.

Resultados transversais, reprodução e limitações: [fonte única de relatórios](../apps/api/relatorios-patrimoniais.md#evidências-e-limitações).
