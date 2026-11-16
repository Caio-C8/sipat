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

## Diretrizes obrigatórias de interface e feedback

- Padronizar a interface usando as primitives do shadcn como base para tabelas,
  campos, botões, dialogs, drawers, cards, alerts e demais controles. Não criar
  componentes visuais paralelos quando já houver primitive equivalente.
- Escolher controles pela semântica: `Input` para texto curto, `Textarea` para
  conteúdo longo, `Checkbox` para booleanos, `Select` para poucas opções
  fixas e `Combobox` para listas extensas, remotas ou pesquisáveis.
- Extrair para `components/shared` somente composições realmente reutilizadas
  por domínios distintos. Regras de negócio, permissões e estados específicos
  permanecem nas respectivas features.
- São permitidas mudanças de composição, hierarquia, agrupamento, espaçamento e
  apresentação visual quando melhorarem clareza e usabilidade, desde que
  preservem os requisitos funcionais e sigam o padrão visual já estabelecido.
- Centralizar cores em tokens e seguir a paleta: primário `#1E3A5F`, azul
  profundo `#0F2644`, apoio `#2A4F7A`, dourado `#D4A017`, dourado claro
  `#F5C842`, interativo `#2563EB`, fundo `#F8FAFC`, superfície `#FFFFFF`,
  texto `#0F172A`, texto auxiliar `#64748B` e borda `#E2E8F0`.
- Usar foco dourado de 3 px com afastamento de 2 px e nunca depender somente de
  cor para comunicar estado, prioridade ou resultado.
- Aplicar feedback conforme o tipo:
  - erro de campo fica abaixo do controle, com `aria-invalid`, borda vermelha e
    foco no primeiro campo inválido;
  - erro geral que exige correção usa `Alert` acima do formulário, recebe
    scroll/foco e permanece visível até a correção;
  - toast é reservado a sucesso ou falha geral não bloqueante e nunca é o único
    lugar para erro de campo, aviso persistente ou instrução necessária;
  - aviso contextual usa `Alert` quando houver pré-condição, consequência
    importante, ação irreversível ou informação que precise permanecer visível;
    não criar caixas meramente instrucionais ou decorativas;
  - ações destrutivas usam variante destrutiva e confirmação explícita.
- Escrever mensagens claras e orientadas à ação, sem expor termos de API, banco,
  servidor, stack ou implementação. Preservar teclado, foco, loading, disabled,
  responsividade e contraste.
- É permitido evoluir contratos compartilhados e responses de erro quando isso
  for necessário para fornecer feedback seguro e útil, inclusive campo, código
  público, mensagem pública ou condição de nova tentativa. Toda mudança deve
  atualizar validação, API, consumidores, testes e documentação; preservar
  compatibilidade quando possível; e nunca alterar regra de negócio,
  autorização ou contrato externo silenciosamente, nem expor detalhes internos.

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
  ajustes aditivos de contrato para feedback público continuam permitidos pelas
  diretrizes desta task;
- substituir PDFKit ou mover geração para a Web;
- criar BI, gráficos ou exportação em planilha.

## Decisões aprovadas

- esta é uma refatoração visual com regressão funcional obrigatória;
- ambos os perfis possuem o mesmo catálogo e acesso a todos os relatórios;
- PDF comprobatório anexado à baixa não se confunde com PDF de relatório;
- valores monetários usam sete casas também no documento gerado.

## Critérios de aceite

- [ ] interface usa primitives shadcn, tokens e composições compartilhadas sem
      duplicar controles equivalentes.
- [ ] controles seguem a semântica de Input, Textarea, Checkbox, Select e
      Combobox; teclado, foco, loading, disabled, contraste e reflow permanecem
      funcionais.
- [ ] erros de campo, erros gerais, toasts, alerts persistentes e confirmações
      destrutivas seguem os critérios desta task, com mensagens orientadas à
      ação e sem detalhes técnicos.
- [ ] qualquer evolução de contrato feita para melhorar feedback possui
      cobertura de validação, API, consumidores, testes e documentação, sem
      enfraquecer autorização ou alterar regra de negócio silenciosamente.

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
