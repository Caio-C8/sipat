# Roadmap inicial do SIPAT

Este roadmap coordena entregas que atravessam contratos, banco, API, Web e
testes. Os roadmaps de cada área detalham seus próprios artefatos; este arquivo
define a ordem, as dependências e os critérios comuns do produto.

## Convenção de status

- **planejado:** escopo documentado, sem implementação concluída;
- **em andamento:** existe implementação parcial ainda não validada;
- **bloqueado:** uma decisão explícita ou dependência impede a continuação;
- **concluído:** implementação, testes, documentação de estado e verificações
  correspondentes foram aprovados.

Documentação de intenção não muda o status de uma capacidade para concluído.

## Estado atual

O `SEC-001` está implementado: a API possui barreira global de autenticação,
autorização por perfil, proteção CSRF e persistência de sessões revogáveis. A
única rota de produção atual continua sendo o health check público. Login,
logout, criação produtiva de sessões, rotas e telas de usuários ainda não
existem e permanecem nos objetivos seguintes.

## Ordem das primeiras entregas

| Ordem | Objetivo                                   | Status    | Requisitos         |
| ----- | ------------------------------------------ | --------- | ------------------ |
| 1     | `SEC-001` — Proteger rotas por perfil      | concluído | RF01, RNF05, RNF06 |
| 2     | `USERS-001` — Gerenciar usuários           | planejado | RF02, UC02, RNF01  |
| 3     | `AUTH-001` — Autenticar e encerrar sessões | planejado | RF01, UC01, RNF05  |

A ordem solicitada é viável desde que a dependência seja explícita: `SEC-001`
cria a barreira e valida uma sessão que já exista; `USERS-001` consome essa
barreira e pode ser validado com sessões controladas nos testes; somente
`AUTH-001` passa a criar sessões por login e a encerrá-las por logout. Antes de
`AUTH-001`, nenhuma pessoa consegue usar o CRUD pela Web em um ambiente real.

Não enfraqueça temporariamente os Guards nem aceite perfil enviado pelo cliente
para contornar essa dependência.

## Regras comuns

- A API é a autoridade de autenticação e autorização. Ocultar páginas, links ou
  botões na Web é somente uma melhoria de experiência.
- Rotas de domínio são privadas por padrão; cada rota pública precisa ser
  declarada e testada.
- O perfil vem do usuário carregado pela sessão no servidor, nunca de body,
  query, header criado pelo cliente ou estado da interface.
- `401 Unauthorized` representa identidade ausente ou sessão inválida;
  `403 Forbidden` representa identidade válida sem o perfil exigido.
- Credenciais do navegador ficam em cookie `HttpOnly` e nunca em Web Storage.
- Senha em texto puro existe apenas no boundary da operação que a recebe. Hash,
  token de sessão e cookie não aparecem em responses, logs ou métricas.
- Operações que alteram estado preservam auditoria e recebem proteção CSRF.
- Cada objetivo começa pelos contratos externos e termina com verificação dos
  consumidores, documentação de estado e atualização do próprio status.

As decisões completas estão em
[Identidade, sessão e controle de acesso](./security-and-access.md).

## SEC-001 — Proteger rotas por perfil

**Status:** concluído

### Resultado esperado

Criar a infraestrutura de sessão e autorização que negue acesso por padrão,
reconheça os perfis `ADMINISTRADOR` e `DIRETOR_PATRIMONIO` e permita declarar
explicitamente as exceções públicas e os perfis aceitos por rota.

### Escopo

- registrar em `@repo/contracts` o enum público de perfil e a representação
  mínima e segura da identidade autenticada;
- adicionar persistência de sessões opacas revogáveis, armazenando somente o
  verificador do segredo da sessão;
- anexar à requisição apenas `id`, `nome`, `email` e `perfil` obtidos no
  servidor;
- registrar autenticação global com exceção pública explícita;
- criar metadados/decorators e Guard de perfil com negação por padrão;
- manter `GET /api/health` público;
- aplicar proteção CSRF às operações autenticadas que alteram estado;
- padronizar os cenários `401` e `403` no contrato de erro existente;
- testar sessão ausente, inválida, expirada, revogada, usuário inativo, perfil
  incorreto, rota pública e rota autorizada;
- documentar a matriz de acesso real antes de adicionar cada rota.

### Fora do escopo

- endpoints e tela de login ou logout;
- CRUD de usuários;
- recuperação ou troca de senha;
- autenticação do aplicativo mobile.

### Critérios de aceite

- [x] rotas sem declaração pública não são acessíveis anonimamente;
- [x] `GET /api/health` continua público e funcional;
- [x] a identidade e o perfil são derivados de sessão válida e usuário ativo;
- [x] o Guard diferencia falta de autenticação (`401`) de perfil insuficiente
      (`403`);
- [x] usuário inativo perde acesso mesmo que sua sessão ainda não tenha
      expirado;
- [x] sessão expirada ou revogada não autentica;
- [x] o teste E2E usa a composição real dos Guards, sem substituí-los por mocks;
- [x] contratos, API e banco passam em lint, typecheck e testes;
- [x] `pnpm format:check` passa;
- [x] documentação de estado é atualizada sem declarar login implementado.

## USERS-001 — Gerenciar usuários

**Status:** planejado

### Resultado esperado

Entregar o CRUD administrativo previsto em RF02, sem exclusão física e
acessível somente ao perfil `ADMINISTRADOR`.

### Rotas planejadas

| Método  | Rota                                | Perfil        | Resultado                     |
| ------- | ----------------------------------- | ------------- | ----------------------------- |
| `GET`   | `/api/usuarios`                     | administrador | lista paginada e filtrada     |
| `GET`   | `/api/usuarios/:usuarioId`          | administrador | detalhe seguro                |
| `POST`  | `/api/usuarios`                     | administrador | cria usuário ativo            |
| `PATCH` | `/api/usuarios/:usuarioId`          | administrador | altera nome, e-mail ou perfil |
| `PATCH` | `/api/usuarios/:usuarioId/situacao` | administrador | ativa ou inativa              |

Não haverá `DELETE`. A senha ou seu hash nunca integram um contrato de
response. A troca ou redefinição de senha não será inferida a partir do verbo
“alterar”; ela exige fluxo e decisão próprios.

### Escopo

- contratos Zod 4 de params, query, criação, atualização, situação e responses;
- paginação pelo contrato comum, com padrão 20 e limite máximo 50;
- busca por nome ou e-mail e filtros por perfil e situação;
- unicidade de e-mail tratada também contra corrida no banco;
- hash de senha adequado antes da persistência;
- mapper com seleção explícita de campos seguros;
- repository, service, controller, módulo e testes;
- página Web `/usuarios` com estados de loading, vazio, erro, sem permissão,
  sucesso e mutação pendente;
- metadata `Usuários | SIPAT`, responsividade, teclado e foco;
- auditoria por `createdById`, `createdAt` e `updatedAt`;
- revogação das sessões do usuário quando ele for inativado.

### Fora do escopo

- exclusão física;
- autoedição de perfil;
- recuperação, redefinição ou troca de senha;
- permissões configuráveis além dos dois perfis dos requisitos.

### Critérios de aceite

- [ ] somente administrador acessa todas as rotas e a página de usuários;
- [ ] diretor autenticado recebe `403` e não obtém dados parciais;
- [ ] requisição anônima recebe `401`;
- [ ] e-mail duplicado produz conflito público e previsível;
- [ ] inativação preserva o usuário e seus vínculos históricos;
- [ ] usuário inativado e suas sessões deixam de autenticar;
- [ ] senha e hash não aparecem em response, log, métrica ou fixture pública;
- [ ] contratos, banco, API e Web possuem testes proporcionais ao risco;
- [ ] verificações dos packages afetados e `pnpm format:check` passam.

## AUTH-001 — Autenticar e encerrar sessões

**Status:** planejado

### Resultado esperado

Permitir login por e-mail e senha, consulta da identidade atual e logout com
revogação no servidor, tornando operacionais as rotas protegidas anteriores.

### Rotas planejadas

| Método | Rota               | Acesso      | Resultado                               |
| ------ | ------------------ | ----------- | --------------------------------------- |
| `POST` | `/api/auth/login`  | pública     | cria sessão e define cookie             |
| `GET`  | `/api/auth/me`     | autenticada | retorna a identidade segura             |
| `POST` | `/api/auth/logout` | autenticada | revoga a sessão atual e expira o cookie |

### Escopo

- contratos de login e identidade atual;
- comparação segura da senha e mensagem uniforme para credencial inválida ou
  usuário inativo;
- token opaco aleatório, armazenado somente como verificador no banco;
- cookie de sessão criado e removido exclusivamente pelo servidor;
- rate limit específico de login e observabilidade sem dados pessoais;
- tela `/login`, redirecionamentos sem loop e ação de logout acessível;
- página protegida consulta a identidade no servidor e a API continua sendo a
  autoridade final;
- testes de cookie, expiração, revogação, CSRF, `401`, `403`, login e logout.

### Fora do escopo

- recuperação de senha;
- “lembrar de mim”;
- MFA, SSO ou provedor externo;
- autenticação mobile;
- refresh token ou renovação silenciosa.

### Critérios de aceite

- [ ] credenciais válidas de usuário ativo criam uma sessão utilizável;
- [ ] credenciais inválidas e usuário inativo não criam sessão nem permitem
      enumeração de contas;
- [ ] logout revoga a sessão no servidor e expira o cookie no navegador;
- [ ] `/api/auth/me` nunca retorna senha, hash ou token;
- [ ] cookie atende à política documentada por ambiente;
- [ ] mutações autenticadas sem a proteção CSRF definida são rejeitadas;
- [ ] páginas não entram em loop entre login e rota protegida;
- [ ] verificações de contratos, banco, API, Web e E2E passam.

## Decisões necessárias antes dos objetivos seguintes

Estas decisões afetam segurança ou comportamento externo e não podem ser
inventadas pelo agente executor:

1. antes de `USERS-001`: impedir ou permitir que um administrador inative a si
   mesmo e impedir ou permitir a inativação do último administrador ativo;
2. antes de `USERS-001`: política da senha inicial e futura redefinição;
3. antes de `AUTH-001`: forma controlada de provisionar o primeiro
   administrador;
4. antes de `AUTH-001`: duração absoluta da sessão, timeout por inatividade e
   quantidade de sessões simultâneas por usuário;
5. antes de `AUTH-001`: valores de rate limit e bloqueio progressivo por
   ambiente.
