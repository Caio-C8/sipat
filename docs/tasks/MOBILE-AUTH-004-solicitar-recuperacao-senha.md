# `MOBILE-AUTH-004` — Solicitar recuperação de senha e retornar ao app

**Status:** implementada e validada automaticamente em 29 de outubro de 2026;
validação em build nativo/aparelho permanece pendente.

## Objetivo

Tornar funcional a ação `Esqueci minha senha` no aplicativo, permitir a
solicitação neutra pelo e-mail institucional usando a capacidade existente da
API e aceitar o retorno sem credenciais da conclusão Web para o login do app.

## Contexto e referências

- Roadmaps: [SIPAT](../roadmap.md#recuperação-de-senha-na-web-e-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#recuperação-de-senha-iniciada-no-mobile).
- Dependência funcional:
  [WEB-AUTH-002](./WEB-AUTH-002-recuperar-senha.md).
- Sessão e telas existentes:
  [MOBILE-AUTH-002](./MOBILE-AUTH-002-telas-autenticacao.md) e
  [MOBILE-AUTH-003](./MOBILE-AUTH-003-paridade-visual-figma.md).
- Contratos e backend: [CONTRACTS-003](./CONTRACTS-003-contratos-senha.md) e
  [AUTH-003](./AUTH-003-recuperar-senha.md).
- Integração: [Mobile–API](../integrations/mobile-api/README.md),
  [rotas](../apps/mobile/routing-and-navigation.md) e
  [segurança mobile](../apps/mobile/security.md).
- Referência visual obrigatória, somente leitura:
  [Figma — Telas Mobile](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f),
  frames `Login` (`334:43423`), `Crie sua nova senha` (`315:43371`) e
  `Senha atualizada` (`315:43202`).
- Fontes oficiais: [Expo — Linking into your app](https://docs.expo.dev/linking/into-your-app/)
  e [Expo Linking SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/linking/).

A tela de informar o e-mail não existe explicitamente no protótipo. Antes de
editar, o implementador deve abrir no navegador a página `Telas Mobile` e
inspecionar os três frames indicados. A nova tela deve reutilizar a forma e o
estilo desses frames e das telas implementadas; descrição textual, screenshot
copiada ou memória não substituem essa inspeção.

## Ordem de execução

1. Confirmar worktree, app config, catálogo, matriz de sessão, contratos e
   proteção atual do endpoint público de solicitação.
2. Abrir e comparar os frames obrigatórios no Figma em modo somente leitura.
3. Permitir que o transporte nativo chame o endpoint existente
   `POST /api/auth/esqueceu-senha` sem forjar uma origem Web e sem alterar
   `POST /api/auth/redefinir-senha`; documentar e testar a exceção granular de
   CSRF da solicitação pública, mantendo validação, CORS e rate limit.
4. Adicionar à feature mobile uma operação pública de solicitação, sem Bearer,
   refresh, retry automático ou persistência, validando input e response.
5. Criar `/esqueci-senha`, ligar a ação do login e implementar formulário,
   pending, erros e confirmação neutra conforme os padrões visuais existentes.
6. Registrar a nova rota pública no catálogo e ajustar a matriz de redirects
   sem permitir acesso às rotas autenticadas.
7. Tratar `sipat://login?origem=recuperacao-senha` como navegação não sensível:
   abrir `/login`, remover o parâmetro da navegação e anunciar que a senha foi
   atualizada na Web e que um novo login é necessário.
8. Testar cold start, app em background, parâmetro ausente/inválido e sessão
   antiga revogada, sem transportar o token de recuperação.
9. Executar verificações e atualizar estado documental somente após evidência.

## Escopo

- reutilizar `POST /api/auth/esqueceu-senha`; não criar
  `/api/auth/mobile/esqueceu-senha`;
- ajuste mínimo da API para reconhecer essa operação pública como compatível
  com transporte nativo sem transformar outras mutations Web em isentas;
- `/esqueci-senha` pública dentro do grupo `(auth)`, acessível pelo login;
- formulário com somente e-mail institucional e response neutra já contratada;
- estados de validação, pending, sucesso, `429`, timeout, offline,
  indisponibilidade e response incompatível;
- nenhum retry automático da mutation e bloqueio de submissão duplicada;
- botão para voltar ao login após a confirmação da solicitação;
- deep link tokenless `sipat://login?origem=recuperacao-senha`;
- mensagem de retorno no login sem afirmar qual conta foi alterada;
- limpeza do parâmetro depois de consumido para que refresh ou nova abertura
  não repita indefinidamente o aviso;
- novo build nativo, pois o comportamento do esquema precisa ser validado no
  binário e não somente no Expo Go ou no export Web;
- layout em 390×844 derivado do Figma, com adaptação para tablet, paisagem,
  teclado, safe area e fonte ampliada conforme as regras mobile.

## Fora do escopo

- receber, armazenar ou consumir o token de recuperação no app;
- tela mobile para escolher a nova senha;
- endpoint exclusivo para mobile ou mudança dos contratos de recuperação;
- login automático, restauração de sessão revogada ou transporte de senha;
- Universal Links, Android App Links, arquivo `assetlinks.json`, AASA ou domínio
  associado nesta entrega;
- fallback Web automático baseado em temporizador;
- editar o Figma ou declarar pixel perfect para uma tela que não possui frame.

## Decisões aprovadas

- O app apenas inicia o pedido. O e-mail sempre abre a Web e a nova senha é
  definida somente no consumidor Web de `WEB-AUTH-002`.
- O endpoint existente será reutilizado. A compatibilidade nativa deve ser
  explícita e limitada à solicitação pública, que não lê cookie nem sessão;
  redefinição, login Web e demais mutations preservam a política atual.
- CORS não protege clientes nativos. A defesa contra abuso continua no schema,
  response neutra e rate limit persistente por HMAC já implementado.
- O esquema `sipat` já existe em `app.json`. O retorno carrega apenas a origem
  não sensível e nunca token, e-mail, senha, ID ou perfil.
- Expo Go não é evidência do deep link estável; development build, APK ou build
  iOS instalado é obrigatório para essa parte do aceite.

## Matriz de rotas

| Rota                                     | Acesso  | Comportamento                               |
| ---------------------------------------- | ------- | ------------------------------------------- |
| `/login`                                 | anônimo | abre solicitação e recebe retorno tokenless |
| `/esqueci-senha`                         | pública | solicita e-mail e volta ao login            |
| `sipat://login?origem=recuperacao-senha` | externa | resolve para `/login` e consome a origem    |

Sessão válida continua seguindo a matriz já implementada. Uma sessão revogada
pela redefinição Web deve falhar normalmente na restauração/renovação e terminar
no login; o aviso de retorno não concede acesso nem altera essa decisão.

## Critérios de aceite

- [x] `Esqueci minha senha` deixa de estar disabled e abre a nova rota;
- [x] o formulário valida o contrato e envia somente o e-mail normalizado;
- [x] conta ativa, inexistente ou inativa produz a mesma confirmação pública;
- [x] `429`, timeout, offline, indisponível e response inválida são distintos
      sem revelar existência da conta;
- [x] não existe Bearer, refresh, retry automático ou storage na solicitação;
- [x] a API reutiliza o mesmo endpoint e preserva CSRF nas demais mutations;
- [x] a nova composição foi comparada diretamente com os três frames e segue
      os componentes/tokens existentes, com a ausência de frame registrada;
- [ ] o deep link abre o login em cold start e com o app em background;
- [x] o login anuncia o retorno uma vez, exige credenciais e não mostra dado
      sensível;
- [x] token, e-mail e senha nunca aparecem no deep link, catálogo, logs,
      métricas ou armazenamento local;
- [x] sessão anterior revogada não é restaurada depois da redefinição;
- [ ] Android e iOS/export Web não sofrem regressão, e a abertura real é
      validada ao menos em build nativo disponível, com limitações relatadas.

## Evidência da execução em 29 de outubro de 2026

- Figma inspecionado no navegador, em modo somente leitura, nos frames `Login`
  (`334:43423`), `Crie sua nova senha` (`315:43371`) e `Senha atualizada`
  (`315:43202`), todos em 390×844. A nova tela deriva da composição existente;
  não há frame próprio e não foi declarada paridade pixel perfect.
- API: lint, typecheck, 376 testes unitários/E2E e build aprovados. A suíte
  focada do Guard e autenticação aprovou 42 testes.
- PostgreSQL descartável `sipat_auth003_test`: 18 migrations aplicadas e 12
  testes de autenticação aprovados com despachante de e-mail fake; a base foi
  removida depois da execução.
- Mobile: lint, typecheck, 90 testes e exports Android, iOS e Web aprovados. A
  suíte focada de autenticação/rotas aprovou 26 testes.
- Prévia Expo Web revisada manualmente em 390×844: o link do login abriu
  `/esqueci-senha` sem overflow visível; o retorno com
  `origem=recuperacao-senha` exibiu o aviso neutro e removeu a query da URL.
- `pnpm security:patches`, `pnpm format:check` e `git diff --check` aprovados.
- Não foi produzido development build/APK nesta execução e não houve aparelho
  ou simulador iOS/Android disponível. Cold start, retorno com o app em
  background, teclado, fonte ampliada e TalkBack/VoiceOver permanecem como
  homologação nativa; os exports não comprovam esses comportamentos.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/auth/auth.controller.ts`, constantes/metadata de
  transporte e `guards/csrf.guard.ts`, somente no ajuste granular necessário;
- testes unitários dos Guards, controller e E2E da API;
- `apps/mobile/src/features/auth/api/auth-operations.ts` e testes;
- `apps/mobile/src/features/auth/forms/login-form.tsx`;
- nova composição/formulário de solicitação em
  `apps/mobile/src/features/auth/forms/`;
- nova rota `apps/mobile/src/app/(auth)/esqueci-senha.tsx`;
- `apps/mobile/src/lib/navigation/routes.ts` e testes de completude;
- sessão/roteamento apenas no tratamento do deep link tokenless;
- documentação de rotas, integração e segurança afetada.

Confirme os caminhos no worktree vivo e preserve mudanças alheias. Não altere
storage ou `SessionManager` além do comportamento estritamente necessário e
testado para a URL de entrada.

## Verificações esperadas

- lint, typecheck, testes e build de `@repo/api` para o ajuste de transporte;
- E2E da API provando a mesma response neutra e a manutenção de CSRF nas rotas
  que continuam protegidas;
- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes de operação, formulário, catálogo, redirects e parsing do deep link;
- integração real com API/PostgreSQL e SMTP fake, sem e-mail real;
- comparação manual com o Figma em 390×844 e revisão em tablet/paisagem;
- development build/APK e, quando disponível, build iOS instalado para cold
  start e background; Expo Go deve ser relatado apenas como verificação parcial;
- teclado, foco, fonte ampliada, TalkBack/VoiceOver quando disponíveis;
- `pnpm security:patches`, `pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma para implementação local. A comprovação integral em iOS depende de
  um build e aparelho/simulador compatíveis; ausência deve ser relatada, não
  convertida em sucesso presumido.
