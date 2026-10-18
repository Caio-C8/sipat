# Identidade, sessão e controle de acesso

Este documento registra a arquitetura das primeiras entregas de segurança do
SIPAT. A barreira de sessão, perfil e CSRF do `SEC-001` e a gestão de usuários
do `USERS-001` estão implementadas. Login, logout, `/auth/me`, emissão de cookie
e criação produtiva de sessões continuam planejados para o `AUTH-001`. O estado
e a ordem de execução ficam no [roadmap inicial](./roadmap.md).

## Estado implementado no SEC-001

- somente `GET /api/health` é uma rota pública de produção;
- autenticação, autorização e CSRF são Guards globais registrados nessa ordem;
- rotas protegidas sem perfis declarados negam acesso por padrão;
- o cookie é escolhido por ambiente e contém um token opaco de 32 bytes em
  Base64url sem padding; o banco armazena somente seu SHA-256 hexadecimal;
- sessão inexistente, expirada, revogada ou de usuário inativo produz `401`;
- identidade válida sem um perfil permitido produz `403`;
- `POST`, `PUT`, `PATCH` e `DELETE` exigem Origin exato permitido e
  `X-SIPAT-CSRF: 1`, inclusive quando uma rota for pública;
- não existe endpoint que crie, renove ou encerre sessão.

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

O navegador usará sessão opaca revogável, e não JWT persistido no cliente:

- o segredo é gerado por CSPRNG quando o login for implementado;
- o cookie contém somente o segredo opaco;
- o banco armazena somente um verificador unidirecional do segredo, nunca o
  valor reutilizável enviado ao navegador;
- a sessão referencia o usuário e possui criação, expiração e revogação;
- cada requisição protegida valida sessão, expiração, revogação e `ativo` do
  usuário antes de anexar a identidade mínima à request;
- o perfil considerado é sempre o valor atual lido pelo servidor;
- inativar um usuário revoga suas sessões e, mesmo durante concorrência, o
  Guard recusa um usuário já inativo;
- `AUTH-001` começa sem refresh token nem renovação silenciosa.

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
| `POST /api/auth/logout`                   | não     | sim           | sim                   | AUTH-001  |

Uma rota pública não recebe autorização implícita para mutar estado sem CSRF,
validação, limite e tratamento de abuso.

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

- compare senha com função de derivação resistente a força bruta; a escolha
  inicial recomendada é Argon2id, com parâmetros medidos no ambiente alvo;
- credencial inválida e usuário inativo retornam a mesma resposta pública;
- aplique rate limit específico sem usar e-mail, IP bruto ou outro dado pessoal
  como label de métrica;
- login bem-sucedido atualiza `ultimoLoginAt`, cria sessão e define cookie;
- logout revoga a sessão atual e expira o cookie mesmo se a sessão já estiver
  inválida;
- `GET /auth/me` retorna apenas a identidade segura;
- nenhuma resposta retorna token de sessão no JSON.

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
  revogação e consultas paginadas;
- E2E da API: rota pública, `401`, `403`, cada perfil permitido, expiração,
  revogação, usuário inativo, CSRF, login e logout;
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

## Decisões ainda abertas para AUTH-001

Os requisitos não definem e os agentes não devem inferir:

- provisionamento controlado do primeiro administrador;
- duração absoluta, inatividade e simultaneidade de sessões;
- limites de tentativas e bloqueio progressivo do login.

Essas decisões são pré-condições dos objetivos indicados no roadmap.

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
- [NIST SP 800-63B: passwords e autenticação](https://pages.nist.gov/800-63-4/sp800-63b.html)
