# `MOBILE-HOME-001` — Criar home protegida e rota `/check`

**Status:** `aprovada`

## Objetivo

Transformar `/` na home autenticada inicial do mobile e mover a tela técnica
atual para `/check`, ampliando-a com catálogo de rotas e mantendo seu acesso e
seu aviso exclusivamente em desenvolvimento.

## Contexto e referências

- Dependência: [MOBILE-AUTH-002](./MOBILE-AUTH-002-telas-autenticacao.md).
- Roadmap: [aplicativo mobile](../apps/mobile/roadmap.md#primeira-entrega-autenticada).
- Matriz: [rotas e navegação](../apps/mobile/routing-and-navigation.md#navegação-autenticada).
- Estado atual: `apps/mobile/src/app/index.tsx` contém runtime, configuração e
  health check público da API.
- Referência funcional: `apps/web/app/page.tsx` mantém o catálogo público Web;
  o mobile reproduz a intenção, não o código ou o layout desktop.
- Referência visual da home futura: frame `Home` (`298:80`) do
  [Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=298-80).

## Escopo

- mover a composição e o comportamento da tela técnica atual de `/` para
  `/check`, preservando timeout, cancelamento, nova tentativa e validação do
  `GET /api/health`;
- adaptar `/check` à linguagem visual da home pública Web, com identificação do
  ambiente, runtime, health da API e catálogo de todas as rotas mobile realmente
  criadas;
- manter um único catálogo tipado com path, título, acesso, perfis e estado,
  consumido pela tela e por testes de completude;
- listar `/`, `/login`, `/redefinir-senha`, `/senha-atualizada` e `/check`, sem
  transformar rotas restritas em atalhos que burlem sua matriz;
- permitir `/check` sem sessão somente quando
  `EXPO_PUBLIC_APP_ENV=development`, para que a infraestrutura possa ser
  diagnosticada antes do login;
- fora de development, impedir renderização, health request e catálogo de
  `/check`, redirecionando pela mesma decisão de sessão usada para `/`;
- garantir que a faixa global abra `/check` em development e desapareça sem
  deixar espaço nas demais configurações;
- criar `/` sob o grupo autenticado, autorizada para `ADMINISTRADOR` e
  `DIRETOR_PATRIMONIO`, somente quando `trocaSenhaObrigatoria=false`;
- deixar a home sem widgets ou dados de domínio nesta etapa: apenas shell,
  topbar e uma ação de logout acessível;
- confirmar a identidade perto da entrada protegida e tratar restauração,
  `401`, pendência de primeiro acesso e indisponibilidade sem flash de conteúdo;
- atualizar testes, smoke test do export Web e documentação de estado depois da
  implementação verificada.

## Fora do escopo

- reproduzir os cards, totais, gráficos ou dados patrimoniais da home Web;
- consumir `/patrimonios` ou qualquer endpoint de domínio;
- tabs, sidebar, notificações, busca, ações rápidas ou navegação final;
- expor `/check` em staging ou produção por query, flag local ou gesto oculto;
- transformar o health público em prova de sessão ou autorização;
- copiar componentes internos do Next.js.

## Decisões aprovadas

- `/` substitui `/dashboard` como destino autenticado no mobile;
- a home vazia significa ausência de conteúdo de domínio, não ausência de shell,
  proteção ou logout;
- `/check` é pública apenas em development e não é endpoint de domínio;
- a disponibilidade de `/check` deriva exclusivamente da configuração pública
  validada, não de parâmetro manipulável na URL;
- o catálogo lista apenas rotas existentes no código e informa honestamente
  acesso, perfis e estado;
- tocar em rota protegida no catálogo continua submetido ao guard de navegação;
- health check continua sem credencial e não compartilha token com a operação;
- Android/iOS nativos são a validação funcional da sessão; o export Web continua
  cobrindo `/check`, layout e smoke test sem persistir Bearer.

## Critérios de aceite

- [ ] `/` não executa health check nem contém o conteúdo técnico anterior;
- [ ] `/` exige sessão comum dos dois perfis e redireciona anônimo ou primeiro
      acesso conforme a matriz;
- [ ] home não contém dados ilustrativos ou chamadas de domínio e oferece logout
      acessível no shell;
- [ ] `/check` preserva todos os estados do runtime e da API já implementados;
- [ ] catálogo e conjunto real de rotas não divergem sem falhar teste;
- [ ] `/check` funciona sem sessão em development, inclusive a partir do login;
- [ ] staging e produção não renderizam `/check`, não chamam health por essa
      rota e não exibem a faixa global;
- [ ] nenhum token, identidade completa ou dado privado aparece na tela técnica;
- [ ] refresh, deep link e acesso direto a `/`, `/check` e rotas de autenticação
      obedecem à matriz sem loop;
- [ ] telefone, tablet, retrato, paisagem, Web estreita/ampla, fonte ampliada e
      leitores de tela preservam conteúdo e ações;
- [ ] smoke test do container Web é atualizado para a nova raiz protegida e para
      a política de `/check` sem exigir credencial nativa em storage Web.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/index.tsx`, movido para o grupo autenticado ou composto
  por ele;
- `apps/mobile/src/app/check.tsx`;
- `apps/mobile/src/app/(app)/_layout.tsx`;
- novo catálogo em `apps/mobile/src/lib/navigation/` ou caminho equivalente;
- `apps/mobile/src/lib/api-health.ts` somente se a extração exigir ajuste sem
  mudar o contrato;
- `apps/mobile/src/config/public-app-config.ts` e testes;
- `apps/mobile/scripts/check-web-health.mjs`;
- testes de rota, sessão, catálogo e tela técnica;
- documentação de roadmap e handoff após conclusão.

## Verificações esperadas

- lint, typecheck, testes e export Android/iOS/Web de `@repo/mobile`;
- smoke test do container `mobile-web` para `/health`, raiz e política de
  development da verificação;
- integração nativa com sessão válida, anônima, pendente, expirada e API
  indisponível;
- acesso direto/deep link a todas as rotas catalogadas;
- inspeção manual de `/check` e home nos tamanhos e tecnologias assistivas
  definidos pela documentação mobile;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma para a home vazia e a rota técnica. Conteúdo real da home exigirá
  objetivo próprio com contratos, endpoints e desenho mobile aprovados.
