# `WEB-SHELL-002` — Evoluir navegação e estados globais

**Status:** implementada e validada em 15/11/2026, incluindo a extensão de
cabeçalho e rodapé únicos.

## Objetivo

Tornar o shell autenticado previsível, legível e consistente em todas as rotas,
com navegação correta por perfil, estados explícitos e sem elementos ainda não
funcionais. Todas as páginas autenticadas devem usar o mesmo cabeçalho de página
e somente o rodapé global do shell.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Estado atual: [WEB-SHELL-001](./WEB-SHELL-001-padronizar-shell-autenticado.md).
- Decisões: [rotas](../apps/web/pages-and-routing.md),
  [UX e acessibilidade](../apps/web/responsive-ux-and-accessibility.md) e
  [SEC-002](./SEC-002-matriz-leitura-compartilhada.md).
- Fundação: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Escopo

- ordenar `Principal` como Início, Patrimônios, Cadastrar patrimônio,
  Reavaliações, Depreciações, Movimentações, Empréstimos, Baixas, Inventários,
  Manutenções e Relatórios;
- ordenar `Administração` como Processos de compra, Fornecedores, Setores,
  Responsáveis, Comissões, Naturezas, Espécies e Usuários;
- aplicar os perfis de `SEC-002`, preservando ações conforme a API;
- remover Configurações e Histórico patrimonial da sidebar; mover Minha conta
  para o menu do usuário;
- remover sino, painel e chamadas de notificações;
- fazer breadcrumb ancestral clicável e centralizar metadados de rota, label,
  perfis, breadcrumb e padrões de descendentes;
- manter item ativo/hover em detalhes e subrotas sem colisão por prefixo;
- manter como único rodapé de página o `SystemFooter` já implementado, com
  `SIPAT · <nome da tela>` e sem conteúdo à direita;
- remover de todas as páginas autenticadas os rodapés legados, assinaturas,
  metadados e textos finais que concorram com o `SystemFooter`;
- criar uma composição compartilhada `PageHeader`, com título e descrição à
  esquerda e uma área opcional de ações à direita;
- substituir os cabeçalhos individuais das páginas autenticadas por
  `PageHeader`, inclusive em listas, cadastros, detalhes e acesso direto às
  operações roteáveis;
- usar o mesmo `PageHeader` no dashboard, permitindo que a saudação seja o
  título e a data seja a descrição; quando não houver ação, omitir a área da
  direita sem inserir botão ou conteúdo de preenchimento;
- criar composição comum, com textos distintos, para acesso negado,
  autenticação necessária, indisponibilidade, `not-found` e erro de segmento,
  sempre com retorno e Início;
- substituir mensagens técnicas por linguagem orientada à ação do usuário.

## Fora do escopo

- implementar a busca global;
- mudar URLs atuais ou criar o grupo `/acoes`;
- criar central de notificações;
- alterar autorização apenas na Web.
- remover a `SystemTopbar`, cabeçalhos internos de seções/cards ou títulos de
  dialogs e drawers;
- remover áreas locais de ações de formulário ou `DialogFooter`; elas não são
  rodapés de página e devem apenas usar a composição visual apropriada.

## Decisões aprovadas

- sidebar e URLs permanecem como estão, mudando ordem, labels e correspondência;
- `SystemFooter` deriva a tela do catálogo central, não de props repetidas, e é
  o único elemento semântico de rodapé da página autenticada;
- `PageHeader` pertence a `components/shared`, não conhece domínio, API ou
  permissão e recebe título, descrição e ações opcionais por composição;
- ações ficam alinhadas à direita em telas amplas e abaixo do conteúdo textual
  quando a largura não comportar as duas áreas;
- cabeçalhos de seção continuam permitidos, mas não repetem o `h1`, a descrição
  ou as ações principais da página;
- páginas 404 e 403 compartilham composição visual, não o mesmo texto;
- modal roteável continua sendo página completa em acesso direto/refresh.

## Critérios de aceite

- [x] cada perfil recebe exatamente a ordem e as opções aprovadas.
- [x] detalhes como `/patrimonios/:id` mantêm o item pai ativo.
- [x] breadcrumb navega aos ancestrais reais e nunca exibe UUID técnico.
- [x] não existem sino, painel de notificações, Configurações ou Histórico na sidebar.
- [x] rodapé contém somente `SIPAT · <tela>` e funciona em todas as rotas.
- [x] 401, 403, 404 e falha transitória nunca produzem página vazia.
- [x] shell passa por teclado, reflow, zoom e viewports previstos.
- [x] toda página autenticada renderiza exatamente um `PageHeader` como
      cabeçalho principal, com um único `h1` e descrição significativa.
- [x] título e descrição ficam à esquerda; ações, quando existirem, ficam à
      direita e refluem de modo previsível em viewport estreita.
- [x] páginas sem ações não renderizam controles, placeholders ou contêiner
      vazio apenas para preencher a área direita.
- [x] nenhum header individual de página repete título, descrição ou ações fora
      do `PageHeader`; headers internos permanecem somente quando representam
      seções reais.
- [x] `SystemFooter` é o único rodapé de página sob `(sistema)` e nenhum rodapé
      legado aparece antes ou depois dele.
- [x] áreas de ações de formulários, dialogs e drawers continuam funcionais,
      mas não exibem assinatura, nome da tela ou conteúdo do rodapé global.
- [x] acesso direto, refresh, loading, vazio, erro e detalhe preservam a mesma
      estrutura de cabeçalho e rodapé.

## Arquivos ou módulos potencialmente afetados

- `apps/web/lib/navigation/system-navigation.ts` e testes;
- `apps/web/components/shared/{system-sidebar,system-topbar,current-breadcrumb,user-menu}.tsx`;
- `apps/web/components/shared/page-header.tsx` e testes;
- `apps/web/components/shared/system-footer.tsx` e `authenticated-shell.tsx`;
- `apps/web/components/shared/notifications-menu.tsx`;
- `apps/web/app/(sistema)/layout.tsx`, `error.tsx`, `not-found.tsx` e `loading.tsx`;
- páginas e features renderizadas sob `apps/web/app/(sistema)/`, removendo
  headers e footers de página duplicados;
- `apps/web/app/not-found.tsx` e composições compartilhadas de estado;
- E2E de shell, perfis e rotas descendentes.

## Verificações esperadas

- lint, tipos, testes e build Web;
- Playwright nos dois perfis, acesso direto, refresh, 401, 403 e 404;
- axe, teclado, foco, zoom de 200% e viewports 390/768/1440/1920;
- confirmação de que nenhum request de notificação permanece.
- busca estática e revisão visual que comprovem ausência de `<footer>` de
  página fora de `SystemFooter` e ausência de cabeçalhos principais legados;
- testes de `PageHeader` com nenhuma, uma e várias ações, inclusive reflow em
  viewport estreita;
- regressão das ações locais de formulários, dialogs e drawers.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Evidências da entrega

- O catálogo central resolve telas exatas e padrões dinâmicos, deriva item ativo,
  breadcrumb sem identificadores e o nome do rodapé. Testes unitários cobrem a
  ordem integral dos dois perfis e colisões entre rotas estáticas e dinâmicas.
- O sino, o painel, o componente e o hook que iniciava
  `GET /depreciacoes/pendencias/resumo` foram removidos do shell. O endpoint da
  API permanece disponível para outros consumidores aprovados.
- Lint, typecheck, build de produção e 135 testes Vitest em 33 arquivos foram
  aprovados para `@repo/web`.
- Playwright aprovou 22 cenários Chromium nos arquivos de autenticação, baixas e
  depreciações, cobrindo os dois perfis, acesso direto, 401, 403, 404, falha
  transitória, item pai, breadcrumb, rodapé, axe, teclado, foco, reflow,
  ampliação simulada e viewports 390, 768, 1440 e 1920.
- A validação não substitui inspeção manual completa com leitor de tela nem a CI
  integral do monorepo.
- A extensão criou `PageHeader` em `components/shared`, aplicou-o às páginas e
  aos estados de loading sob `(sistema)` e removeu os footers semânticos locais;
  a busca estática encontra `<footer>` somente em `SystemFooter` no escopo
  autenticado.
- A extensão passou no ESLint dos arquivos afetados, `next typegen`,
  `tsc --noEmit`, 146 testes Vitest em 36 arquivos e build de produção
  standalone. O primeiro build no sandbox compilou e falhou apenas ao criar
  symlinks no Windows; a repetição fora do sandbox concluiu com sucesso.
- Playwright aprovou os 21 cenários de `auth.e2e.ts` e `home.e2e.ts`, incluindo
  sessão, navegação, estados globais, 404, dashboard, viewport de 390 px e
  acessibilidade automatizável. Não foi feita inspeção visual manual de todas
  as rotas, zoom de 200% ou validação com leitor de tela nesta extensão.
