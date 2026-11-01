# RELATORIOS-003 — Geração e download de PDF

**Status:** concluída em 01/11/2026

## Objetivo

Exportação autenticada real dos nove tipos a partir de nova consulta no servidor.

## Contexto e referências

- [Semântica, decisões e limites](../apps/api/relatorios-patrimoniais.md).
- [Roadmap](../roadmap.md).
- [Requisitos](../requisitos-SIPAT.md).

## Escopo

PDFKit, renderização dos nove tipos, assets, admissão, cancelamento e limites. Depende das consultas e ficha.

## Fora do escopo

Operações patrimoniais novas, estorno, BI, outras exportações e publicação.

## Decisões aprovadas

Seguir a fonte de verdade vinculada; ambos os perfis, PDFKit e nenhuma alteração operacional por consulta.

## Critérios de aceite

- [x] Escopo implementado e verificado.
- [x] Evidências e limitações registradas sem antecipar conclusão.

## Arquivos ou módulos potencialmente afetados

apps/api/src/modules/relatorios/pdf.service.ts, relatorio-limites.ts, assets/brasao.png, nest-cli.json, package.json e lockfile.

## Verificações esperadas

Conteúdo, limites, concorrência, segurança, vazio, textos longos, múltiplas páginas, inspeção visual, build e imagem API.

## Pendências ou decisões bloqueantes

Nenhuma decisão de produto pendente. Ambiente isolado preparado; nenhum dado operacional alterado. Capacidade de produção e bases legadas reais não foram medidas. A CI completa continua sendo o critério de integração.

## Verificações executadas em 01/11/2026

PDFKit 0.20.2; geração em memória antes dos headers. Nove PDFs HTTP reais, extração com pypdf e renderização/inspeção visual, incluindo acentos, HTML/URL literais, ausência de anotações ativas, vazio, texto de mais de 5 mil caracteres e múltiplas páginas (ficha de 29 páginas; relação com todos os 25 bens). Limite de 1.001 linhas rejeitado como JSON 422. Dataset acima de 8 MiB, concorrência, liberação de vaga, prazo e cancelamento testados. Imagem runner construída e smoke test PDFKit/brasão aprovado.

Resultados transversais, reprodução e limitações: [fonte única de relatórios](../apps/api/relatorios-patrimoniais.md#evidências-e-limitações).
