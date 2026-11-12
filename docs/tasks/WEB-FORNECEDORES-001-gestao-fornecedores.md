# `WEB-FORNECEDORES-001` — Gestão Web de fornecedores

**Status:** `implementada`; validação visual no Figma e percurso opt-in contra
PostgreSQL descartável pendentes.

## Objetivo

Entregar a tela Web de gestão de fornecedores, exclusiva do
`ADMINISTRADOR`, com listagem, consulta, criação, alteração, ativação e
inativação integradas às rotas e aos contratos já existentes, preservando os
vínculos históricos e reproduzindo com fidelidade o padrão visual aprovado no
protótipo do Figma.

## Contexto e referências

- Roadmap Web:
  [WEB-FORNECEDORES-001](../apps/web/roadmap.md#web-fornecedores-001--gestão-web-de-fornecedores).
- Requisitos:
  [RF08](../requisitos-SIPAT.md#rf08-gestão-de-fornecedores) e
  [UC08](../requisitos-SIPAT.md#uc08---gerenciar-fornecedores), além de RNF01,
  RNF03, RNF05 e RNF06.
- API entregue:
  [FORNECEDORES-001](./FORNECEDORES-001-gerenciar-fornecedores.md).
- Contratos entregues:
  [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md) e
  `packages/contracts/src/fornecedor/fornecedor.schema.ts`.
- Integração Web–API:
  [clientes e operações](../integrations/web-api/README.md).
- Identidade e acesso: [política vigente](../security-and-access.md).
- Referência visual obrigatória: página `Telas PC`, nó `0:1`, do
  [protótipo SIPAT no Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&t=bV2ZOdKAFjE39sbT-1).

### Como usar a referência visual

Antes de alterar a interface, o implementador deve abrir o arquivo com
[@Figma](plugin://figma@openai-curated-remote), solicitar o contexto e as
capturas dos frames administrativos relacionados e comparar a implementação
renderizada com o protótipo. Não é suficiente trabalhar apenas a partir desta
tarefa, de screenshots transcritos ou do código Web existente.

Na inspeção de 12 de novembro de 2026, a página `Telas PC` não possuía um frame
específico de gestão de fornecedores nem textos de razão social, nome fantasia
ou CNPJ. Portanto, até que exista um frame próprio, a composição deve derivar
dos frames de cadastros administrativos do mesmo arquivo — especialmente os de
responsáveis e setores — para reproduzir exatamente shell, navegação, abas,
hierarquia, cartões, lista, formulário, tipografia, cores, bordas, espaçamentos,
ícones e estados. Os campos e comportamentos exclusivos de fornecedores vêm
dos requisitos e dos contratos existentes, não de suposições visuais. Se um
frame específico de fornecedores for adicionado ao arquivo antes da
implementação, ele passa a ser a referência visual prioritária e qualquer
divergência material deve voltar ao planejador.

## Estado confirmado

- `packages/contracts/src/fornecedor/fornecedor.schema.ts` já publica queries,
  params, bodies e responses para todas as operações previstas no RF08.
- `apps/api/src/modules/fornecedores/` já implementa as cinco rotas
  administrativas, CNPJ normalizado, busca paginada, conflitos, auditoria e
  inativação lógica.
- `apps/web/features/cadastros/api/complementos.ts` consulta somente
  fornecedores ativos para seletores de outros domínios; essa operação não
  substitui o CRUD administrativo.
- `apps/web/lib/navigation/system-navigation.ts` já reserva o item
  `Fornecedores`, mas o mantém sem rota e como não implementado.
- não existe a rota `/cadastros/fornecedores` nem a integração de gestão no
  fluxo genérico de `features/cadastros`.

## Escopo

- criar `/cadastros/fornecedores` com metadata `Fornecedores` e composição
  server-first no shell autenticado existente;
- habilitar o item `Fornecedores` somente para `ADMINISTRADOR`, com breadcrumb
  e estado ativo corretos;
- incluir fornecedores nas abas de cadastros e no fluxo genérico de listagem,
  seleção e edição, sem expor a aba ou os controles ao Diretor;
- listar fornecedores com paginação, busca e filtro opcional de situação
  (`todos`, `ativos` ou `inativos`) representados na URL;
- consultar o detalhe selecionado e preencher o formulário com razão social,
  nome fantasia, representante, CNPJ, e-mail, telefone e endereço;
- criar fornecedor com chave de idempotência e omitir campos opcionais vazios;
- alterar somente os campos previstos pelo contrato, preservando a diferença
  entre campo ausente e campo opcional explicitamente limpo com `null`;
- ativar ou inativar por operação própria, sem exclusão física, com confirmação
  proporcional e feedback acessível;
- mostrar a situação e as datas de criação/última atualização disponíveis no
  detalhe. Não inventar nome de autor a partir de `createdById`; caso a
  identificação nominal seja necessária, registrar a lacuna para decisão;
- validar inputs e responses com `@repo/contracts`, encaminhar cookie nas
  leituras server-side e enviar o cabeçalho CSRF vigente nas mutações;
- tratar loading, lista vazia, filtro sem resultado, erro recuperável, sucesso,
  submissão pendente, conflito de CNPJ, resultado incerto e acesso negado;
- manter reflow, teclado, foco visível, zoom, conteúdo longo e anúncios de
  status compatíveis com as regras Web existentes;
- estender testes unitários, E2E com backend estrito e o percurso opt-in contra
  API e PostgreSQL isolado.

## Fora do escopo

- migrations, mudanças no schema do banco ou novos campos persistidos;
- novos endpoints, alteração de autorização ou mudança silenciosa nos
  contratos públicos;
- exclusão física de fornecedor;
- alterar regras de processos de compra, notas fiscais ou manutenções;
- ampliar a gestão para `DIRETOR_PATRIMONIO`;
- criar uma biblioteca de estado remoto, estado global ou primitive visual sem
  necessidade demonstrada;
- redesenhar o shell ou os demais cadastros.

Se a implementação encontrar uma divergência comprovada entre API, banco ou
contrato e RF08/UC08, deve documentar a evidência e devolver a decisão ao
planejador antes de alterar outra camada. Um comportamento apenas diferente do
preferido pelo implementador não autoriza mudanças nessas camadas.

## Decisões aprovadas

- a rota canônica será `/cadastros/fornecedores`;
- a API permanece como autoridade de autorização: a Web filtra a navegação e
  nega a composição incompatível, mas não substitui o `403` do backend;
- a consulta administrativa inclui fornecedores ativos e inativos por padrão,
  pois o histórico deve permanecer acessível;
- criação, edição e situação reutilizam a arquitetura atual de cadastros e os
  clientes HTTP centrais; o seletor de fornecedores ativos de outros domínios
  permanece separado;
- o Figma é a fonte de verdade visual. Componentes existentes podem ser
  reutilizados somente quando reproduzirem o protótipo; diferenças visuais
  observadas devem ser corrigidas no escopo desta tela, sem redesign externo;
- a ausência atual de frame próprio não autoriza inventar outra linguagem
  visual: usa-se o padrão dos cadastros administrativos do mesmo protótipo e a
  semântica dos contratos de fornecedores.

## Sequência de implementação

1. confirmar novamente o frame vigente no Figma, os contratos exportados, as
   cinco rotas da API e o worktree antes de editar;
2. adicionar as operações tipadas de listar, consultar, criar, alterar e mudar
   situação, com testes do boundary HTTP;
3. integrar a nova seção ao roteamento, à navegação, às abas e ao carregamento
   server-side com bloqueio administrativo;
4. implementar formulário e situação na menor fronteira Client necessária,
   preservando idempotência, valores opcionais e erros de campo;
5. cobrir estados, permissão, responsividade e acessibilidade;
6. executar o fluxo mockado e, quando a infraestrutura opt-in estiver
   disponível, o percurso real com banco descartável;
7. comparar visualmente a rota renderizada com os frames do Figma nas larguras
   estreita, intermediária e ampla antes de marcar a tarefa como concluída.

## Critérios de aceite

- [ ] somente o Administrador vê o item e a aba de fornecedores, acessa a rota
      e executa as cinco operações; o Diretor não vê a navegação, recebe uma
      negação clara ao tentar a URL diretamente e continua recebendo `403` da
      API em chamadas diretas;
- [ ] lista, busca, filtro de situação, paginação e seleção persistem na URL e
      incluem inativos quando nenhum filtro de situação é aplicado;
- [ ] criação, alteração, ativação e inativação usam exatamente os contratos e
      endpoints existentes, sem retry automático de mutações;
- [ ] CNPJ inválido ou duplicado e demais erros contratuais aparecem de forma
      corrigível, sem apagar os dados preenchidos;
- [ ] campos opcionais vazios são omitidos na criação e podem ser limpos com
      `null` na alteração, sem converter silenciosamente valores diferentes;
- [ ] inativação não oferece exclusão nem oculta vínculos históricos e a
      situação atual fica explícita na lista e no detalhe;
- [ ] estados de loading, vazio, sem resultado, erro, pending, resultado
      incerto, sucesso e acesso negado são observáveis e acessíveis;
- [ ] a renderização corresponde ao protótipo do Figma em estrutura, cores,
      tipografia, dimensões, espaçamentos, controles, ícones e estados, com
      reflow funcional em 390, 900 e 1536 px e zoom de 200%;
- [ ] teclado, foco, headings, labels, nomes acessíveis, mensagens de erro e
      confirmação de situação foram revisados manualmente e por automação
      aplicável;
- [ ] nenhum arquivo de banco ou API é alterado sem uma divergência comprovada,
      decisão registrada e testes proporcionais.

## Arquivos ou módulos potencialmente afetados

### Implementação principal

- `apps/web/app/(sistema)/cadastros/fornecedores/page.tsx` — nova rota e
  metadata;
- `apps/web/lib/navigation/system-navigation.ts` e respectivo teste — rota,
  breadcrumb, visibilidade por perfil e item implementado;
- `apps/web/features/cadastros/components/abas-cadastros.tsx` — seção
  administrativa de fornecedores;
- `apps/web/features/cadastros/components/cadastros-telas.tsx` e
  `apps/web/app/(sistema)/cadastros/_cadastros-page.tsx` — configuração,
  listagem, filtros, resumo e carregamento server-side;
- novo componente dedicado em
  `apps/web/features/cadastros/components/formulario-fornecedor.tsx`, ou o
  arquivo de formulários existente se a coesão permanecer melhor — campos,
  envio, limpeza de opcionais e mudança de situação;
- `apps/web/features/cadastros/api/cadastro-operations.ts`, `server.ts` e
  `hooks.ts` — cinco operações de gestão com clientes existentes;
- `packages/contracts/src/fornecedor/fornecedor.schema.ts` e
  `apps/api/src/modules/fornecedores/` — somente leitura para confirmar o
  contrato; não são alvos normais de edição desta tarefa.

### Testes e fixtures

- `apps/web/features/cadastros/api/cadastro-operations.test.ts`;
- `apps/web/features/cadastros/components/cadastros-telas.test.tsx` e teste
  dedicado do formulário quando necessário;
- `apps/web/lib/navigation/tests/system-navigation.test.ts`;
- `apps/web/e2e/cadastros.e2e.ts` e
  `apps/web/e2e/support/api-mock.ts`;
- `apps/web/e2e/cadastros-real.e2e.ts` e
  `apps/web/e2e/support/seed-cadastros-real.mjs`.

Os caminhos são o ponto de partida confirmado em 12 de novembro de 2026. O
implementador deve reinspecionar o worktree e evitar mudanças em arquivos que
não forem necessários.

## Verificações esperadas

- lint, typecheck, testes e build de `@repo/web`;
- testes unitários localizados de operações, formulário, telas e navegação;
- E2E Chromium com API mockada estrita cobrindo os dois perfis, query, CRUD,
  situação, erros, axe e reflow;
- percurso opt-in contra API e PostgreSQL descartável cobrindo persistência,
  conflito de CNPJ, consulta de inativo e negação ao Diretor;
- inspeção visual lado a lado com o Figma, teclado, foco, zoom de 200%, conteúdo
  longo e viewports de 390, 900 e 1536 px;
- `pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Não há bloqueio para iniciar. Se surgir um frame específico de fornecedores
  no Figma ou se a API/contrato divergir materialmente de RF08/UC08, o
  implementador deve interromper a decisão afetada e devolver a divergência ao
  planejador.
