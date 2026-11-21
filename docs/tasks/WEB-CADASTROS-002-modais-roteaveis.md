# `WEB-CADASTROS-002` — Padronizar cadastros e modais roteáveis

**Status:** `aprovada`

## Objetivo

Reorganizar os cadastros administrativos como páginas independentes, com
criação/edição roteáveis, ações coerentes e leitura para o Diretor conforme a
matriz aprovada.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Estado: `WEB-CADASTROS-001` no [roadmap Web](../apps/web/roadmap.md) e
  [WEB-FORNECEDORES-001](./WEB-FORNECEDORES-001-gestao-fornecedores.md).
- Requisitos: RF02–RF09 e RNF05 em [requisitos](../requisitos-SIPAT.md).
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md),
  [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md) e
  [WEB-SHELL-002](./WEB-SHELL-002-navegacao-estados-globais.md).

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

- manter páginas independentes para processos de compra, fornecedores,
  setores, responsáveis, comissões, naturezas, espécies e usuários;
- retirar a navegação interna que simula uma segunda sidebar/abas de cadastros;
- usar rotas canônicas para criar/editar e rotas interceptadas para abrir modal
  a partir da listagem, com página completa em URL direta/refresh;
- aplicar filtros, tabelas, paginação, campos, erros e feedback comuns;
- colocar ativar/inativar no formulário de edição das entidades que suportam
  situação, com confirmação e preservação histórica;
- Administrador mantém todas as mutações administrativas; Diretor recebe
  somente lista/detalhe de fornecedores, setores, responsáveis, comissões,
  naturezas e espécies;
- processos de compra permanecem integralmente disponíveis aos dois perfis;
- usuários permanecem exclusivos do Administrador;
- preservar notas, anexos, integrantes, locks e demais regras existentes.

## Fora do escopo

- transformar patrimônio, manutenção ou ações patrimoniais complexas em modal;
- permitir mutation administrativa ao Diretor;
- unificar contratos distintos em formulário dinâmico universal;
- exclusão física de cadastros históricos.

## Decisões aprovadas

- modal usa `Cancelar`; página de criação usa `Limpar`; edição direta usa
  `Restaurar alterações`;
- cada feature define seus campos/colunas sobre primitives compartilhadas;
- status inativo continua consultável nos contextos administrativos aprovados;
- fechar modal após sucesso atualiza a listagem e preserva seus filtros.

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

- [ ] cada cadastro possui URL canônica que funciona sem navegação anterior.
- [ ] abertura pela lista usa modal e refresh usa página completa equivalente.
- [ ] Diretor consulta os seis catálogos e não encontra controles de mutation.
- [ ] API retorna `403` se o Diretor tentar mutar por chamada direta.
- [ ] ativação/inativação fica junto da edição e exige confirmação.
- [ ] processos, notas, anexos e comissões não sofrem perda funcional.
- [ ] foco, histórico do navegador e botão Voltar funcionam nos modais.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(sistema)/cadastros/` e `apps/web/app/(sistema)/usuarios/`;
- `apps/web/features/{processos-compra,fornecedores,setores,responsaveis,comissoes,naturezas,especies,usuarios}/`;
- rotas paralelas/interceptadas do App Router;
- componentes compartilhados de formulário/lista;
- testes Web e E2E dos cadastros.

## Verificações esperadas

- lint, tipos, testes e build Web;
- regressão de contratos/API quando houver consumidor alterado;
- E2E com os dois perfis e PostgreSQL/arquivos descartáveis;
- navegação direta, refresh, Voltar/Avançar, teclado, foco e Escape;
- axe, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Execução incremental

### Etapa 1 — fundação

Implementada e validada manualmente em 20/11/2026:

- removida a navegação interna de cadastros que duplicava os destinos da
  sidebar;
- centralizados os caminhos canônicos de lista, criação e edição dos oito
  cadastros, reutilizando-os no catálogo da sidebar;
- criada a composição compartilhada `RouteModal` sobre a primitive `Dialog`,
  preservando fechamento por navegação, foco, teclado e reflow;
- migrado o modal roteável de inventários como consumidor de referência, sem
  alterar suas rotas, permissões ou regras;
- adicionada cobertura de componente para composição acessível e fechamento;
- mantidas as rotas e os fluxos cadastrais atuais nesta etapa.

### Etapa 2 — fornecedores, setores e responsáveis

Implementada em 20/11/2026, com validação local pendente:

- listas independentes com busca, situação, tabela, paginação e estados vazios;
- detalhes canônicos disponíveis ao Administrador e ao Diretor;
- criação e edição em URLs canônicas, com página completa em acesso direto e
  modal interceptado quando iniciadas pela listagem;
- controles de criação, edição e situação ausentes para o Diretor e protegidos
  na composição Server; a autorização da API permanece inalterada;
- ativação/inativação mantida junto da edição, com confirmação explícita e
  preservação dos vínculos históricos;
- ações secundárias diferenciadas entre `Limpar`, `Restaurar alterações` e
  `Cancelar`, conforme o contexto;
- testes unitários, de navegação e E2E relacionados atualizados sem execução.

Comissões, naturezas e espécies permanecem na Etapa 3. Processos de compra e
usuários permanecem na Etapa 4. Permissões integradas, regressão completa,
documentação final e os critérios de aceite globais permanecem na Etapa 5. Os
checklists acima não foram marcados porque a task completa ainda não foi
validada.
