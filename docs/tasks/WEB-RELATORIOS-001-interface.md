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

## Evolução visual em 14/11/2026

A interface passou a separar catálogo, configuração e prévia por URLs compartilháveis. O catálogo usa os dez tipos e a disponibilidade retornados pela API. A configuração mantém os filtros de cada contrato, resumo da seleção e informações incluídas. A prévia mostra colunas por relatório, totais do conjunto filtrado, quantidade exibida na página e rastreabilidade recolhida. O parâmetro `relatorio` identifica a categoria na Web; `tipo` fica reservado ao filtro de manutenção ou baixa. Links antigos com `tipo` igual a uma categoria continuam aceitos.

O PDF continua sendo emitido pela API. A Web permite abri-lo no visualizador ou baixá-lo, reaproveitando o arquivo na tela atual. A busca de opções existente passou a reconhecer o UUID para recuperar o nome de uma opção em URLs recarregadas.

No banco local **de desenvolvimento** `localhost:5433/sipat`, foram criados 25 bens sintéticos identificados por `DEMO-RELATORIOS-14NOV2026`, números `9900141126001` a `9900141126025`. Um deles não tem situação contábil, para conferir o aviso de totais indisponíveis. A consulta pela etiqueta retornou 25 registros, 20 na primeira página e 5 na segunda. Esses dados persistem apenas nessa base local; não fazem parte de migrations ou seeds versionados.

Verificações desta execução: tipos, lint e 120 testes Vitest da Web aprovados; build Web aprovado; tipos e lint da API aprovados. O navegador local confirmou catálogo, configuração, prévia, paginação, abertura e download do PDF real. Baixado a partir da página 2 da prévia, o PDF A4 de 15 páginas indicou 25 registros na primeira página e incluiu o bem `9900141126025` na última, confirmando a exportação do conjunto completo. Em 390 e 768 px, não houve transbordamento da página; a tabela da prévia ofereceu rolagem horizontal. A navegação por Tab alcançou rastreabilidade, tabela, detalhes de cada linha, paginação e controles de PDF. As capturas da execução estão em `C:\Users\Arthur Aparecido\Documents\ChatGPT\Sipat\output\`.

O E2E isolado com o banco de integração não foi executado nesta evolução. O zoom a 200% também não foi conferido nesta execução; a checagem de 01/11, descrita acima, refere-se à versão anterior da interface. A comparação visual desta evolução foi feita nos três quadros desktop do Figma.
