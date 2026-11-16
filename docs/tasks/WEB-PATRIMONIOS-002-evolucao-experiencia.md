# `WEB-PATRIMONIOS-002` — Evoluir pesquisa, cadastro e ficha patrimonial

**Status:** `implementada` em 16/11/2026.

## Objetivo

Aplicar a experiência Web padronizada ao principal fluxo do SIPAT, tornando
pesquisa, cadastro e ações da ficha mais previsíveis sem mudar regras
patrimoniais existentes.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Estado: [WEB-PATRIMONIOS-001](./WEB-PATRIMONIOS-001-pesquisa-detalhe-acoes.md).
- Requisitos: RF10–RF12, RF20 e RNF02 em [requisitos](../requisitos-SIPAT.md).
- Fundações: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md),
  [WEB-SHELL-002](./WEB-SHELL-002-navegacao-estados-globais.md) e
  [SEC-002](./SEC-002-matriz-leitura-compartilhada.md).

## Escopo

1. Pesquisa:
   - expor setor, espécie e natureza como Combobox de seleção única, mantendo
     busca, status e tipo de número na URL;
   - remover aviso azul meramente instrucional;
   - usar paginação, tabela, filtros e ação de consulta compartilhados;
   - aceitar links do dashboard com `setorId` já selecionado.
2. Ficha:
   - abrir registrar baixa e substituir número em drawers equivalentes aos de
     movimentação e reavaliação;
   - preservar histórico, relatório, documentos e permissões existentes;
   - manter `?aba=historico` como destino compartilhável.
3. Cadastro:
   - reorganizar campos e grupos responsivos;
   - trocar espécie, setor e processo por Combobox quando o volume exigir;
   - mostrar natureza derivada da espécie e responsável derivado do setor como
     texto informativo, sem enviá-los no body;
   - obter e mostrar prévia não reservada dos próximos números oficial e `SP-`;
   - informar que o valor definitivo é atribuído na confirmação;
   - usar `Limpar`, com confirmação quando houver alterações;
   - aplicar máscaras, erros e feedback de `WEB-UI-001`.

## Fora do escopo

- permitir cadastro ao Administrador;
- permitir escolha manual de número, natureza ou responsável;
- reservar número durante o preenchimento;
- alterar cálculo, histórico ou regra das ações patrimoniais.

## Decisões aprovadas

- a prévia é informativa; a sequence e a transação continuam autoritativas;
- filtros ficam na URL e sobrevivem a refresh/compartilhamento;
- os quatro drawers pertencem à ficha, enquanto as páginas gerais continuam
  disponíveis;
- valores monetários exibem sete casas e inputs aceitam duas.

## Critérios de aceite

- [x] filtros combinam, limpam e paginam sem perder estado da URL.
- [x] Setor, espécie e natureza são pesquisáveis e acessíveis por teclado.
- [x] Administrador consulta sem receber qualquer mutation patrimonial.
- [x] drawers preservam foco, fechamento, erro, pending e refresh do detalhe.
- [x] cadastro não envia campos derivados nem aceita número manual.
- [x] concorrência pode mudar a prévia sem causar conflito ou número duplicado.
- [x] histórico e relatório da ficha não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/patrimonio/`;
- `apps/api/src/modules/patrimonios/` para a prévia aditiva;
- `apps/web/app/(sistema)/patrimonios/`;
- `apps/web/features/patrimonios/`;
- componentes compartilhados de filtros, tabela, paginação, drawer e campos;
- testes unitários, Web E2E e API E2E patrimoniais.

## Verificações esperadas

- contratos, API e Web: lint, tipos e testes;
- build Web;
- E2E com ambos os perfis e PostgreSQL descartável;
- concorrência da prévia versus confirmação;
- axe, teclado, zoom e viewports 390/768/1440/1920.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Handoff de execução — 15/11/2026

- A pesquisa passou a usar Combobox remoto para setor, espécie e natureza,
  preservando busca, situação, tipo de número, filtros relacionais e página na
  URL. A opção selecionada é consultada individualmente, inclusive em links do
  dashboard, e a paginação usa a composição compartilhada.
- O cadastro usa Combobox para espécie, setor e processo, campos derivados
  somente informativos, inputs numéricos compartilhados e `Limpar` com
  confirmação de perda. `GET /api/patrimonios/numeracao/previa`, exclusivo do
  Diretor, lê as duas sequences sem `nextval` e declara `reservaValor: false`;
  o body de criação continua sem número escolhido pelo cliente.
- Baixa, movimentação, reavaliação e substituição de número agora pertencem a
  drawers da ficha. A substituição mantém precondição, pending, erro no próprio
  drawer, fechamento protegido e `router.refresh()` após sucesso.
- Validações aprovadas: 154 testes de contratos; 20 testes unitários do service
  patrimonial; 18 E2E da API com autenticação, perfil e CSRF; 34 arquivos e 138
  testes Web; lint e typecheck direcionados de contratos, API e Web; build de
  API e Web; Prettier e `git diff --check`.
- PostgreSQL 17 descartável recebeu as 28 migrations e aprovou o cenário
  isolado de prévia concorrente e confirmações com números exclusivos. A suíte
  PostgreSQL patrimonial completa mantém falhas preexistentes de write conflict
  do adapter Prisma em outros testes concorrentes; essa correção não foi
  ampliada para esta tarefa. O contêiner descartável foi removido.
- Não houve homologação manual com leitor de tela, zoom e todos os viewports nem
  E2E Web real com os dois perfis nesta execução; o build e os testes de
  componente cobrem a composição, contratos e comportamento automatizável.

## Correções de usabilidade e disponibilidade — 15/11/2026

- O cadastro foi redistribuído em grupos alinhados. Número previsto, natureza,
  responsável e método linear deixaram de simular campos editáveis e passaram
  a ser informações derivadas explícitas. A modalidade residual agora separa
  valor em reais e percentual, mostra o input correspondente e calcula o valor
  equivalente e a estimativa mensal.
- A ficha passou a destacar todos os atributos de identificação, classificação,
  situação, aquisição, localização e depreciação. As quatro ações permanecem
  visíveis em modo somente leitura quando perfil, status, tipo de numeração ou
  classificação impedem a operação. O drawer de substituição consulta e exibe
  a prévia não reservada do novo número.
- O histórico usa campos, botões, limpeza e paginação compartilhados com as
  listagens. Os formulários compactos dos drawers passaram a reutilizar inputs,
  textareas e máscaras do conjunto Shadcn compartilhado nos campos alterados.
- A migration `20261115143000_corrige_disponibilidade_apos_reavaliacao` limita a
  igualdade entre parâmetro inicial e disponibilidade ao parâmetro inicial
  ainda vigente. Assim, uma reavaliação anterior pode encerrar o parâmetro sem
  início e a disponibilidade inicia somente o vigente, inclusive em bens
  emprestados ou em manutenção. Violações contábeis restantes retornam
  `409 ESTADO_CONTABIL_INCONSISTENTE` com mensagem pública.
- A API distingue a mensagem da função anterior à migration como
  `409 REGRA_DISPONIBILIDADE_DESATUALIZADA`; a Web esclarece que a falha não é
  causada pelo status operacional. Números S/P são apresentados como “não
  oficiais”, sem sugerir conversão automática posterior.
- Verificações adicionais: 24 testes unitários do service patrimonial; 35
  arquivos e 141 testes Web; lint e typecheck direcionados; builds de API e Web
  (`next build --webpack`); 29 migrations aplicadas desde banco vazio e teste
  PostgreSQL isolado do cenário reavaliado/em manutenção aprovado. O Turbopack
  falhou duas vezes ao iniciar seu worker de PostCSS; o build equivalente com
  Webpack concluiu todas as 39 páginas.
- A migration corretiva também foi aplicada no banco local de desenvolvimento;
  a confirmação do bem 39 em manutenção foi simulada com sucesso e integralmente
  revertida na mesma transação.

## Padronização visual e de feedback — 15/11/2026

- Pesquisa, cadastro, ficha, histórico e drawers passaram a compor `Table`,
  `Card`, `Button`, `Badge`, `Alert`, `Dialog`, `Drawer`, `Field`, `Input`,
  `Textarea`, `Checkbox`, `RadioGroup`, `Select` e `Combobox` do kit visual,
  sem controles visuais nativos paralelos.
- Campos curtos usam `Input`, descrições e justificativas usam `Textarea`,
  opções fixas usam `Select` e catálogos remotos usam `Combobox`. As
  composições reutilizadas permanecem em `components/shared`; regras e
  operações continuam nas features.
- A paleta institucional foi centralizada nos tokens globais, com foco dourado
  de 3 px e afastamento de 2 px. Erros de campo usam `aria-invalid` e mensagem
  associada; erros gerais persistem em `Alert` focável; confirmações de sucesso
  usam toast e ações irreversíveis usam variante destrutiva e confirmação.
- As mensagens visíveis foram revisadas para orientar a correção sem expor
  termos de API, banco de dados ou implementação.
- Verificações desta padronização: 35 arquivos e 141 testes Web; 24 testes
  unitários do service patrimonial; lint e typecheck direcionados de Web e API;
  builds de API e Web com Webpack; Prettier e `git diff --check`. Não houve
  homologação visual manual em todos os viewports nem com leitor de tela nesta
  execução.

## Correções de formulários e conflitos — 15/11/2026

- O drawer de movimentação passou a pesquisar comissão e setores diretamente
  nos `Combobox`, sem inputs, botões ou paginação de busca paralelos.
- Cadastro, movimentação, reavaliação e baixa mostram falhas de entrada sob o
  campo correspondente, com `aria-invalid` e foco no primeiro campo inválido.
  Os formulários não dependem da validação visual nativa do navegador.
- Os contratos de entrada usados nesses fluxos fornecem mensagens orientadas à
  seleção ou correção, sem expor UUID, nomes de propriedades ou mensagens
  padrão da biblioteca de validação.
- A baixa interpreta `PATRIMONIO_EM_INVENTARIO_ABERTO` e informa que o
  inventário deve ser finalizado antes da operação. Outros conflitos conhecidos
  de situação e baixa existente também possuem orientação específica.
- Verificações adicionais: 157 testes de contratos; 35 arquivos e 143 testes
  Web; lint completo de contratos e Web; typecheck de contratos e Web; build
  Web com Webpack das 39 páginas; Prettier e `git diff --check`.
- Os E2E de baixa e movimentação passaram a operar `Select` e `Combobox`
  pelos papéis acessíveis `combobox` e `option`, em vez de usar `selectOption`
  sobre controles que não são `<select>` nativos. Os dez cenários desses dois
  arquivos passaram juntos no Chromium; as variantes com PostgreSQL também
  foram atualizadas, mas não executadas sem os bancos descartáveis específicos.
  A verificação final incluiu ainda 36 arquivos e 146 testes Web, lint
  direcionado e typecheck de Web e API.
