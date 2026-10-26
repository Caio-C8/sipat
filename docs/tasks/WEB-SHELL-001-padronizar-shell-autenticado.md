# `WEB-SHELL-001` — Padronizar o shell autenticado por perfil

**Status:** `implementada`

## Objetivo

Transformar a estrutura hoje embutida no dashboard em um shell reutilizável
para as páginas autenticadas, com sidebar, topbar, breadcrumb e menu do usuário
consistentes. A navegação deve refletir o perfil autenticado sem prometer rotas
Web ainda inexistentes.

## Contexto e referências

- Roadmap: [aplicação Web](../apps/web/roadmap.md).
- Requisitos e decisões:
  [RF01 e papéis de usuário](../requisitos-SIPAT.md),
  [identidade e controle de acesso](../security-and-access.md),
  [páginas e roteamento](../apps/web/pages-and-routing.md),
  [componentes e design system](../apps/web/components-and-design-system.md) e
  [responsividade, UX e acessibilidade](../apps/web/responsive-ux-and-accessibility.md).
- Estado relacionado: [handoff Web](../apps/web/handoff.md) e
  [WEB-AUTH-001](./WEB-AUTH-001-integrar-autenticacao.md).
- Referência visual: frame `Home` (`298:80`, 1920 × 1080) do
  [arquivo do Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=298-80),
  além das capturas de sidebar e topbar fornecidas com a solicitação.

O estado atual concentra o shell, o conteúdo e os dados ilustrativos em
`app/_home/home-dashboard.tsx` e `app/_home/home.module.css`. A sidebar é um
Client Component exclusivo dessa tela, todos os itens sem rota são elementos
visuais e o logout aparece fora do menu do usuário.

## Escopo

- criar um layout compartilhado para o grupo de rotas autenticadas sem mudar a
  URL pública de `/dashboard`;
- confirmar a sessão no limite Server do layout, preservando os redirects de
  anônimo e de primeiro acesso definidos em `WEB-AUTH-001`;
- extrair sidebar e topbar para composições compartilhadas e manter Client
  Components somente nos controles que exigirem estado ou eventos;
- centralizar o catálogo de navegação com rótulo, ícone, caminho Web opcional,
  perfis permitidos, grupo e estado de implementação;
- filtrar a sidebar pelo `perfil` retornado por `/auth/me`; esconder opções que
  não pertencem ao perfil, em vez de apenas depender de uma resposta `403`;
- renderizar item navegável somente quando a rota Web existir. Itens aprovados
  para o perfil, mas ainda sem rota Web, permanecem visíveis, não clicáveis e
  identificados de modo acessível como `Não implementado`;
- preservar no desktop a composição visual do Figma: sidebar azul fixa,
  identificação do SIPAT e da Câmara, grupos de navegação e topbar clara;
- manter em viewport estreita um controle de menu com `aria-expanded`, foco
  visível, fechamento por `Escape` e devolução de foco ao acionador;
- fazer o breadcrumb variar conforme a rota atual por meio do mesmo catálogo de
  navegação, sem derivar texto diretamente de segmentos técnicos ou IDs;
- manter somente o campo de pesquisa na topbar. Enquanto o escopo da busca não
  estiver decidido, o campo fica desabilitado e informa `Pesquisa ainda não
implementada`; não deve haver submit, query, atalho ou chamada HTTP;
- remover o ícone de interrogação/ajuda;
- substituir o sino ilustrativo por um controle com nome acessível que abre um
  painel com as seções `Pendências recentes` e `Últimas operações`. Como não há
  endpoint de feed agregado, ambas exibem estado vazio explícito
  `Não implementado`, sem números, badges ou registros fictícios;
- transformar a área de identidade em menu acionado pela seta, mostrando nome,
  perfil e a opção `Sair`; reutilizar a operação de logout existente, preservar
  estado pending/erro e redirecionar para `/login` após sucesso;
- preservar o título e a metadata da página, o logo existente e os tokens
  visuais já disponíveis no projeto.

### Matriz inicial da sidebar

Esta matriz vem dos requisitos e das permissões efetivamente declaradas na API.
Ela controla visibilidade, não substitui autorização no backend.

| Opção                                    | Administrador | Diretor de Patrimônio | Rota Web atual |
| ---------------------------------------- | ------------- | --------------------- | -------------- |
| Início                                   | sim           | sim                   | `/dashboard`   |
| Pesquisar patrimônio                     | sim           | sim                   | inexistente    |
| Cadastrar patrimônio                     | não           | sim                   | inexistente    |
| Processos de compra e documentos fiscais | sim           | sim                   | inexistente    |
| Movimentações                            | não           | sim                   | inexistente    |
| Inventário                               | não           | sim                   | inexistente    |
| Empréstimos                              | não           | sim                   | inexistente    |
| Manutenção                               | sim           | sim                   | inexistente    |
| Reavaliação                              | não           | sim                   | inexistente    |
| Depreciação                              | não           | sim                   | inexistente    |
| Baixa e estorno                          | não           | sim                   | inexistente    |
| Histórico patrimonial                    | sim           | sim                   | inexistente    |
| Relatórios                               | sim           | sim                   | inexistente    |
| Usuários                                 | sim           | não                   | inexistente    |
| Responsáveis                             | sim           | não                   | inexistente    |
| Setores                                  | sim           | não                   | inexistente    |
| Comissões                                | sim           | não                   | inexistente    |
| Naturezas                                | sim           | não                   | inexistente    |
| Espécies                                 | sim           | não                   | inexistente    |
| Fornecedores                             | sim           | não                   | inexistente    |

`Configurações` não possui regra de produto, contrato de permissão ou rota
aprovada. Não deve entrar no catálogo até essa decisão existir.

## Fora do escopo

- criar as páginas de domínio listadas na sidebar;
- implementar busca global, atalhos ou sugestões;
- criar endpoints de notificações, pendências, histórico ou auditoria;
- alterar as permissões da API ou introduzir um novo perfil;
- implementar preferências, configurações ou troca de tema;
- alterar a identidade visual além do necessário para componentizar e adaptar o
  layout de referência.

## Decisões aprovadas

- O shell será compartilhado por layout de grupo de rotas, não importado
  manualmente em cada página.
- O perfil e o nome continuam vindo exclusivamente da identidade validada por
  `/auth/me` no servidor.
- A sidebar usa uma allowlist tipada por perfil. Ocultar uma opção melhora a UX,
  mas a API continua sendo a fronteira de autorização.
- Existência de endpoint da API não equivale a existência de página Web. Sem
  rota Web real, o item não recebe `href`.
- Funcionalidades futuras terão estado explícito e não usarão dados
  ilustrativos para parecer operacionais.
- O logout permanece a única ação funcional do menu do usuário nesta entrega.

## Critérios de aceite

- [x] `/dashboard` continua acessível no mesmo caminho e mantém os redirects da
      matriz de sessão para os dois perfis.
- [x] Sidebar e topbar são renderizadas pelo layout autenticado compartilhado,
      não por `HomeDashboard`.
- [x] Cada perfil visualiza somente as opções permitidas pela matriz e o teste
      cobre pelo menos uma opção exclusiva de cada perfil e uma opção comum.
- [x] Somente `/dashboard` é link navegável enquanto nenhuma outra rota Web
      existir; opções futuras exibem `Não implementado` e não alteram a URL.
- [x] Breadcrumb, item ativo e `aria-current` correspondem à rota atual.
- [x] A busca não executa ação e comunica que ainda não foi implementada.
- [x] O ícone de ajuda não é renderizado.
- [x] O sino abre e fecha por mouse e teclado, devolve foco e mostra as duas
      categorias sem conteúdo fictício.
- [x] A seta do usuário abre um menu que contém `Sair`; pending, falha e sucesso
      do logout continuam perceptíveis e testados.
- [x] O shell funciona em viewport estreita, intermediária e ampla, zoom de
      200%, teclado e conteúdo longo, sem scroll horizontal da página.
- [x] O layout raiz continua Server Component e as fronteiras Client ficam
      restritas ao menu móvel, breadcrumb dependente do pathname, notificações
      e menu do usuário.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/dashboard/page.tsx`;
- `apps/web/app/_home/home-dashboard.tsx`;
- `apps/web/app/_home/home-sidebar.tsx`;
- `apps/web/app/_home/home.module.css`;
- novo grupo de rotas e layout, preferencialmente
  `apps/web/app/(sistema)/layout.tsx` e
  `apps/web/app/(sistema)/dashboard/page.tsx`;
- novas composições em `apps/web/components/shared/` para shell, sidebar,
  topbar, breadcrumb, notificações e menu do usuário;
- catálogo tipado de navegação em `apps/web/lib/navigation/`;
- `apps/web/components/auth/logout-button.tsx`;
- `apps/web/e2e/auth.e2e.ts` e testes de componente que forem adicionados.

Os caminhos novos são orientação arquitetural; o implementador deve confirmar
o estado vivo do App Router antes de mover arquivos.

## Verificações esperadas

- `pnpm --filter @repo/web lint`;
- `pnpm --filter @repo/web typecheck`;
- `pnpm --filter @repo/web test`;
- `pnpm --filter @repo/web build`;
- `pnpm --filter @repo/web test:e2e`;
- inspeção manual com ambos os perfis, teclado, foco, `Escape`, zoom de 200% e
  viewports estreita, intermediária e ampla;
- comparação visual do shell com o frame `Home` e com as capturas fornecidas.

## Pendências ou decisões bloqueantes

- Nenhuma para esta entrega. A finalidade da pesquisa, a origem do feed de
  notificações e o escopo de `Configurações` permanecem decisões futuras e não
  devem ser antecipadas.
