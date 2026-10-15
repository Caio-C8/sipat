# Segurança da aplicação web

Segurança deve ser considerada durante a construção da página. Este documento
cobre riscos internos do app web. Transporte de identidade, cookies, tokens,
CSRF e respostas da API pertencem também à
[Integração web–API](../../integrations/web-api/README.md).

## Estado atual

O SIPAT ainda não possui rotas de domínio. Não há autenticação, autorização,
cookie de sessão ou proteção CSRF implementados. Isso é uma limitação atual e
não representa o atendimento do RF01 ou do RNF05.

`browserApiClient` usa apenas a origem relativa `/api/backend` e não acessa
`API_INTERNAL_URL`. `serverApiClient` importa `server-only`. A interface valida
responses e apresenta mensagens públicas, sem expor o corpo bruto ou o `cause`
interno dos erros.

Antes de introduzir identidade ou dados protegidos no SIPAT, defina e teste
esses controles. CORS, CSP e a ocultação de controles na interface não
transformam uma mutação pública em uma operação autorizada.

## Fronteira server e client

- Segredos nunca entram em Client Components.
- Somente valores intencionalmente públicos usam prefixo `NEXT_PUBLIC_`.
- Módulos com credenciais ou URL interna devem importar `server-only`.
- Não faça detecção de `window` para misturar código sensível de servidor e
  navegador no mesmo módulo.
- Props enviadas a Client Components devem conter somente o necessário.
- Não serialize models, sessão inteira ou dados internos por conveniência.

Esconder um segredo em variável sem `NEXT_PUBLIC_` não corrige uma arquitetura
que importa o módulo server-only no cliente. Use fronteiras explícitas.

## Conteúdo não confiável

- React escapa strings por padrão; preserve esse comportamento.
- Não use `dangerouslySetInnerHTML` sem necessidade, sanitização adequada,
  testes e justificativa.
- Valide URLs externas, esquemas e destinos antes de renderizar links, imagens
  ou embeds.
- Não transforme texto de usuário em código, seletor, HTML ou script.
- Arquivos, Markdown e conteúdo rico exigem política específica.
- Mensagens de erro não devem reproduzir conteúdo sensível da API.

## Autorização

Ocultar botão, menu ou rota melhora UX, mas não autoriza uma operação. A API
continua responsável por autenticação e autorização.

Evite revelar por diferenças de tela:

- existência de recurso protegido;
- identificadores internos;
- campos não permitidos;
- distinção desnecessária entre usuário inexistente e credencial incorreta.

## Credenciais e armazenamento

Credenciais de autenticação usadas no navegador devem permanecer exclusivamente
em cookies `HttpOnly`. Não armazene identificador de sessão, access token ou
refresh token em `localStorage`, `sessionStorage`, estado React persistido ou
outro armazenamento legível por JavaScript.

O cliente não lê nem remove a credencial diretamente. Login, renovação e logout
devem passar pelo servidor responsável, e a identidade atual deve ser obtida
por uma operação autenticada, como `GET /auth/me`, quando esse endpoint fizer
parte do contrato do projeto.

Um cookie que não autentica, como preferência visual, não recebe `HttpOnly`
automaticamente se precisar ser lido no navegador. Um token CSRF pode exigir o
mesmo tratamento dependendo do padrão escolhido, mas jamais pode substituir a
credencial `HttpOnly`.

`HttpOnly` não substitui proteção CSRF, `Secure`, `SameSite`, expiração,
revogação ou defesa contra XSS. O fluxo completo pertence à
[Integração web–API](../../integrations/web-api/README.md).

Não registre tokens, cookies, payloads, arquivos pessoais ou headers de
autorização em console, analytics ou relatório de erro.

## Navegação e conteúdo externo

- Links externos devem deixar o destino claro.
- Ao abrir nova aba, preserve proteção contra controle da página de origem.
- Iframes exigem origem permitida, sandbox e política de recursos.
- Scripts de terceiros devem ser mínimos, revisados e carregados com
  `next/script` quando aplicável.
- Analytics e trackers exigem política de consentimento do projeto.

## Headers e CSP

O estado atual aplica a todas as rotas:

- `Content-Security-Policy` com origem própria por padrão, bloqueio de objetos,
  restrição de `base-uri`, `form-action` e `frame-ancestors` e allowlists
  explícitas para imagens e fontes;
- `Permissions-Policy` para desabilitar recursos não utilizados;
- `Referrer-Policy` e `X-Content-Type-Options: nosniff`;
- proteção contra framing por CSP e `X-Frame-Options`;
- `poweredByHeader: false`, removendo a divulgação automática do Next.js.

A política de produção não inclui `'unsafe-eval'`. Em desenvolvimento, o
Webpack exige essa permissão para a experiência de desenvolvimento. No cliente,
o Zod usa `z.config({ jitless: true })`, opção documentada para evitar geração
dinâmica de função em ambientes CSP/no-eval. A suíte E2E confirma a política no
build de produção e falha se `/` emitir uma violação CSP.

A verificação integrada de 13 de outubro de 2026 observou a seguinte política
no build de produção:

```text
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

`'unsafe-inline'` ainda é permitido para scripts e estilos no estado atual.
Uma aplicação que precise de uma política mais estrita deve avaliar nonces ou
hashes junto da estratégia de renderização e cache, e não apenas remover a
diretiva sem testar o build real.

Além desses controles, defina no ambiente de implantação:

- HSTS no ponto que termina TLS.

CSP reduz impacto de XSS e injeção, mas sua estratégia afeta renderização,
nonces, cache e scripts de terceiros. Não copie uma política sem testar em
desenvolvimento e produção.

## Dependências

- Adicione somente dependências necessárias.
- Confira fonte, manutenção, licença e vulnerabilidades conhecidas.
- Revise código gerado por CLIs, inclusive shadcn/ui.
- Não use versão flutuante no código instalado.
- Não atualize major automaticamente sem avaliar migração.

## Formulários e upload

Validação cliente é feedback, não controle de segurança. A API deve validar
novamente tamanho, tipo, formato, permissão e regra de negócio.

Evite preencher campos sensíveis indevidamente, preserve autocomplete quando
ele aumenta segurança e não exponha senha em logs ou estado persistente.

## Checklist

No estado atual, os itens de autenticação, autorização e CSRF abaixo ainda não
estão implementados. O conjunto completo é obrigatório à medida que o SIPAT
introduzir identidade, operações protegidas e dados patrimoniais.

- nenhum segredo no bundle;
- dados passados ao cliente minimizados;
- HTML não confiável não renderizado;
- URLs externas validadas;
- autorização não depende da interface;
- mecanismo de autenticação e fluxo CSRF seguem decisão de integração;
- credenciais de autenticação do navegador não são legíveis por JavaScript;
- scripts e embeds revisados;
- headers e CSP avaliados;
- erros sem detalhes internos;
- dependências justificadas.
