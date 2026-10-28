# `MOBILE-UI-001` — Reproduzir o shell mobile do Figma

**Status:** `implementada`; validação em Android/iOS reais, tablets, fonte
ampliada, TalkBack e VoiceOver continua pendente.

## Objetivo

Refazer o shell visual compartilhado das telas existentes do mobile para
corresponder exatamente ao protótipo da página `Telas Mobile`, incluindo a
topbar comum e a bottom bar do grupo autenticado, sem alterar o protótipo e sem
modificar a faixa técnica exclusiva de development.

## Contexto e referências

- Roadmap: [aplicativo mobile](../apps/mobile/roadmap.md).
- Arquitetura visual:
  [componentes e design system](../apps/mobile/components-and-design-system.md),
  [responsividade](../apps/mobile/responsive-ux-accessibility.md) e
  [rotas](../apps/mobile/routing-and-navigation.md).
- Estado entregue:
  [MOBILE-FOUNDATION-001](./MOBILE-FOUNDATION-001-estrutura-visual-navegacao.md)
  e [handoff](../apps/mobile/handoff.md).
- Referência visual obrigatória, somente leitura:
  [Figma — página Telas Mobile](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&p=f).

## Escopo

- antes de codificar, abrir o arquivo no aplicativo ou conector oficial do
  Figma, selecionar a página `Telas Mobile` e inspecionar os frames `Login`,
  `Crie sua nova senha`, `Senha atualizada` e `Home`;
- registrar no PR ou handoff evidência de comparação visual antes/depois, sem
  editar, comentar ou reorganizar o arquivo Figma;
- reconstruir `AppTopbar` conforme o componente comum do protótipo, incluindo
  brasão, wordmark, cores, alturas, paddings, alinhamentos e comportamento em
  safe area;
- preservar `DevelopmentCheckBanner` como componente independente e não alterar
  aparência, posição, regra de ambiente nem navegação para `/check`;
- criar `AppBottomBar` somente no layout `(app)`, com os destinos e estados
  visuais do protótipo;
- manter `Início` como item selecionado na Home e apresentar `Bens`,
  `Inventário`, ação central e demais destinos desenhados como indisponíveis
  enquanto suas páginas não existirem;
- itens indisponíveis devem usar semântica disabled, não navegar, não anunciar
  uma ação executável e não criar rotas vazias apenas para receber o toque;
- revisar tokens, assets e primitives compartilhadas usados pelas quatro telas,
  sem introduzir biblioteca visual desnecessária.

## Fora do escopo

- alterar qualquer nó, componente, estilo ou permissão do arquivo Figma;
- alterar `DevelopmentCheckBanner` ou a rota `/check`;
- criar páginas de bens, inventário, relatórios, scanner ou cadastro;
- implementar operações HTTP ou regras de perfil;
- fixar toda a aplicação em 390×844 ou sacrificar safe area, teclado, fonte
  ampliada, tablet, paisagem e Web para copiar coordenadas absolutas.

## Decisões aprovadas

- o Figma é a fonte visual vinculante; as telas atuais não são referência para
  perpetuar diferenças;
- “exatamente igual” cobre hierarquia, conteúdo, assets, cores, tipografia,
  espaçamento, bordas, raios, ícones, estados e alinhamento no frame 390×844;
- adaptações inevitáveis de safe area, teclado, fonte ampliada e dimensões
  diferentes devem preservar a composição e ser documentadas, não escondidas;
- topbar é comum às telas aprovadas; bottom bar existe somente em `(app)`;
- acesso visual ao protótipo é obrigatório. Permissão de edição não autoriza
  alteração e só deve ser solicitada se o conector usado não oferecer leitura
  com acesso de visualização.

## Critérios de aceite

- [x] o implementador usou o Figma e comparou os quatro frames na página
      correta, em vez de trabalhar somente por descrição textual;
- [x] topbar nas telas de autenticação e na Home corresponde ao protótipo em
      390×844 e responde corretamente às demais dimensões;
- [x] a faixa de development permanece funcional e visualmente inalterada;
- [x] bottom bar aparece no shell `(app)`, não aparece em `(auth)` nem em
      `/check` quando essa rota não usar o shell autenticado;
- [x] itens sem página estão visíveis como no protótipo e realmente disabled;
- [x] nenhuma rota placeholder foi criada;
- [x] testes cobrem renderização condicional, item ativo, itens disabled e
      ausência da bottom bar nas rotas de autenticação;
- [x] comparação visual local não apresenta diferenças não justificadas no
      shell; a Home de domínio e as telas de autenticação completas continuam
      nos objetivos próprios `MOBILE-HOME-002` e `MOBILE-AUTH-003`.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/_layout.tsx` somente para retirar do root o que deixar de
  ser realmente global;
- `apps/mobile/src/app/(auth)/_layout.tsx`;
- `apps/mobile/src/app/(app)/_layout.tsx`;
- `apps/mobile/src/components/shared/app-topbar.tsx` e seu teste;
- novo `apps/mobile/src/components/shared/app-bottom-bar.tsx` e testes;
- `apps/mobile/src/theme/tokens.ts`;
- `apps/mobile/assets/brasao.png` e novos assets locais exportados do Figma,
  quando necessários;
- `apps/mobile/src/components/ui/` somente para primitives reutilizadas.

`apps/mobile/src/components/shared/development-check-banner.tsx` e seu teste são
referências de regressão e não devem ser alterados por este objetivo.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- inspeção visual comparativa com o Figma em 390×844;
- telefone/tablet, retrato/paisagem, Web estreita/ampla, teclado e fonte
  ampliada;
- foco Web, nomes e estados acessíveis, TalkBack e VoiceOver quando disponíveis;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- O conector oficial usado no planejamento exigiu permissão de edição até para
  screenshot/contexto. Isso não autoriza alterar o arquivo: se o implementador
  enfrentar a mesma limitação, deve usar o Figma autenticado em modo de
  visualização ou solicitar acesso técnico mantendo o protótipo somente leitura.

## Resultado da execução

- Os frames `Login`, `Crie sua nova senha`, `Senha atualizada` e `Home` foram
  inspecionados no Figma autenticado em 390×844. O conector oficial não ofereceu
  leitura sem permissão de edição, portanto a comparação foi realizada no
  editor Web em modo somente leitura; nenhum nó ou comentário foi alterado.
- `AppTopbar` passou a reproduzir o cabeçalho azul-marinho, o brasão, o wordmark
  e a identificação municipal do protótipo, incluindo safe area superior.
- `AppBottomBar` foi adicionada somente ao layout `(app)`: `Início` permanece
  selecionado e `Bens`, `Inventário`, `Cadastro` e `Relatórios` são tabs
  disabled, sem handler e sem rotas placeholder.
- O `DevelopmentCheckBanner` e seu teste permaneceram sem alterações.
- Foram aprovados lint, typecheck, 38 testes em 15 arquivos e exports Android,
  iOS e Web. A comparação Web local confirmou o cabeçalho e o reflow em largura
  ampla; aparelhos, tablets e leitores de tela reais não foram validados.
