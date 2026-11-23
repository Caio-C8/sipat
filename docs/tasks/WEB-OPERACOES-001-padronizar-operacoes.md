# `WEB-OPERACOES-001` — Padronizar operações patrimoniais

**Status:** `implementada em 23/11/2026; validação automatizada e manual pendente`

## Objetivo

Aplicar a fundação visual e a matriz de leitura às telas de reavaliações,
depreciações, movimentações, empréstimos e baixas sem alterar seus domínios já
validados.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisitos: RF13–RF17 e RF20 em [requisitos](../requisitos-SIPAT.md).
- Tarefas existentes: [movimentações](./WEB-MOVIMENTACOES-002-paridade-visual-figma.md),
  [reavaliações](./WEB-REAVALIACOES-002-paridade-visual-figma.md),
  [depreciações](./WEB-DEPRECIACOES-002-disponibilidade-competencias-pendencias.md),
  [empréstimos](./WEB-EMPRESTIMOS-002-evolucao-visual-figma.md) e
  [baixas](./WEB-BAIXAS-001-interface-baixas.md).
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md) e
  [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

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

Executar de forma incremental, com regressão ao fim de cada domínio:

1. movimentações: reorganizar filtros e migrar lista/detalhe ao kit comum;
2. reavaliações: padronizar filtros, lista, detalhe, prévia e formulários;
3. depreciações: oferecer leitura ao Administrador e esconder processamento;
4. empréstimos: padronizar lista, seleção, confirmação, detalhe e devolução;
5. baixas: padronizar lista, detalhe e registro somente para o Diretor;
6. em todos, aplicar erros, toasts, sete casas monetárias, ações de consulta,
   estados vazios/loading e linguagem não técnica.

## Fora do escopo

- mudar URLs ou criar `/acoes/*`;
- criar edição, exclusão, estorno ou reprocessamento;
- alterar idempotência, datas, comissões, atomicidade ou regras históricas;
- liberar ao Administrador documento comprobatório original de baixa.

## Decisões aprovadas

- Administrador consulta; Diretor executa as mutações patrimoniais;
- relatório e PDF gerado de baixas ficam disponíveis aos dois perfis;
- ações da ficha patrimonial continuam nos drawers definidos em
  `WEB-PATRIMONIOS-002`;
- contratos e API podem evoluir diante de gap funcional, de autorização ou de
  feedback público comprovado; mudanças para feedback devem ser seguras,
  tipadas, cobertas nos consumidores e não podem alterar as regras dos domínios.

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

- [ ] cada domínio preserva integralmente seu fluxo funcional e URLs atuais.
- [ ] Administrador acessa leitura de depreciações sem poder processar.
- [ ] filtros são previsíveis, compartilháveis e não perdem paginação.
- [ ] mensagens não expõem API, servidor, stack, tabela ou código interno.
- [ ] idempotência e preservação de formulário continuam cobertas.
- [ ] valores monetários exibem sete casas em todas as cinco áreas.
- [ ] cada etapa possui validação real antes de avançar ao domínio seguinte.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(sistema)/{movimentacoes,reavaliacoes,depreciacao,emprestimos,baixas}/`;
- `apps/web/features/{movimentacoes,reavaliacoes,depreciacoes,emprestimos,baixas}/`;
- operações/contratos somente quando exigidos por `SEC-002`;
- testes unitários, E2E padrão e E2E reais de cada domínio.

## Verificações esperadas

- por domínio: lint, tipos, testes direcionados e E2E real aplicável;
- ao final: suíte Web, build e consumidores de contratos;
- ambos os perfis, idempotência, concorrência e PostgreSQL descartável;
- axe, teclado, zoom e viewports previstos;
- comparação com os frames vivos já usados nas tarefas anteriores quando
  continuarem válidos.

## Handoff de implementação

- Movimentações e reavaliações passaram a usar os campos, comboboxes, alerts,
  tabelas e paginação compartilhados nas consultas, preservando filtros na URL,
  detalhes e fluxos de criação existentes.
- Depreciações preservam a leitura do Administrador e condicionam comissão,
  confirmação residual e ações de processamento ao Diretor; competência,
  comissão, busca, seleção e tabela usam o kit comum.
- Os filtros de entidades de movimentações, reavaliações e baixas usam
  comboboxes pesquisáveis no mesmo padrão de patrimônios, sem os controles
  auxiliares de busca e paginação de opções.
- Empréstimos usam controles semânticos compartilhados na consulta, seleção,
  cadastro, revisão, detalhe e devolução. As abas foram substituídas pelo filtro
  de situação `Todos`, `Em andamento` ou `Finalizados`; a situação continua
  derivada das devoluções pela API, sem alterar agrupamento, idempotência ou
  contratos.
- Baixas usam campos, tabela e paginação comuns; o registro unitário escolhe o
  bem em um combobox pesquisável no próprio formulário e, após sucesso, exibe
  toast e retorna à listagem. O Administrador continua sem ação de registro nem
  acesso ao PDF comprobatório original.
- Depreciações possuem uma listagem pesquisável própria em `/depreciacoes`,
  sem recorte temporal por padrão e com filtro opcional por uma competência
  exata; a ação `Processar depreciações` conduz à tela preservada de
  competências em `/depreciacao`, que oferece o retorno para a listagem.
- Valores contábeis continuam formatados com sete casas por `formatBrl`; foi
  adicionada cobertura unitária explícita para reavaliações.
- Mensagens visíveis deixaram de mencionar API ou servidor. Testes E2E foram
  adaptados aos comboboxes e receberam uma asserção contra linguagem técnica.
- As páginas de consulta resolvem sessão e cabeçalhos antes dos ramos de
  validação, mantendo a ordem de suspensão estável durante navegações com
  filtros e evitando o aviso de uso condicional de `use()` do React.
- Por restrição da execução, nenhum teste, typecheck, build ou E2E foi
  executado. Foram executados somente lint direcionado aos arquivos Web
  alterados, Prettier direcionado e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
