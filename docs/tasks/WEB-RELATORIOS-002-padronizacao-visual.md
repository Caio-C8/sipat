# `WEB-RELATORIOS-002` — Padronizar visualmente os relatórios

**Status:** `aprovada`

## Objetivo

Aplicar o kit visual novo à página de relatórios já funcional, preservando os
dez tipos, filtros, prévias e PDFs reais para os dois perfis.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF21](../requisitos-SIPAT.md#rf21-relatórios-patrimoniais).
- Fonte funcional: [relatórios patrimoniais](../apps/api/relatorios-patrimoniais.md),
  [WEB-RELATORIOS-001](./WEB-RELATORIOS-001-interface.md) e
  [CONTRACTS-017](./CONTRACTS-017-relatorios-patrimoniais.md).
- Fundação: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Escopo

- migrar catálogo, configuração, filtros, seletores, prévia, tabela e paginação
  para as composições compartilhadas;
- preservar URLs compartilháveis, alias legado documentado, invalidação de
  prévia e abertura/download do mesmo PDF;
- aplicar Combobox nos catálogos extensos e Select nos conjuntos pequenos;
- exibir exatamente sete casas em valores monetários da Web e dos PDFs;
- garantir os dez relatórios e seus PDFs, inclusive baixas, aos dois perfis;
- aplicar estados de erro, vazio, loading e linguagem aprovados;
- manter tabela rolável em viewport estreita e detalhes acessíveis por linha.

## Fora do escopo

- criar relatório, filtro, exportação ou cálculo novo;
- alterar consultas, catálogo ou semântica de parâmetros sem gap comprovado;
- substituir PDFKit ou mover geração para a Web;
- criar BI, gráficos ou exportação em planilha.

## Decisões aprovadas

- esta é uma refatoração visual com regressão funcional obrigatória;
- ambos os perfis possuem o mesmo catálogo e acesso a todos os relatórios;
- PDF comprobatório anexado à baixa não se confunde com PDF de relatório;
- valores monetários usam sete casas também no documento gerado.

## Critérios de aceite

- [ ] os dez tipos mantêm filtros, prévia, paginação e PDF corretos.
- [ ] filtros na URL sobrevivem a refresh e opção por UUID recupera seu rótulo.
- [ ] ambos os perfis geram o relatório/PDF de baixas.
- [ ] alterar filtro invalida a prévia anterior.
- [ ] PDF representa o conjunto filtrado completo, não só a página atual.
- [ ] layout não transborda e funciona por teclado/zoom/leitor de tela.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(sistema)/relatorios/`;
- `apps/web/features/relatorios/`;
- `apps/api/src/modules/relatorios/pdf/` apenas para formatação de sete casas;
- formatadores compartilhados e testes de snapshot/extração do PDF;
- E2E de relatórios e fixtures isoladas.

## Verificações esperadas

- lint, tipos, testes e build Web; API se o PDF mudar;
- E2E Web–API–PostgreSQL–PDF nos dois perfis;
- validação das dez categorias, paginação e PDF completo;
- renderização/extração do PDF e conferência de sete casas;
- axe, teclado, zoom e viewports 390/768/1440/1920.

## Pendências ou decisões bloqueantes

- Nenhuma.
