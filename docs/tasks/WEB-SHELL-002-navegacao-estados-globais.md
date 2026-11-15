# `WEB-SHELL-002` — Evoluir navegação e estados globais

**Status:** `implementada e validada em 15/11/2026`

## Objetivo

Tornar o shell autenticado previsível, legível e consistente em todas as rotas,
com navegação correta por perfil, estados explícitos e sem elementos ainda não
funcionais.

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
- incluir rodapé único `SIPAT · <nome da tela>`, sem conteúdo à direita;
- mostrar saudação e data somente no dashboard; outras páginas usam cabeçalho
  com título, descrição e ações;
- criar composição comum, com textos distintos, para acesso negado,
  autenticação necessária, indisponibilidade, `not-found` e erro de segmento,
  sempre com retorno e Início;
- substituir mensagens técnicas por linguagem orientada à ação do usuário.

## Fora do escopo

- implementar a busca global;
- mudar URLs atuais ou criar o grupo `/acoes`;
- criar central de notificações;
- alterar autorização apenas na Web.

## Decisões aprovadas

- sidebar e URLs permanecem como estão, mudando ordem, labels e correspondência;
- footer deriva a tela do catálogo central, não de props repetidas;
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

## Arquivos ou módulos potencialmente afetados

- `apps/web/lib/navigation/system-navigation.ts` e testes;
- `apps/web/components/shared/{system-sidebar,system-topbar,current-breadcrumb,user-menu}.tsx`;
- `apps/web/components/shared/notifications-menu.tsx`;
- `apps/web/app/(sistema)/layout.tsx`, `error.tsx`, `not-found.tsx` e `loading.tsx`;
- `apps/web/app/not-found.tsx` e composições compartilhadas de estado;
- E2E de shell, perfis e rotas descendentes.

## Verificações esperadas

- lint, tipos, testes e build Web;
- Playwright nos dois perfis, acesso direto, refresh, 401, 403 e 404;
- axe, teclado, foco, zoom de 200% e viewports 390/768/1440/1920;
- confirmação de que nenhum request de notificação permanece.

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
