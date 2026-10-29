# `WEB-AUTH-002` — Solicitar e concluir recuperação de senha na Web

**Status:** implementada e validada automaticamente em 29 de outubro de 2026;
integração real com PostgreSQL e SMTP fake e abertura nativa permanecem
pendentes

## Objetivo

Entregar o consumidor Web completo da recuperação de senha já implementada na
API: solicitar o e-mail de redefinição, definir uma nova senha a partir do link
recebido e concluir o fluxo com alternativas para voltar ao aplicativo ou ao
login Web, sem criar endpoints novos nem misturar esse fluxo público com o
primeiro acesso autenticado.

## Contexto e referências

- Roadmaps: [SIPAT](../roadmap.md#recuperação-de-senha-na-web-e-no-mobile) e
  [Web](../apps/web/roadmap.md#web-auth-002--recuperação-de-senha-por-e-mail).
- Backend concluído: [AUTH-003](./AUTH-003-recuperar-senha.md).
- Contratos concluídos:
  [CONTRACTS-003](./CONTRACTS-003-contratos-senha.md).
- Fluxo Web existente:
  [WEB-AUTH-001](./WEB-AUTH-001-integrar-autenticacao.md).
- Segurança: [recuperação de senha](../security-and-access.md#recuperação-da-senha-por-e-mail-institucional)
  e [segurança Web](../apps/web/security.md).
- Integração: [Web–API](../integrations/web-api/README.md).
- Referência visual obrigatória, somente leitura:
  [Figma — Telas PC](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&p=f),
  especialmente `Login` (`334:43461`), `Crie sua nova senha` (`315:42521`) e
  `Senha atualizada` (`315:42590`).
- Fontes oficiais: [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
  e [Next.js `searchParams`](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams).

As telas de solicitação, redefinição por token e conclusão da recuperação não
existem explicitamente no protótipo. O implementador deve abrir os frames acima
no Figma antes de editar e criar as novas composições a partir da mesma forma,
hierarquia, tipografia, paleta, campos, ícones, cards, botões, espaçamentos e
responsividade. Uma descrição textual ou a interface atual não substitui a
inspeção visual.

## Ordem de execução

1. Confirmar worktree, versões, contratos, endpoints, configuração de
   recuperação e matriz atual das rotas de autenticação.
2. Abrir no navegador os três frames desktop indicados e comparar também as
   telas Web já implementadas; não editar o arquivo Figma.
3. Alterar o link emitido pela API de `/redefinir-senha?token=...` para
   `/recuperar-senha#token=...`, atualizar testes e apontar
   `AUTH_PASSWORD_RESET_URL` para a nova página Web sem incluir o fragmento.
4. Criar operações Web distintas para solicitar e concluir a redefinição,
   reutilizando os schemas públicos e o cliente HTTP comum.
5. Tornar funcional o link `Esqueci minha senha` do login e criar
   `/esqueci-senha` com o formulário de e-mail e a confirmação neutra.
6. Criar `/recuperar-senha`, capturar e validar o token do fragmento na menor
   fronteira Client e removê-lo imediatamente da URL com `history.replaceState`
   depois de mantê-lo somente em memória.
7. Implementar nova senha, confirmação, pending, erros de campo, indisponível,
   rate limit e token inválido/expirado/consumido sem revelar a conta.
8. Em `204`, limpar todos os campos sensíveis e navegar com substituição de
   histórico para `/recuperacao-concluida`, impedindo Voltar de reexibir o
   token ou o formulário preenchido.
9. Criar a conclusão pública com `Voltar ao app` para
   `sipat://login?origem=recuperacao-senha` e alternativa explícita
   `Ir para o login Web`; nenhum dado sensível integra o deep link.
10. Cobrir operações, formulários, rotas, histórico, headers, acessibilidade e
    o fluxo E2E; atualizar estado documental somente depois das verificações.

## Escopo

- reutilizar exatamente `POST /api/auth/esqueceu-senha` e
  `POST /api/auth/redefinir-senha` por meio de `/api/backend`;
- `/esqueci-senha` pública para solicitar o e-mail institucional;
- confirmação neutra na mesma tela, independentemente de conta ativa,
  inexistente ou inativa, sem contagem regressiva nem promessa de entrega;
- `/recuperar-senha` pública, autorizada somente pelo token de uso único;
- `/recuperacao-concluida` pública, sem token, senha, sessão ou identificação;
- preservar `/redefinir-senha` exclusivamente para o primeiro acesso com
  sessão e `trocaSenhaObrigatoria`; não criar modo implícito por query string;
- link de e-mail com token no fragmento, nunca no path, query, cookie, storage,
  log, métrica, analytics ou propriedade persistida;
- senha e token somente no estado transitório do formulário;
- usar os contratos `SolicitarRedefinicaoSenhaBodySchema`,
  `SolicitarRedefinicaoSenhaResponseSchema` e `RedefinirSenhaBodySchema`;
- manter `X-SIPAT-CSRF: 1`, Origin de mesma origem e ausência de retry
  automático nas duas mutations Web;
- metadata no padrão da aplicação e catálogo público de rotas atualizado;
- composição responsiva derivada dos frames desktop e dos equivalentes mobile,
  sem afirmar que as três novas telas possuem frames próprios;
- foco inicial, anúncio de erros e sucesso, teclado, zoom, conteúdo longo,
  autocomplete apropriado e controles de exibir/ocultar senha acessíveis.

## Matriz de rotas

| Rota                       | Acesso                        | Resultado principal  |
| -------------------------- | ----------------------------- | -------------------- |
| `/login`                   | anônimo                       | abre solicitação     |
| `/esqueci-senha`           | pública                       | envia pedido neutro  |
| `/recuperar-senha#token=…` | pública com token transitório | define nova senha    |
| `/recuperacao-concluida`   | pública e sem dado sensível   | volta ao app ou Web  |
| `/redefinir-senha`         | primeiro acesso com sessão    | permanece inalterada |

Sessão eventualmente presente não concede nem retira autoridade do token. A
API continua associando a conta exclusivamente pelo hash do token e revoga
todas as sessões quando a redefinição é concluída. Não há login automático.

## Fora do escopo

- endpoint novo, mudança dos schemas públicos ou recuperação específica para
  mobile;
- abrir o link de e-mail diretamente no app ou transportar o token ao app;
- App Links, Universal Links, domínio associado ou fallback automático por
  temporizador;
- reenvio automático, contagem regressiva ou indicação de que o e-mail existe;
- alteração da senha autenticada, primeiro acesso, MFA ou suporte assistido;
- editar o Figma ou afirmar paridade pixel a pixel com frames inexistentes.

## Decisões aprovadas

- Web e mobile terão telas próprias para informar o e-mail, mas somente a Web
  recebe o link, captura o token e define a nova senha.
- O token fica no fragmento e é removido da barra antes da submissão. Refresh
  posterior apresenta link ausente/inválido e não tenta recuperar o token.
- `Voltar ao app` usa o esquema `sipat`, já declarado no app, e transporta
  somente a origem não sensível da navegação.
- Se o app não estiver instalado ou o navegador bloquear o esquema, a página
  permanece utilizável e oferece o login Web; não há redirecionamento enganoso.
- As novas telas estendem a linguagem visual aprovada. Elementos compartilhados
  devem coincidir com Figma e implementação; conteúdo específico segue o fluxo
  real, pois não há frames explícitos para ele.

## Critérios de aceite

- [x] o link do login abre `/esqueci-senha` e pode voltar ao login;
- [x] a solicitação válida envia apenas o e-mail normalizado e sempre mostra a
      response neutra validada pelo schema;
- [x] erros locais, `429`, indisponibilidade e contrato inválido têm feedback
      acessível sem permitir enumeração;
- [x] o e-mail aponta para `/recuperar-senha#token=...` e não para a rota de
      primeiro acesso;
- [x] token ausente ou malformado não chama a API e exibe estado seguro;
- [x] senha válida envia token, nova senha e confirmação uma única vez;
- [x] token expirado, inválido ou consumido usa a mesma apresentação pública;
- [x] sucesso usa navegação com substituição, não autentica automaticamente e
      não deixa token ou senha reaparecerem pelo botão Voltar;
- [ ] `Voltar ao app` abre `sipat://login?origem=recuperacao-senha` em build
      nativo compatível e `Ir para o login Web` permanece disponível;
- [ ] nenhum segredo aparece em URL enviada ao servidor, cookie, storage,
      console, observabilidade, fixture persistida ou relatório;
- [x] as telas novas foram comparadas diretamente com os frames obrigatórios e
      as diferenças de conteúdo decorrentes do novo fluxo estão documentadas;
- [ ] teclado, foco, zoom, viewport estreita/ampla e axe aplicável passam;
- [x] login e primeiro acesso existentes não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/auth/auth.service.ts` e seus testes de link;
- `apps/api/src/environment.ts`, `.env.development.example` e exemplos de
  implantação que definem `AUTH_PASSWORD_RESET_URL`;
- `apps/web/lib/auth/auth-operations.ts` e testes;
- `apps/web/app/(auth)/login/_components/login-form.tsx`;
- novas rotas sob `apps/web/app/(auth)/esqueci-senha/`,
  `apps/web/app/(auth)/recuperar-senha/` e
  `apps/web/app/(auth)/recuperacao-concluida/`;
- primitives existentes de senha, formulário e layout de autenticação;
- catálogo público, normalização observável de rotas e testes associados;
- `apps/web/e2e/auth.e2e.ts` e suporte de API estrita;
- documentação de Web, integração e segurança afetada.

Os caminhos devem ser confirmados no worktree vivo. Não duplique primitives ou
crie uma segunda instância de cliente HTTP para esta feature.

## Verificações esperadas

- testes unitários da API para composição do link sem token em query;
- lint, typecheck, testes e build de `@repo/api` se a composição mudar;
- lint, typecheck, testes e build de `@repo/web`;
- Playwright do pedido, token ausente/inválido, sucesso, histórico, link do app,
  login Web alternativo, metadata, CSP e acessibilidade automatizável;
- integração real com API/PostgreSQL e SMTP fake, sem enviar e-mail real;
- inspeção manual contra o Figma em viewports estreita, intermediária e ampla;
- `pnpm format:check` e `git diff --check`.

Build e E2E Web não comprovam abertura do esquema em Android/iOS. Essa parte é
validada no objetivo mobile.

## Pendências ou decisões bloqueantes

- Nenhuma para implementação. Ativação por ambiente continua dependente de
  SMTP e URL HTTPS válidos, conforme `AUTH-003`.

## Evidências da entrega

- lint, typecheck, testes unitários e build de API e Web passaram;
- a suíte completa da API executou 375 testes com sucesso; 92 testes de
  integração condicionais permaneceram ignorados sem o banco dedicado;
- o Playwright de autenticação passou 14 cenários no Chromium, incluindo
  Origin, CSRF, fragmento, histórico, estados públicos e axe;
- as três telas foram inspecionadas no navegador contra os frames obrigatórios
  em 1440×900, 900×900 e 390×844;
- `pnpm format:check` equivalente pelo binário local e `git diff --check`
  passaram;
- continuam pendentes a integração dedicada com PostgreSQL e SMTP fake, o
  teste de zoom/leitor de tela e a abertura do esquema em Android/iOS.
