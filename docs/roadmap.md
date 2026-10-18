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

O `SEC-001`, o backend do `USERS-001` e o backend do `AUTH-001` estão
implementados. A API possui
barreira global de autenticação, autorização por perfil, proteção CSRF,
persistência de sessões revogáveis, contratos e as cinco operações
administrativas de usuários, além de login, logout, `/auth/me` e
provisionamento inicial controlado. As interfaces Web de usuários e
autenticação não estão implementadas. Alteração autenticada e recuperação de
senha ainda não estão implementadas e foram organizadas nos objetivos
`CONTRACTS-003`, `AUTH-002` e `AUTH-003`.

## Ordem das primeiras entregas

| Ordem | Objetivo                                   | Status    | Requisitos         |
| ----- | ------------------------------------------ | --------- | ------------------ |
| 1     | `SEC-001` — Proteger rotas por perfil      | concluído | RF01, RNF05, RNF06 |
| 2     | `USERS-001` — Backend de usuários          | concluído | RF02, UC02, RNF01  |
| 3     | `AUTH-001` — Autenticar e encerrar sessões | concluído | RF01, UC01, RNF05  |

A ordem solicitada é viável desde que a dependência seja explícita: `SEC-001`
cria a barreira e valida uma sessão que já exista; `USERS-001` consome essa
barreira e pode ser validado com sessões controladas nos testes; somente
`AUTH-001` cria sessões por login e as encerra por logout. As interfaces
administrativas e de autenticação pertencem, respectivamente, aos objetivos
separados `WEB-USERS-001` e `WEB-AUTH-001`, que permanecem planejados no roadmap
da Web.

Não enfraqueça temporariamente os Guards nem aceite perfil enviado pelo cliente
para contornar essa dependência.

## Ordem das entregas de senha

| Ordem | Objetivo                                  | Status    | Dependências                 |
| ----- | ----------------------------------------- | --------- | ---------------------------- |
| 4     | `CONTRACTS-003` — Contratos de senha      | concluído | `CONTRACTS-002`, RF01 e UC01 |
| 5     | `AUTH-002` — Alterar a própria senha      | planejado | `CONTRACTS-003` e `AUTH-001` |
| 6     | `AUTH-003` — Recuperar a senha por e-mail | planejado | `AUTH-002` e SMTP            |

Esta sequência entrega somente contratos, banco e backend. Não inclui página,
formulário, operação ou hook Web, nem qualquer alteração no aplicativo mobile.
Os consumidores deverão ser planejados em objetivos próprios depois que a API
estiver implementada e verificada.

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

## USERS-001 — Backend de gestão de usuários

**Status:** concluído

### Resultado esperado

Entregar na API o CRUD administrativo previsto em RF02, sem exclusão física e
acessível somente ao perfil `ADMINISTRADOR`. A interface pertence ao objetivo
separado `WEB-USERS-001`.

### Rotas implementadas

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
- auditoria por `createdById`, `createdAt` e `updatedAt`;
- revogação das sessões do usuário quando ele for inativado.

### Fora do escopo

- exclusão física;
- autoedição de perfil;
- recuperação, redefinição ou troca de senha;
- página ou feature Web de gestão de usuários;
- permissões configuráveis além dos dois perfis dos requisitos.

### Critérios de aceite

- [x] somente administrador acessa todas as rotas;
- [x] diretor autenticado recebe `403` e não obtém dados parciais;
- [x] requisição anônima recebe `401`;
- [x] e-mail duplicado produz conflito público e previsível;
- [x] inativação preserva o usuário e seus vínculos históricos;
- [x] usuário inativado e suas sessões deixam de autenticar;
- [x] senha e hash não aparecem em response, log, métrica ou fixture pública;
- [x] contratos, banco e API possuem testes proporcionais ao risco;
- [x] verificações dos packages afetados e `pnpm format:check` passam.

## AUTH-001 — Autenticar e encerrar sessões

**Status:** concluído

### Resultado esperado

Permitir login por e-mail e senha, consulta da identidade atual e logout com
revogação no servidor, tornando operacionais as rotas protegidas anteriores.

### Rotas implementadas

| Método | Rota               | Acesso      | Resultado                               |
| ------ | ------------------ | ----------- | --------------------------------------- |
| `POST` | `/api/auth/login`  | pública     | cria sessão e define cookie             |
| `GET`  | `/api/auth/me`     | autenticada | retorna a identidade segura             |
| `POST` | `/api/auth/logout` | pública     | revoga a sessão atual e expira o cookie |

### Escopo

- contratos de login e identidade atual;
- comparação segura da senha e mensagem uniforme para credencial inválida ou
  usuário inativo;
- token opaco aleatório, armazenado somente como verificador no banco;
- cookie de sessão criado e removido exclusivamente pelo servidor;
- rate limit persistente específico de login e proteção finita da capacidade
  Argon2 por instância;
- provisionamento interativo e exclusivo do primeiro administrador;
- testes de cookie, expiração, revogação, CSRF, `401`, `403`, login, logout e
  concorrência real no PostgreSQL.

### Fora do escopo

- recuperação de senha;
- “lembrar de mim”;
- MFA, SSO ou provedor externo;
- autenticação mobile;
- refresh token ou renovação silenciosa.
- página `/login`, integração Web, redirects, hooks, formulários ou botões de
  logout, que permanecem em `WEB-AUTH-001`.

### Critérios de aceite

- [x] credenciais válidas de usuário ativo criam uma sessão utilizável;
- [x] credenciais inválidas e usuário inativo não criam sessão nem permitem
      enumeração de contas;
- [x] logout público e idempotente revoga somente a sessão atual quando ela
      existe e sempre expira o cookie;
- [x] `/api/auth/me` nunca retorna senha, hash ou token;
- [x] cookie atende à política documentada por ambiente;
- [x] login e logout sem Origin permitido ou proteção CSRF são rejeitados;
- [x] contratos, banco, API e E2E backend passam nas verificações aplicáveis;
- [x] nenhuma implementação ou alteração de Web integra este objetivo.

## CONTRACTS-003 — Contratos de alteração e recuperação de senha

**Status:** concluído

### Resultado esperado

Definir em `@repo/contracts` os inputs e a resposta pública necessários para os
dois fluxos de senha, sem expor hash, token, existência da conta ou campos de
persistência.

### Escopo

- promover a regra de senha de 15 a 128 pontos de código Unicode para uma
  primitive reutilizável, preservando compatibilidade com a criação de usuário;
- contrato estrito de alteração com senha atual, nova senha e confirmação;
- contrato estrito de solicitação de redefinição com e-mail;
- contrato estrito de redefinição com token, nova senha e confirmação;
- response genérica da solicitação, igual para conta elegível, inexistente ou
  inativa;
- testes dos limites, confirmação, propriedades extras e ausência de segredos
  nas responses e exports públicos.

### Fora do escopo

- persistência, envio de e-mail ou regras transacionais;
- formulários e qualquer consumidor Web ou mobile;
- MFA, confirmação de e-mail ou alteração administrativa de senha.

### Critérios de aceite

- [x] schemas são estritos e seus tipos são derivados;
- [x] confirmação divergente é rejeitada nos dois fluxos que definem senha;
- [x] token é aceito somente no input de redefinição e nunca em response;
- [x] mensagem da solicitação não revela a existência ou situação da conta;
- [x] contratos, exports e consumidores existentes passam nas verificações.

Especificação de execução:
[CONTRACTS-003](./tasks/CONTRACTS-003-contratos-senha.md).

## AUTH-002 — Alterar a própria senha

**Status:** planejado

### Resultado esperado

Permitir que qualquer usuário ativo e autenticado altere somente a própria
senha após comprovar a senha atual.

### Escopo

- `POST /api/auth/change-password`, protegido para os dois perfis;
- verificação da sessão, da senha atual e da política da nova senha;
- uso da capacidade Argon2 já limitada por instância;
- atualização do hash e revogação de todas as sessões do usuário em operação
  atômica;
- expiração do cookie atual e exigência de novo login;
- testes unitários, de integração e E2E da API.

### Fora do escopo

- alterar senha de outro usuário, inclusive por administrador;
- recuperação sem a senha atual;
- páginas, formulários, hooks ou mudanças Web/mobile;
- MFA, histórico de senhas ou login automático após a alteração.

### Critérios de aceite

- [ ] somente a identidade da sessão pode ter a senha alterada;
- [ ] senha atual inválida não modifica senha, sessão ou token de recuperação;
- [ ] sucesso altera o hash, revoga todas as sessões e expira o cookie;
- [ ] nenhuma rota administrativa aceita senha de outro usuário;
- [ ] contratos, banco e API passam nas verificações proporcionais.

Especificação de execução:
[AUTH-002](./tasks/AUTH-002-alterar-propria-senha.md).

## AUTH-003 — Recuperar a senha por e-mail institucional

**Status:** planejado

### Resultado esperado

Permitir que um usuário ativo redefina a própria senha por um link enviado ao
e-mail institucional cadastrado, sem permitir enumeração de contas nem escolha
da conta por identificador fornecido na confirmação.

### Escopo

- `POST /api/auth/forgot-password`, público e com response neutra;
- `POST /api/auth/reset-password`, público e autorizado exclusivamente por
  token de alta entropia, temporário e de uso único;
- persistência somente do SHA-256 do token, associado ao usuário;
- validade de 15 minutos e invalidação do token anterior ao emitir um novo;
- limite persistente por chave HMAC do e-mail normalizado;
- SMTP configurável e envio desacoplado da response HTTP;
- redefinição, consumo do token e revogação de todas as sessões em operação
  atômica;
- integração com `AUTH-002` para invalidar redefinição pendente quando a senha
  for alterada pelo fluxo autenticado;
- notificação de alteração sem senha, token ou link de recuperação;
- testes de enumeração, concorrência, expiração, uso único, inativação, CSRF,
  rate limit, falha de SMTP e ausência de vazamento.

### Fora do escopo

- verificação adicional de e-mail institucional;
- MFA, perguntas de segurança, SMS ou recuperação assistida;
- alteração de senha por administrador;
- interface Web ou mobile e ativação produtiva antes de existir um consumidor
  HTTPS válido para o link.

### Critérios de aceite

- [ ] solicitar recuperação produz a mesma response para conta elegível,
      inexistente ou inativa;
- [ ] conhecer e-mail, ID ou perfil não permite redefinir a senha;
- [ ] somente o token original válido determina o usuário da redefinição;
- [ ] token expirado, consumido ou concorrente não altera a conta;
- [ ] sucesso altera a senha, consome os tokens e revoga todas as sessões;
- [ ] segredos de SMTP, senha e token não aparecem em response, log ou métrica;
- [ ] contratos, banco e API passam nas verificações proporcionais.

Especificação de execução:
[AUTH-003](./tasks/AUTH-003-recuperar-senha.md).

## Decisões necessárias antes dos objetivos seguintes

Estas decisões afetam segurança ou comportamento externo e não podem ser
inventadas pelo agente executor:

As decisões do `USERS-001` foram confirmadas: o administrador não pode inativar
a própria conta nem o último administrador ativo; a senha inicial aceita de 15
a 128 pontos de código Unicode, inclusive espaços, sem regra de composição, e
é persistida com Argon2id. Troca, recuperação e redefinição de senha continuam
fora desse objetivo.

As decisões de `AUTH-001` foram confirmadas e estão registradas em
[Identidade, sessão e controle de acesso](./security-and-access.md). Não há
bloqueio permanente nem atraso artificial; as interfaces Web continuam nos
objetivos próprios do roadmap da Web.

As decisões de `AUTH-002` e `AUTH-003` estão confirmadas na mesma fonte de
segurança. Todos os e-mails cadastrados são considerados institucionais e
confiáveis nesta etapa; verificação de e-mail e MFA permanecem fora do escopo.
O administrador não recebe permissão para alterar ou redefinir a senha de outra
pessoa.
