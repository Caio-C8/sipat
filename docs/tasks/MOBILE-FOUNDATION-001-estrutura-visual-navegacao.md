# `MOBILE-FOUNDATION-001` — Estruturar navegação e base visual mobile

**Status:** `aprovada`

## Objetivo

Preparar a estrutura real de rotas, layouts, tokens e componentes compartilhados
necessária às primeiras telas, incluindo a topbar SIPAT e a faixa de acesso à
verificação em desenvolvimento, sem antecipar domínio ou autenticação falsa.

## Contexto e referências

- Roadmap: [aplicativo mobile](../apps/mobile/roadmap.md#primeira-entrega-autenticada).
- Arquitetura: [estrutura aprovada](../apps/mobile/architecture.md#estrutura-aprovada-para-a-primeira-entrega-autenticada).
- UI: [componentes e design system](../apps/mobile/components-and-design-system.md#primeiros-elementos-compartilhados-aprovados).
- Rotas: [rotas e navegação](../apps/mobile/routing-and-navigation.md#navegação-autenticada).
- UX: [responsividade e acessibilidade](../apps/mobile/responsive-ux-accessibility.md).
- Referência visual: [arquivo Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1)
  e imagem anexada ao planejamento. O conector não conseguiu inspecionar o
  arquivo porque a conta conectada não possui permissão de edição.

## Escopo

- criar grupos `(auth)` e `(app)` somente com layouts e rotas consumidas pelas
  tarefas aprovadas, preservando as URLs públicas sem o nome do grupo;
- manter o layout raiz pequeno, com safe area, Stack, futura restauração da
  sessão e elementos realmente globais;
- extrair tokens semânticos mínimos observados nas telas, sem declarar um
  design system definitivo ou tema escuro ainda não validado;
- implementar `AppTopbar` com brasão, `SIPAT` e identificação da Câmara, comum
  a todas as rotas aprovadas;
- adicionar asset mobile local do brasão, sem import em runtime do diretório Web;
- implementar `DevelopmentCheckBanner` fixo abaixo da safe area, horizontal,
  acessível e presente em todas as telas somente em `development`;
- fazer a faixa abrir `/check` e adaptar seu texto quando já estiver nessa rota;
- garantir que a faixa não cubra topbar, conteúdo, teclado ou foco e suporte
  texto ampliado sem truncar informação essencial;
- criar primitives somente quando login, troca e confirmação demonstrarem
  reutilização real: botão, campo, senha, card e feedback;
- definir estados pressed, focus, disabled, loading e erro nas primitives;
- manter rotas como composição e lógica de sessão/formulário nas features;
- adicionar testes de componentes e layout necessários à base criada.

## Fora do escopo

- implementar HTTP, sessão, SecureStore ou redirects reais;
- implementar o conteúdo dos formulários ou da home;
- copiar componentes internos da Web ou introduzir CSS/Tailwind no nativo;
- tema escuro, navegação final do produto, tabs, drawer ou sidebar;
- biblioteca visual externa sem necessidade e compatibilidade comprovadas;
- fixar toda a aplicação na largura do frame mobile do Figma.

## Decisões aprovadas

- topbar aparece em login, troca obrigatória, confirmação, home e `/check`;
- a faixa de desenvolvimento aparece em todas essas telas e não é renderizada
  em staging ou produção;
- a faixa é uma ajuda de desenvolvimento, não autorização nem segredo;
- componentes usam primitives React Native e `StyleSheet` por padrão;
- mudanças de layout respondem à janela disponível e não ao modelo do aparelho;
- telefone, tablet Android, iPad, retrato, paisagem e React Native Web continuam
  requisitos de layout, ainda que a autenticação Web use transporte diferente;
- o Figma define hierarquia e aparência; acessibilidade, safe area e reflow têm
  precedência sobre coordenadas fixas do frame.

## Critérios de aceite

- [ ] grupos e layouts preservam `/`, `/login`, `/redefinir-senha`,
      `/senha-atualizada` e `/check` como paths tipados;
- [ ] topbar corresponde à referência disponível e permanece legível em
      telefone, tablet, paisagem e fonte ampliada;
- [ ] brasão possui arquivo válido, transparente/nítido e sem dependência do
      servidor Web;
- [ ] faixa aparece em todas as rotas em development, navega por ação acessível
      e não ocupa espaço em staging/produção;
- [ ] navegação por teclado no Web, TalkBack e VoiceOver recebem nome, função,
      estado e ordem coerentes;
- [ ] alvos de toque, contraste, foco e estados disabled/loading são verificáveis;
- [ ] nenhuma primitive conhece response HTTP, sessão ou regra de negócio;
- [ ] rotação e redimensionamento não causam conteúdo cortado, sobreposto ou
      preso a uma viewport estreita.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/_layout.tsx` e novos layouts de grupo;
- `apps/mobile/src/components/shared/`;
- `apps/mobile/src/components/ui/`;
- novo módulo de tokens em `apps/mobile/src/theme/` ou caminho equivalente;
- `apps/mobile/assets/brasao.png` ou formato local validado;
- testes de componentes e configuração de teste necessária;
- `apps/mobile/package.json` somente para dependência indispensável e aprovada.

## Verificações esperadas

- lint, typecheck, testes e export Android/iOS/Web de `@repo/mobile`;
- inspeção manual em 390×844, tablet Android, iPad, retrato, paisagem e Web
  estreita/ampla;
- teclado aberto, fonte ampliada, foco Web, TalkBack e VoiceOver;
- comparação visual com a imagem anexada e, quando o acesso for corrigido, com
  os frames móveis do Figma;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- A comparação direta de medidas, assets e estados do Figma depende de conceder
  acesso de edição à conta conectada. A imagem anexada é evidência suficiente
  para planejar, mas não para afirmar paridade visual pixel a pixel.
