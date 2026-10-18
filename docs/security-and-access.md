# Identidade, sessão e controle de acesso

Este documento registra a arquitetura das primeiras entregas de segurança do
SIPAT. A barreira de sessão, perfil e CSRF do `SEC-001`, a gestão de usuários
do `USERS-001` e o backend de autenticação do `AUTH-001` estão implementados.
O backend de alteração autenticada da própria senha do `AUTH-002` também está
implementado; a recuperação de senha permanece planejada em `AUTH-003`. As
interfaces Web e mobile continuam fora dessas entregas. O
estado e a ordem de execução ficam no
[roadmap inicial](./roadmap.md).

## Estado implementado

- `GET /api/health`, `POST /api/auth/login` e `POST /api/auth/logout` são as
  rotas públicas; os dois `POST` continuam submetidos a Origin e CSRF;
- autenticação, autorização e CSRF são Guards globais registrados nessa ordem;
- rotas protegidas sem perfis declarados negam acesso por padrão;
- o cookie é escolhido por ambiente e contém um token opaco de 32 bytes em
  Base64url sem padding; o banco armazena somente seu SHA-256 hexadecimal;
- sessão inexistente, expirada, revogada ou de usuário inativo produz `401`;
- identidade válida sem um perfil permitido produz `403`;
- `POST`, `PUT`, `PATCH` e `DELETE` exigem Origin exato permitido e
  `X-SIPAT-CSRF: 1`, inclusive quando uma rota for pública;
- `POST /api/auth/login` cria a sessão, `GET /api/auth/me` consulta a identidade
  atual e `POST /api/auth/logout` encerra a sessão de forma idempotente;
- `POST /api/auth/alterar-senha` exige a senha atual, altera somente a
  identidade da sessão, revoga todas as sessões e expira o cookie.

## Requisitos atendidos

- RF01 e UC01: autenticação e controle de acesso;
- RF02 e UC02: gestão de usuários restrita ao administrador;
- RNF05: autorização por perfil;
- RNF06: identidade do usuário responsável e rastreabilidade.

Os dois perfis públicos são exatamente `ADMINISTRADOR` e
`DIRETOR_PATRIMONIO`. Não será criada uma terceira role genérica para
representar “usuário do sistema”; essa expressão dos requisitos descreve a
identidade autenticada, não um perfil adicional.

## Fronteira de confiança

```text
navegador
   │ cookie HttpOnly + proteção CSRF
   ▼
API
   │ valida sessão, expiração, revogação e usuário ativo
   ▼
identidade { id, nome, email, perfil }
   │
   ├── Guard de perfil para autorização por função
   └── service/policy para regras que dependam do recurso
```

A API é a autoridade. A Web pode redirecionar ou esconder controles depois de
consultar a identidade, mas isso não concede nem revoga permissão.

## Mecanismo de sessão

O navegador usa sessão opaca revogável, e não JWT persistido no cliente:

- o segredo é gerado por CSPRNG no login;
- o cookie contém somente o segredo opaco;
- o banco armazena somente um verificador unidirecional do segredo, nunca o
  valor reutilizável enviado ao navegador;
- a sessão referencia o usuário e possui criação, expiração e revogação;
- cada requisição protegida valida sessão, expiração, revogação e `ativo` do
  usuário antes de anexar a identidade mínima à request;
- o perfil considerado é sempre o valor atual lido pelo servidor;
- inativar um usuário revoga suas sessões e, mesmo durante concorrência, o
  Guard recusa um usuário já inativo;
- a duração absoluta é de 8 horas e não é renovada pela atividade;
- a inatividade nominal é de 30 minutos, calculada pela última atividade
  persistida;
- a atividade é persistida condicionalmente no máximo uma vez a cada 5 minutos;
  por isso, a janela efetiva após a última request fica entre aproximadamente
  25 e 30 minutos, nunca acima de 30 minutos;
- no máximo cinco sessões ativas contam por usuário; ao criar a sexta, a sessão
  ativa mais antiga é revogada;
- somente sessão não revogada, dentro da duração absoluta e do limite de
  inatividade conta como ativa;
- criação, limite e atualização de `ultimoLoginAt` usam transação
  `Serializable` e até três tentativas para `P2034`; contenção remanescente é
  recusada genericamente com `429`;
- não há refresh token nem renovação silenciosa.

Esse desenho foi escolhido porque RF02 exige que a inativação impeça novos
acessos e porque logout precisa revogar a credencial no servidor. Um JWT
autossuficiente exigiria estratégia adicional de revogação ou consultas que
eliminariam sua principal vantagem neste escopo.

## Cookie no navegador

| Atributo   | Desenvolvimento local | Homologação e produção |
| ---------- | --------------------- | ---------------------- |
| nome       | `sipat_session`       | `__Host-sipat_session` |
| `HttpOnly` | obrigatório           | obrigatório            |
| `Secure`   | conforme HTTPS local  | obrigatório            |
| `SameSite` | `Strict`              | `Strict`               |
| `Path`     | `/`                   | `/`                    |
| `Domain`   | ausente               | ausente                |

O servidor define e expira o cookie. O JavaScript do navegador nunca lê o
segredo para montar `Authorization`. `localStorage`, `sessionStorage` e estado
persistido do React não armazenam credenciais.

O navegador chama `/api/backend` na mesma origem da Web. O rewrite encaminha a
requisição para a API sem expor `API_INTERNAL_URL`. Server Components, Route
Handlers e Server Actions não herdam cookies automaticamente: quando precisarem
agir em nome do usuário, encaminham somente o cookie necessário no escopo da
requisição, nunca em headers globais mutáveis.

## Proteção CSRF

`SameSite=Strict` é defesa em profundidade, não a única barreira. Em métodos que
alteram estado (`POST`, `PUT`, `PATCH` e `DELETE`), a integração Web–API deve:

- aceitar apenas origens exatas configuradas e controladas;
- exigir JSON quando a operação não for upload;
- exigir o header `X-SIPAT-CSRF: 1`, inclusive em login e logout;
- rejeitar origem ausente, `null` ou diferente, salvo fluxo não navegador
  documentado separadamente;
- manter CORS sem curingas e testar preflight e origens rejeitadas;
- nunca usar `GET` para alterar estado.

O nome e o valor do header devem ser constantes compartilhadas pela
infraestrutura Web/API. Ele prova que a chamada passou pelo cliente esperado e
força preflight em contexto cross-origin; não funciona como credencial e não
contém segredo.

Uploads futuros exigem revisão própria porque `multipart/form-data` pode ser
uma requisição simples. O mobile nativo também terá política de autenticação e
proteção própria; não deve copiar cookies do navegador automaticamente.

## Autenticação e autorização na API

- autenticação global, com exceções explícitas lidas por um decorator público;
- autorização por perfil em Guard que lê metadata e a identidade já validada;
- ausência de declaração em rota de domínio resulta em negação, não liberação;
- rota ou controller podem declarar um ou ambos os perfis quando o requisito
  permitir;
- regra dependente do recurso permanece no service ou em policy service;
- decorators apenas registram metadata; os testes precisam provar qual Guard a
  consome e em que ordem;
- `401` para sessão ausente, inválida, expirada, revogada ou usuário inativo;
- `403` para sessão válida cujo perfil não autoriza a operação.

## Matriz inicial de acesso

| Rota                                      | Pública | Administrador | Diretor de Patrimônio | Objetivo  |
| ----------------------------------------- | ------- | ------------- | --------------------- | --------- |
| `GET /api/health`                         | sim     | sim           | sim                   | baseline  |
| `GET /api/usuarios`                       | não     | sim           | não                   | USERS-001 |
| `GET /api/usuarios/:usuarioId`            | não     | sim           | não                   | USERS-001 |
| `POST /api/usuarios`                      | não     | sim           | não                   | USERS-001 |
| `PATCH /api/usuarios/:usuarioId`          | não     | sim           | não                   | USERS-001 |
| `PATCH /api/usuarios/:usuarioId/situacao` | não     | sim           | não                   | USERS-001 |
| `POST /api/auth/login`                    | sim     | sim           | sim                   | AUTH-001  |
| `GET /api/auth/me`                        | não     | sim           | sim                   | AUTH-001  |
| `POST /api/auth/logout`                   | sim     | sim           | sim                   | AUTH-001  |
| `POST /api/auth/alterar-senha`            | não     | sim           | sim                   | AUTH-002  |

Uma rota pública não recebe autorização implícita para mutar estado sem CSRF,
validação, limite e tratamento de abuso.

### Matriz de recuperação de senha planejada

| Rota                             | Pública | Identidade exigida | Objetivo |
| -------------------------------- | ------- | ------------------ | -------- |
| `POST /api/auth/forgot-password` | sim     | não                | AUTH-003 |
| `POST /api/auth/reset-password`  | sim     | token de uso único | AUTH-003 |

As duas rotas públicas continuam submetidas a Origin exato,
`X-SIPAT-CSRF: 1`, validação estrita, limite contra abuso e respostas que não
revelem a existência da conta. O token de redefinição autoriza somente a troca
da senha da conta à qual seu hash está associado; body, query, e-mail ou ID não
podem selecionar outro usuário na confirmação.

## Segurança do CRUD de usuários

- as cinco rotas declaram explicitamente apenas `ADMINISTRADOR` e continuam
  submetidas aos Guards globais;
- criação recebe senha em texto puro somente no body validado e persiste hash
  Argon2id com `memoryCost` 19.456 KiB, `timeCost` 2 e `parallelism` 1;
- a senha inicial possui de 15 a 128 pontos de código Unicode, permite espaços
  e não exige combinação artificial de classes de caracteres;
- e-mail é normalizado de forma determinística antes da comparação e
  persistência, mantendo a unicidade também no banco;
- responses usam `select` e mapper explícitos e nunca incluem senha ou hash;
- atualização não aceita `createdById`, `ativo` ou campos internos no body
  genérico;
- ativação e inativação usam operação própria;
- não existe exclusão física;
- o administrador não pode alterar o próprio perfil nem inativar a própria
  conta;
- o último administrador ativo não pode ser inativado; a contagem, a mudança de
  situação e a revogação usam transação serializável com repetição limitada em
  conflito de escrita;
- inativação e revogação de sessões formam uma única operação atômica;
- erros e logs não permitem enumerar hashes, tokens ou detalhes internos.

## Segurança do login e logout

- a senha é verificada de forma assíncrona com Argon2id; usuário ausente,
  inativo ou com senha incorreta recebe a mesma resposta e passa por uma
  verificação equivalente;
- o login bem-sucedido atualiza `ultimoLoginAt`, cria sessão e define cookie sem
  retornar o token no JSON;
- o limite persistido por chave HMAC do e-mail normalizado é 20 tentativas por
  15 minutos em desenvolvimento, 5 por 15 minutos em staging/produção e 3 por
  1 minuto em testes;
- **5 tentativas por 15 minutos é uma decisão de produto do SIPAT**, não um
  número prescrito pelo NIST;
- incremento e verificação formam um único `UPSERT` atômico no PostgreSQL; o
  sucesso limpa o contador somente depois de a senha ser validada e a sessão
  ser criada;
- registros possuem expiração e são removidos em lotes de até 100; a admissão
  finita por instância impede trabalho e crescimento sem limite por e-mails
  aleatórios;
- `AUTH_ARGON2_MAX_CONCURRENCY` e `AUTH_ARGON2_MAX_QUEUE` limitam, por
  instância, verificações simultâneas e espera; saturação retorna `429` genérico
  com `Retry-After` e não executa contador nem Argon2;
- o segredo HMAC exige 32 bytes em Base64url sem padding, diversidade mínima e
  geração aleatória; ele nunca integra logs ou métricas;
- IP e `X-Forwarded-For` não participam da chave até existir topologia de proxy
  confiável documentada;
- não existe bloqueio permanente nem atraso artificial;
- logout é público e idempotente com `204`, mas Origin permitido e
  `X-SIPAT-CSRF: 1` continuam obrigatórios;
- logout revoga somente a sessão identificada pelo cookie, quando existente, e
  sempre expira o cookie com os atributos do ambiente;
- `GET /auth/me` retorna apenas a identidade segura.

## Alteração autenticada da própria senha

O `AUTH-002` implementa estas decisões:

- qualquer usuário ativo dos dois perfis pode alterar somente a própria senha;
- a sessão válida identifica o usuário, e a senha atual é obrigatória como
  nova comprovação da credencial;
- o administrador não recebe rota, permissão ou campo para definir, alterar ou
  redefinir a senha de outra pessoa;
- o body contém somente `senhaAtual`, `novaSenha` e
  `confirmacaoNovaSenha`;
- a nova senha segue a política existente de 15 a 128 pontos de código
  Unicode, aceita espaços e não impõe composição por classes;
- senha atual inválida produz erro público estável sem modificar senha, sessão
  ou redefinição pendente;
- verificação da senha atual e criação do novo hash passam pela capacidade
  Argon2 finita já configurada;
- tentativas usam contador persistente próprio, com chaves HMAC separadas por
  escopo e as mesmas janelas quantitativas do login;
- em sucesso, alteração do hash, invalidação da redefinição pendente e
  revogação de todas as sessões do usuário são atômicas;
- o cookie atual é expirado e o usuário precisa autenticar novamente; não há
  criação automática de nova sessão;
- a response de sucesso é `204 No Content` e nunca contém hash ou credencial.

O model de redefinição ainda não existe. O `AUTH-003`, responsável por criá-lo,
também integra sua invalidação à transação já implementada pelo `AUTH-002`.

## Recuperação da senha por e-mail institucional

O `AUTH-003` adota um fluxo simples por link. Nesta etapa, todo e-mail
cadastrado é considerado institucional, previamente controlado e confiável;
não será criado `emailVerificadoAt` nem um fluxo de confirmação de endereço.
Essa premissa deverá ser revista se o cadastro passar a aceitar e-mails que não
sejam institucionais.

### Solicitação

- `POST /api/auth/forgot-password` recebe somente o e-mail normalizado;
- conta ativa, inexistente ou inativa recebe `202 Accepted` com exatamente a
  mesma mensagem pública;
- nenhuma conta é bloqueada, inativada ou alterada pela solicitação;
- somente usuário ativo recebe token e mensagem;
- o limite persistente usa HMAC do e-mail normalizado inclusive para endereços
  inexistentes, sem registrar o e-mail em logs ou métricas;
- as janelas quantitativas são as mesmas do login: 20 tentativas por 15 minutos
  em desenvolvimento, 5 por 15 minutos em staging/produção e 3 por 1 minuto em
  testes; os contadores permanecem separados por operação;
- o envio é desacoplado da response por um despachante interno de capacidade
  finita, sem introduzir broker nesta primeira versão;
- falha ou saturação do SMTP não muda a response pública nem revela se a conta
  existe; a falha produz somente observabilidade sem destinatário, token ou
  conteúdo da mensagem, e o usuário pode realizar nova solicitação;
- a implantação produtiva permanece desabilitada até existir uma URL HTTPS de
  consumidor válida para receber o token.

### Token e persistência

- cada token possui 32 bytes gerados por CSPRNG e representação Base64url sem
  padding;
- somente o SHA-256 hexadecimal é persistido; o valor reutilizável existe
  apenas durante a montagem e o despacho da mensagem;
- o registro possui `usuarioId` único, `tokenHash` único, `expiraAt`,
  `consumidoAt`, `createdAt` e `updatedAt`;
- um novo pedido substitui o token anterior do mesmo usuário;
- o token expira após 15 minutos, é de uso único e não aparece em response,
  log, métrica ou correlation context;
- o link usa uma URL-base configurada, nunca o header `Host`, e não contém
  e-mail, ID ou perfil;
- a URL de produção usa HTTPS; o futuro consumidor Web deverá aplicar
  `Referrer-Policy: no-referrer` e retirar o token da barra de endereço assim
  que o capturar.

### Redefinição

- `POST /api/auth/reset-password` recebe somente `token`, `novaSenha` e
  `confirmacaoNovaSenha`;
- a API calcula o hash do token e determina o usuário exclusivamente pela
  associação persistida;
- token ausente, malformado, inexistente, expirado, consumido ou associado a
  usuário inativo produz o mesmo erro público;
- validação e consumo condicionais impedem dois sucessos concorrentes;
- consumo do token, alteração do hash, invalidação da redefinição e revogação
  de todas as sessões são atômicos;
- o sucesso retorna `204 No Content`, não autentica automaticamente e exige
  novo login;
- após a alteração, uma mensagem informa que a senha foi redefinida, sem
  incluir senha, token ou novo link.

### Transporte de e-mail

- a API usa um serviço de domínio sem dependência direta de SMTP e um adapter
  de infraestrutura baseado em Nodemailer;
- host, porta, TLS, usuário, senha, remetente e URL de redefinição vêm de
  variáveis de ambiente validadas;
- staging e produção exigem transporte protegido e validação do certificado;
  não se aceita `rejectUnauthorized: false`;
- logger e debug do transporte permanecem desabilitados para evitar conteúdo e
  credenciais em logs;
- cada mensagem possui um único destinatário e não aceita anexos, caminhos de
  arquivo nem conteúdo carregado de URL;
- testes substituem o adapter por fake determinístico; nenhuma suíte envia
  e-mail real.

MFA, SMS, perguntas de segurança, códigos de recuperação, verificação adicional
do e-mail institucional, alteração administrativa de senha e recuperação
assistida permanecem fora desta etapa.

## Provisionamento inicial

O primeiro administrador é criado exclusivamente pelo comando interativo:

```bash
pnpm --filter @repo/api build
pnpm --filter @repo/api provisionar:admin
```

O comando exige TTY, lê senha e confirmação sem eco, não aceita argumentos e
recusa o provisionamento quando já existe qualquer usuário. A verificação e a
criação usam bloqueio transacional no PostgreSQL, transação `Serializable` e
repetição limitada de `P2034`, garantindo apenas um administrador em execuções
concorrentes. Não existe endpoint HTTP de bootstrap.

## Arquitetura Web futura

- `/login` será a única página de autenticação inicial;
- `/usuarios` deverá existir somente para administrador;
- proteção de layout e redirects deverão evitar telas incompatíveis, mas a API
  repete a autorização em todas as operações;
- Proxy do Next.js pode fazer apenas checagem otimista; não é o local da
  validação completa da sessão nem da autorização;
- redirects deverão diferenciar usuário anônimo de usuário autenticado sem
  perfil e não entrar em loop;
- logout deverá permanecer acessível por teclado e expor estado pendente;
- respostas autenticadas não entram em cache público nem atravessam usuários.

## Testes obrigatórios

- unitários: parsing de cookie, verificação de sessão, metadata, Guards,
  policies, hash de senha, mappers e contratos;
- integração: persistência de sessão, unicidade de e-mail, inativação com
  revogação, provisionamento e corridas de rate limit e limite de sessões;
- E2E da API: rota pública, `401`, `403`, cada perfil permitido, expiração,
  revogação, usuário inativo, CSRF, login e logout;
- senha na API: senha atual incorreta, alteração da própria conta pelos dois
  perfis, impossibilidade de selecionar outro usuário, response neutra da
  solicitação, token inválido/expirado/consumido, corrida de consumo, usuário
  inativo, rate limit, falha de SMTP, revogação de sessões e ausência de
  vazamento;
- Web: estados, metadata, formulário, foco, teclado e erros normalizados;
- E2E Web–API: cookie `HttpOnly`, atributos por ambiente, acesso administrativo,
  negação ao diretor e logout sem exposição do segredo.

Mocks podem isolar unidades. Eles não substituem o E2E que inicializa os Guards
reais e prova a ordem dos controles globais.

## Decisões confirmadas no USERS-001

- autoinativação é proibida;
- inativação do último administrador ativo é proibida;
- senha inicial: 15 a 128 pontos de código Unicode, espaços permitidos, sem
  regra de composição e hash Argon2id;
- troca, recuperação e redefinição de senha não pertencem ao `USERS-001`;
- a interface Web de usuários permanece no objetivo separado
  `WEB-USERS-001`; biblioteca de formulário e estado remoto ainda serão
  decididas quando existir um consumidor concreto.

## Decisões confirmadas no AUTH-001

As políticas implementadas são as descritas nas seções de mecanismo de sessão,
login/logout e provisionamento deste documento. `AUTH-001` cobre somente o
backend. Não existe página de login, formulário, hook, redirect ou integração
Web; `WEB-AUTH-001` continua planejado no roadmap próprio da Web.

## Decisões confirmadas para AUTH-002 e AUTH-003

- as entregas se restringem a contratos, banco e backend;
- os e-mails cadastrados são tratados como institucionais e confiáveis, sem
  verificação adicional nesta etapa;
- a troca autenticada exige senha atual e afeta somente a identidade da sessão;
- a recuperação usa link com token aleatório de 32 bytes, validade de 15
  minutos, armazenamento somente do hash e uso único;
- alteração e redefinição revogam todas as sessões e exigem novo login;
- o administrador não pode alterar nem redefinir a senha de outro usuário;
- SMTP configurável é o transporte inicial, isolado por adapter;
- MFA e consumidores Web/mobile serão planejados separadamente.

## Fontes oficiais e de segurança

- [NestJS: autenticação](https://docs.nestjs.com/v11/techniques/authentication)
- [NestJS: autorização](https://docs.nestjs.com/security/authorization)
- [NestJS: Guards](https://docs.nestjs.com/guards)
- [Next.js: Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Next.js: rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- [Next.js: cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP: Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [NIST SP 800-63B: passwords e autenticação](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [Nodemailer: transporte SMTP](https://nodemailer.com/smtp)
