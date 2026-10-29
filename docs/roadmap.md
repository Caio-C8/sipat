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

O `SEC-001`, o backend do `USERS-001`, o backend do `AUTH-001` e as entregas
`PATRIMONIOS-001` e `PATRIMONIOS-002` estão implementados. A API possui
barreira global de autenticação, autorização por perfil, proteção CSRF,
persistência de sessões revogáveis, contratos e as cinco operações
administrativas de usuários, além de login, logout, `/auth/me`, provisionamento
inicial controlado, alteração autenticada e recuperação de senha por e-mail.
O Diretor de Patrimônio também pode cadastrar bens com identificador oficial ou
`SP-` gerado por sequences independentes, registros iniciais atômicos e
auditoria da sessão. Administrador e Diretor de Patrimônio podem consultar a
lista paginada e os detalhes dos bens com busca, filtros e relações atuais.
Fora do ambiente de desenvolvimento, a recuperação permanece desabilitada até
a configuração do consumidor HTTPS e SMTP institucional. A autenticação Web e
o shell autenticado estão implementados; a gestão Web de usuários e a primeira
entrega autenticada do mobile permanecem pendentes.

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
separados `WEB-USERS-001` e `WEB-AUTH-001`; o segundo já foi concluído e o
primeiro permanece planejado no roadmap da Web.

Não enfraqueça temporariamente os Guards nem aceite perfil enviado pelo cliente
para contornar essa dependência.

## Ordem das entregas de senha

| Ordem | Objetivo                                  | Status    | Dependências                 |
| ----- | ----------------------------------------- | --------- | ---------------------------- |
| 4     | `CONTRACTS-003` — Contratos de senha      | concluído | `CONTRACTS-002`, RF01 e UC01 |
| 5     | `AUTH-002` — Alterar a própria senha      | concluído | `CONTRACTS-003` e `AUTH-001` |
| 6     | `AUTH-003` — Recuperar a senha por e-mail | concluído | `AUTH-002` e SMTP            |

Esta sequência entrega somente contratos, banco e backend. Não inclui página,
formulário, operação ou hook Web, nem qualquer alteração no aplicativo mobile.
Os consumidores deverão ser planejados em objetivos próprios depois que a API
estiver implementada e verificada.

## Ordem da integração de primeiro acesso na Web

| Ordem | Objetivo                                        | Status    | Dependências                     |
| ----- | ----------------------------------------------- | --------- | -------------------------------- |
| 1     | `CONTRACTS-009` — Contratos do primeiro acesso  | concluído | `CONTRACTS-001`, `CONTRACTS-003` |
| 2     | `AUTH-004` — Troca obrigatória da senha inicial | concluído | `CONTRACTS-009`, `AUTH-001`      |
| 3     | `WEB-AUTH-001` — Integrar autenticação Web      | concluído | `AUTH-004`, infraestrutura Web   |

A ordem impede que a Web invente o estado de primeiro acesso ou use sessão e
`ultimoLoginAt` como aproximação. `AUTH-004` entrega primeiro a fonte de verdade
persistente, a restrição da API e a rotação da sessão; somente então a Web liga
os formulários e redirects.

## Ordem da primeira entrega autenticada no mobile

| Ordem | Objetivo                                               | Status       | Dependências                            |
| ----- | ------------------------------------------------------ | ------------ | --------------------------------------- |
| 1     | `MOBILE-AUTH-001` — Sessão nativa revogável            | em validação | `AUTH-001`, `AUTH-004`, `CONTRACTS-009` |
| 2     | `MOBILE-FOUNDATION-001` — Estrutura visual e navegação | aprovado     | baseline mobile e Figma                 |
| 3     | `MOBILE-AUTH-002` — Telas e integração de autenticação | aprovado     | dois objetivos anteriores               |
| 4     | `MOBILE-HOME-001` — Home protegida e `/check`          | implementado | `MOBILE-AUTH-002`                       |

Sessão nativa usa access opaco de dez minutos em memória e refresh opaco
rotativo no Keychain/Keystore, preservando oito horas absolutas, trinta minutos
de inatividade, revogação e limite de cinco sessões. Cookie e Bearer continuam
transportes distintos; o fluxo Web não é alterado para acomodar o mobile.

As especificações são
[MOBILE-AUTH-001](./tasks/MOBILE-AUTH-001-sessao-nativa.md),
[MOBILE-FOUNDATION-001](./tasks/MOBILE-FOUNDATION-001-estrutura-visual-navegacao.md),
[MOBILE-AUTH-002](./tasks/MOBILE-AUTH-002-telas-autenticacao.md) e
[MOBILE-HOME-001](./tasks/MOBILE-HOME-001-home-check.md).

### Correção visual e primeira integração de domínio mobile

As telas atuais funcionam, mas não reproduzem o protótipo aprovado. A execução
seguinte usa obrigatoriamente a página `Telas Mobile` do Figma em modo de
consulta e não altera o arquivo de design:

| Ordem | Objetivo                                                       | Status       | Dependências                          |
| ----- | -------------------------------------------------------------- | ------------ | ------------------------------------- |
| 1     | `MOBILE-UI-001` — shell conforme o Figma                       | concluído    | fundação mobile                       |
| 2     | `MOBILE-AUTH-003` — paridade visual da autenticação            | concluído    | `MOBILE-UI-001`                       |
| 3     | `INVENTARIOS-003` — consulta de inventários pelo Administrador | concluído    | `INVENTARIOS-001` e `INVENTARIOS-002` |
| 4     | `MOBILE-HOME-002` — Home real por perfil                       | implementado | `MOBILE-UI-001` e `INVENTARIOS-003`   |

Especificações:
[MOBILE-UI-001](./tasks/MOBILE-UI-001-paridade-figma-shell.md),
[MOBILE-AUTH-003](./tasks/MOBILE-AUTH-003-paridade-visual-figma.md),
[INVENTARIOS-003](./tasks/INVENTARIOS-003-consulta-administrador.md) e
[MOBILE-HOME-002](./tasks/MOBILE-HOME-002-home-integrada-por-perfil.md).

### Consulta e cadastro de patrimônios no mobile

A próxima sequência transforma os itens `Bens` e `Cadastro` do shell em rotas
reais. O implementador deve abrir obrigatoriamente no navegador a página
[`Telas Mobile` do Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f)
e comparar os frames indicados nas tarefas; descrição textual ou imagem
copiada para o repositório não substitui essa inspeção.

| Ordem | Objetivo                                                                                  | Status       | Dependências                                      |
| ----- | ----------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| 1     | `PATRIMONIOS-004` — leitura dos catálogos de cadastro pelo Diretor                        | concluído    | `ESPECIES-001`, `SETORES-001` e `SEC-001`         |
| 2     | `MOBILE-PATRIMONIOS-001` — listar e consultar patrimônios                                 | implementado | `PATRIMONIOS-002`, `MOBILE-UI-001` e autenticação |
| 3     | `MOBILE-PATRIMONIOS-002` — cadastrar um patrimônio e comunicar restrição ao Administrador | implementado | dois objetivos anteriores e `PATRIMONIOS-001`     |

Especificações:
[PATRIMONIOS-004](./tasks/PATRIMONIOS-004-leitura-catalogos-diretor.md),
[MOBILE-PATRIMONIOS-001](./tasks/MOBILE-PATRIMONIOS-001-consultar-patrimonios.md)
e
[MOBILE-PATRIMONIOS-002](./tasks/MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md).

As telas reutilizam `GET /api/patrimonios`,
`GET /api/patrimonios/:patrimonioId`, os catálogos existentes e
`POST /api/patrimonios`; não será criada rota com semântica exclusiva de
mobile. `PATRIMONIOS-004` amplia somente a leitura de setores e espécies para o
Diretor, mantendo todas as mutações desses cadastros exclusivas do
Administrador. A API já restringe o cadastro patrimonial ao Diretor e continua
sendo a barreira de autorização, independentemente da interface.

Por decisão de produto, esta sequência cadastra exatamente um bem por operação
e não renderiza o controle `Mais de um bem igual?` do protótipo. A aba
`Histórico` e a ação `Gerar ficha do bem` também não pertencem a estes
objetivos; serão tratadas com relatórios e não terão handler, simulação ou rota
placeholder. Para o Administrador, `Cadastro` permanece visível na navegação e
abre um estado de acesso restrito coerente com o protótipo, sem carregar o
formulário nem disparar operações de criação.

## Ordem das entregas básicas de patrimônios

| Ordem | Objetivo                                      | Status    | Dependências                         |
| ----- | --------------------------------------------- | --------- | ------------------------------------ |
| 7     | `CONTRACTS-004` — Contratos de patrimônios    | concluído | RF10, RF11, RF12, UC10, UC11 e UC12  |
| 8     | `PATRIMONIOS-001` — Cadastrar patrimônios     | concluído | `CONTRACTS-004`, `SEC-001`           |
| 9     | `PATRIMONIOS-002` — Consultar patrimônios     | concluído | `PATRIMONIOS-001`                    |
| 10    | `PATRIMONIOS-003` — Substituir número oficial | concluído | `PATRIMONIOS-001`, `PATRIMONIOS-002` |

Esta sequência entrega contratos, persistência e backend. Interfaces, hooks e
formatação visual da Web, operações mobile, impressão ou reimpressão de
etiquetas permanecem fora do escopo.

## Ordem dos cadastros relacionados ao patrimônio

| Ordem | Objetivo                                               | Status      | Dependências principais                            |
| ----- | ------------------------------------------------------ | ----------- | -------------------------------------------------- |
| 11    | `STORAGE-001` — Armazenamento local de documentos      | concluído   | RNF09                                              |
| 12    | `CONTRACTS-005` — Contratos dos cadastros relacionados | concluído   | RF03, RF04, RF06, RF07 e RF08                      |
| 13    | `RESPONSAVEIS-001` — Gerenciar responsáveis            | concluído   | `CONTRACTS-005`, `SEC-001`                         |
| 14    | `NATUREZAS-001` — Gerenciar naturezas                  | concluído   | `CONTRACTS-005`, `SEC-001`                         |
| 15    | `ESPECIES-001` — Gerenciar espécies                    | concluído   | `NATUREZAS-001`                                    |
| 16    | `SETORES-001` — Gerenciar setores                      | concluído   | `RESPONSAVEIS-001`                                 |
| 17    | `FORNECEDORES-001` — Gerenciar fornecedores            | concluído   | `CONTRACTS-005`, `SEC-001`                         |
| 18    | `CONTRACTS-006` — Contratos de compras e notas         | concluído   | RF09, UC09, RNF09                                  |
| 19    | `COMPRAS-001` — Gerenciar processos de compra          | em execução | `CONTRACTS-006`, `STORAGE-001`, `FORNECEDORES-001` |
| 20    | `NOTAS-FISCAIS-001` — Gerenciar notas e anexos         | concluído   | `COMPRAS-001`, `STORAGE-001`                       |

A ordem respeita os vínculos obrigatórios existentes: responsáveis precedem
setores, naturezas precedem espécies e fornecedores precedem notas fiscais.
`STORAGE-001` estabelece o boundary seguro do filesystem antes de qualquer
operação multipart. Interfaces Web e mobile permanecem fora de todas essas
entregas.

Processos e notas são separados em módulos, mas a criação inicial de um
processo aceita de zero a 20 notas em uma única operação multipart. Cada nota
aceita no máximo um PDF opcional de 10 MiB. Os fornecedores do processo são
derivados das notas vinculadas, conforme o schema atual.

A fonte de verdade da persistência, entrega autenticada, nomenclatura,
compensação e reconciliação de anexos é
[Armazenamento local de documentos](./file-storage.md).

## Ordem das entregas de comissões

| Ordem | Objetivo                                 | Status    | Dependências principais                        |
| ----- | ---------------------------------------- | --------- | ---------------------------------------------- |
| 21    | `CONTRACTS-007` — Contratos de comissões | concluído | RF03, RF05, UC05, RN11, RNF05 e RNF06          |
| 22    | `COMISSOES-001` — Gerenciar comissões    | concluído | `CONTRACTS-007`, `RESPONSAVEIS-001`, `SEC-001` |

Esta sequência entrega somente contratos, persistência e backend. Web e mobile
permanecem fora do escopo. `CONTRACTS-007` fecha os boundaries públicos antes
de `COMISSOES-001` corrigir o modelo persistido e expor as operações da API.
Objetivos patrimoniais futuros que exigirem comissão dependerão de
`COMISSOES-001` e deverão validar a vigência inclusiva no momento da operação.

## Ordem das entregas de inventários

| Ordem | Objetivo                                           | Status    | Dependências principais                                    |
| ----- | -------------------------------------------------- | --------- | ---------------------------------------------------------- |
| 23    | `CONTRACTS-008` — Contratos de inventários         | concluído | RF19, UC19, `CONTRACTS-004`, `CONTRACTS-007`               |
| 24    | `INVENTARIOS-001` — Criar e consultar inventários  | concluído | `CONTRACTS-008`, `COMISSOES-001`, setores e patrimônios    |
| 25    | `INVENTARIOS-002` — Conferir, corrigir e finalizar | concluído | `INVENTARIOS-001`, concorrência e política de movimentação |
| 26    | `INVENTARIOS-003` — Consulta pelo Administrador    | concluído | `INVENTARIOS-001`, `INVENTARIOS-002` e RNF05               |

Os três primeiros objetivos entregaram contratos, persistência e API sem
interfaces. `INVENTARIOS-003` alterou somente a autorização das consultas
existentes para permitir acompanhamento administrativo; as operações do
inventário continuam exclusivas do Diretor de Patrimônio. A primeira integração
mobile foi implementada em `MOBILE-HOME-002`; câmera, scanner e fila offline
continuam fora desta sequência.

A população do inventário é formada na criação por todos os setores ativos e
patrimônios ATIVOS daquele instante. Somente um setor do inventário pode ficar
EM_ANDAMENTO por vez. O baseline original bloqueava movimentações no setor em
conferência. A decisão de 27/10/2026 em RF19/B amplia o impedimento de
transferências comuns a origem/destino PENDENTE ou EM_ANDAMENTO em inventário
aberto; implementação ainda pendente em MOVIMENTACOES-001. Não usar a previsão
antiga de sincronização de itens pendentes para autorizar essas transferências.
Item verificado não é transferido entre setores do inventário nem conferido
novamente; o histórico da transferência legítima é preservado separadamente. Empréstimo ou manutenção vigente não impede
iniciar o setor: se o bem continuar ausente ao encerrá-lo, o item preserva tanto
NAO_LOCALIZADO quanto o estado e a operação que justificavam a ausência. Baixas
de patrimônios incluídos e inativações de setores do inventário ficam bloqueadas
até a finalização.

## Ordem das entregas de baixas patrimoniais

| Ordem | Objetivo                                           | Status    | Dependências principais                                            |
| ----- | -------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| 26    | `CONTRACTS-010` — Contratos de baixas patrimoniais | concluído | RF17, UC17, `CONTRACTS-004`, `CONTRACTS-007`                       |
| 27    | `BAIXAS-001` — Registrar e consultar baixa na API  | concluído | `CONTRACTS-010`, `STORAGE-001`, `COMISSOES-001`, `INVENTARIOS-002` |

Esta sequência entrega somente contratos, ajustes necessários no banco e API.
Web, mobile e a consulta agregada do histórico patrimonial permanecem fora do
escopo. `CONTRACTS-010` fecha primeiro o boundary multipart e as respostas;
`BAIXAS-001` implementa a transição irreversível, a consulta e o streaming
privado do comprovante.

Toda baixa exige patrimônio `ATIVO`, comissão vigente na data civil informada,
motivo obrigatório e, opcionalmente, observação e um único PDF de até 10 MiB.
A baixa de patrimônio incluído em inventário não finalizado permanece
bloqueada. `TRANSFERENCIA` significa saída permanente do acervo, não
movimentação entre setores; `RECLASSIFICACAO` significa desincorporação
contábil, não alteração da espécie; `ERRO_REGISTRO` preserva o registro baixado
para auditoria.

### Decisões comuns da numeração patrimonial

- O cadastro recebe somente a escolha entre numeração oficial e ausência de
  número oficial; o cliente nunca envia o número a ser atribuído.
- A numeração oficial usa valores canônicos como `1`; a identificação sem
  número oficial usa valores como `SP-1`. As duas sequências são independentes.
- As sequências são crescentes, concorrentes, não reutilizam números emitidos e
  podem possuir lacunas após falha ou rollback. Ausência de lacunas não é
  requisito desta etapa.
- O banco preserva o valor canônico sem zeros à esquerda. Consumidores futuros
  completam somente a parte numérica para a largura mínima de seis dígitos,
  apresentando `000001` ou `SP-000001` sem limitar valores maiores.
- A distinção entre `OFICIAL` e `SEM_NUMERO_OFICIAL` deve ser explícita no
  domínio e nos contratos; regras não devem depender apenas de analisar o
  prefixo da string.
- Um identificador `SP-` continua pertencendo a um patrimônio válido no SIPAT,
  mas não representa etiqueta oficial e não permite substituição ou reimpressão
  de etiqueta. Outras exceções institucionais exigem requisito próprio.
- A substituição da etiqueta preserva o `id` e todos os vínculos do patrimônio,
  gera o próximo número oficial e registra número anterior, número novo, data e
  usuário na mesma operação atômica.
- Para impedir repetição e concorrência acidental, a substituição recebe o
  número atual canônico como pré-condição, mas nunca recebe o número novo.

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

**Status:** concluído

### Resultado esperado

Permitir que qualquer usuário ativo e autenticado altere somente a própria
senha após comprovar a senha atual.

### Escopo

- `POST /api/auth/alterar-senha`, protegido para os dois perfis;
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

- [x] somente a identidade da sessão pode ter a senha alterada;
- [x] senha atual inválida não modifica senha nem sessão;
- [x] sucesso altera o hash, revoga todas as sessões e expira o cookie;
- [x] nenhuma rota administrativa aceita senha de outro usuário;
- [x] contratos, banco e API passam nas verificações proporcionais.

A invalidação de token de recuperação será conectada pelo `AUTH-003`, que cria
o model persistente correspondente e já inclui essa integração em seu escopo.

Especificação de execução:
[AUTH-002](./tasks/AUTH-002-alterar-propria-senha.md).

## AUTH-003 — Recuperar a senha por e-mail institucional

**Status:** concluído

### Resultado esperado

Permitir que um usuário ativo redefina a própria senha por um link enviado ao
e-mail institucional cadastrado, sem permitir enumeração de contas nem escolha
da conta por identificador fornecido na confirmação.

### Escopo

- `POST /api/auth/esqueceu-senha`, público e com response neutra;
- `POST /api/auth/redefinir-senha`, público e autorizado exclusivamente por
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

- [x] solicitar recuperação produz a mesma response para conta elegível,
      inexistente ou inativa;
- [x] conhecer e-mail, ID ou perfil não permite redefinir a senha;
- [x] somente o token original válido determina o usuário da redefinição;
- [x] token expirado, consumido ou concorrente não altera a conta;
- [x] sucesso altera a senha, consome os tokens e revoga todas as sessões;
- [x] segredos de SMTP, senha e token não aparecem em response, log ou métrica;
- [x] contratos, banco e API passam nas verificações proporcionais.

Especificação de execução:
[AUTH-003](./tasks/AUTH-003-recuperar-senha.md).

## AUTH-004 — Obrigar a troca da senha inicial

**Status:** concluído

### Resultado esperado

Todo usuário criado, inclusive o primeiro administrador provisionado, entra
com uma sessão restrita até substituir a senha inicial. A conclusão troca a
senha, revoga as sessões anteriores e emite uma sessão nova sem interromper o
fluxo Web.

### Escopo

- estado `trocaSenhaObrigatoria` persistido no usuário, com backfill das contas
  existentes;
- estado devolvido no login e em `/auth/me`;
- `POST /api/auth/concluir-primeiro-acesso` para os dois perfis;
- bloqueio das demais rotas protegidas enquanto a troca estiver pendente;
- atualização do hash, limpeza da pendência, invalidação de redefinição,
  revogação das sessões anteriores e criação da nova sessão de forma atômica;
- testes de concorrência, cookie, CSRF, autorização e ausência de vazamento.

### Fora do escopo

- UI Web ou mobile;
- recuperação por e-mail, MFA ou expiração periódica de senha;
- limpeza física de sessões antigas.

### Critérios de aceite

- [x] primeiro login informa a pendência e não libera rotas de domínio;
- [x] conclusão inválida não altera credencial nem sessão;
- [x] conclusão válida rotaciona a sessão e libera somente o que o perfil já
      autoriza;
- [x] a limpeza de sessões não altera o estado de primeiro acesso;
- [x] contratos, banco, API e testes PostgreSQL passam.

Especificação de execução:
[AUTH-004](./tasks/AUTH-004-primeiro-acesso-obrigatorio.md).

## CONTRACTS-004 — Contratos das operações básicas de patrimônios

**Status:** concluído

### Resultado esperado

Definir em `@repo/contracts` os boundaries de cadastro, listagem, detalhe e
substituição do número oficial antes que a API implemente essas operações.

### Escopo

- enums públicos necessários, inclusive tipo de numeração, tipo de
  incorporação e status;
- params por identificador UUID;
- body estrito de cadastro sem número patrimonial, status, texto de busca ou
  auditoria fornecidos pelo cliente;
- query paginada de listagem, com padrão 20, máximo 50, busca e filtros por
  status, setor, espécie, natureza e tipo de numeração;
- responses resumida, detalhada e paginada com allowlist explícita;
- body de substituição contendo somente o número atual canônico usado como
  pré-condição concorrente;
- representação monetária e de datas adequada ao JSON, sem perda de precisão
  nem interpretação dependente de fuso;
- testes de limites, propriedades extras, enums, paginação, campos gerados pelo
  servidor e API pública do package.

### Fora do escopo

- formulários, apresentação com zeros, hooks ou clientes Web/mobile;
- contratos de edição genérica, exclusão, transferência, baixa, inventário,
  impressão ou depreciação automática;
- regras que consultem banco dentro dos schemas.

### Critérios de aceite

- [x] o cadastro não aceita número, status, texto de busca ou auditoria;
- [x] a substituição não aceita o novo número e exige o número atual canônico;
- [x] listagem possui paginação finita e filtros com representação inequívoca;
- [x] responses distinguem numeração oficial de `SEM_NUMERO_OFICIAL` sem exigir
      parsing do prefixo pelo consumidor;
- [x] contratos e tipos são derivados de schemas Zod 4 e possuem testes;
- [x] API pública e consumidores existentes permanecem compatíveis.

Especificação de execução:
[CONTRACTS-004](./tasks/CONTRACTS-004-contratos-patrimonios.md).

## PATRIMONIOS-001 — Cadastrar patrimônios

**Status:** concluído

### Resultado esperado

Permitir que somente o Diretor de Patrimônio crie um bem com identidade
patrimonial gerada pelo servidor, status inicial `ATIVO`, vínculos válidos e
auditoria derivada da sessão.

### Escopo

- adequar o schema e a migration para representar explicitamente o tipo de
  numeração e as duas sequences PostgreSQL;
- inicializar cada sequence acima dos valores canônicos já existentes, sem
  reclassificar silenciosamente dados legados inválidos;
- `POST /api/patrimonios`, permitido somente a `DIRETOR_PATRIMONIO`;
- geração atômica e concorrente de `1` ou `SP-1`, mantendo a restrição única no
  banco como defesa adicional;
- normalização dos campos textuais e construção de `textoBusca` no servidor;
- validação de setor ativo, espécie e processo de compra opcional;
- criação da situação contábil e dos parâmetros iniciais de depreciação quando
  informados pelo contrato aprovado;
- persistência atômica do patrimônio e de seus registros iniciais;
- DTO, controller, service, repository, tipos, mapper, módulo e testes.

### Fora do escopo

- número escolhido pelo usuário, cadastro em lote e importação;
- edição genérica, exclusão, transferência, baixa ou reavaliação;
- interfaces Web/mobile e impressão de etiqueta.

### Critérios de aceite

- [x] requisição anônima recebe `401`, administrador recebe `403` e diretor
      autenticado pode cadastrar;
- [x] o body não controla número, status, texto de busca ou auditoria;
- [x] cada tipo consome somente sua própria sequence e concorrência não produz
      duplicidade;
- [x] falha não deixa patrimônio ou registros iniciais parciais, embora possa
      deixar lacuna na sequence;
- [x] status, auditoria, normalização e relações são definidos e validados no
      servidor;
- [x] contratos, banco, API e testes PostgreSQL passam nas verificações.

Especificação de execução:
[PATRIMONIOS-001](./tasks/PATRIMONIOS-001-cadastrar-patrimonios.md).

## PATRIMONIOS-002 — Consultar e listar patrimônios

**Status:** concluído

### Resultado esperado

Permitir que Administrador e Diretor de Patrimônio consultem detalhes e uma
lista paginada, filtrável e ordenada deterministicamente, sem N+1 nem exposição
de campos internos.

### Escopo

- `GET /api/patrimonios` com busca normalizada, filtros aprovados, paginação com
  padrão 20 e máximo 50 e ordenação determinística;
- `GET /api/patrimonios/:patrimonioId` com os dados de identificação e vínculos
  previstos no contrato detalhado;
- setor atual acompanhado de seu responsável atual e espécie acompanhada de
  sua natureza;
- seleção mínima, mapper explícito, índices justificados pelas queries reais e
  testes com volume e combinações de filtros representativas.

### Fora do escopo

- resposta sem paginação, busca por histórico ou relatório;
- cache remoto, exportação, Web/mobile e formatação com zeros no backend;
- mutações patrimoniais.

### Critérios de aceite

- [x] os dois perfis autenticados consultam; anônimo recebe `401`;
- [x] filtros inválidos são rejeitados e ausência de resultados retorna lista
      vazia com metadados consistentes;
- [x] busca usa os dados normalizados e `textoBusca`;
- [x] responsável e natureza são obtidos pelas relações atuais, sem duplicação
      de fonte de verdade;
- [x] paginação é estável, finita e não executa N+1;
- [x] responses passam pelos schemas e não expõem models Prisma diretamente.

Especificação de execução:
[PATRIMONIOS-002](./tasks/PATRIMONIOS-002-consultar-patrimonios.md).

## PATRIMONIOS-003 — Substituir número patrimonial oficial

**Status:** concluído

### Resultado esperado

Trocar uma etiqueta oficial danificada sem baixar, duplicar ou recriar o bem,
preservando sua identidade e registrando a substituição para auditoria.

### Escopo

- persistência do histórico de substituições com patrimônio, número anterior,
  número novo, data e usuário;
- `POST /api/patrimonios/:patrimonioId/substituicoes-numero`, permitido somente
  a `DIRETOR_PATRIMONIO`;
- comparação do número atual recebido com o valor persistido;
- rejeição de patrimônio `SEM_NUMERO_OFICIAL`;
- consumo do próximo número da sequence oficial;
- atualização do patrimônio e criação do histórico na mesma transação;
- tratamento previsível de patrimônio ausente, número atual desatualizado,
  tipo não elegível e conflito inesperado de unicidade;
- testes unitários, E2E e de concorrência em PostgreSQL real.

### Fora do escopo

- número novo fornecido pelo usuário;
- conversão entre numeração oficial e `SEM_NUMERO_OFICIAL`;
- reimpressão, geração de arquivo ou integração com impressora;
- edição de qualquer outro atributo, baixa ou recriação do patrimônio;
- tela, modal, operação ou hook Web/mobile.

### Critérios de aceite

- [x] somente diretor autenticado pode executar a operação;
- [x] patrimônio `SP-` é rejeitado sem consumir a sequence oficial;
- [x] número atual divergente rejeita repetição ou concorrência sem nova troca;
- [x] uma troca bem-sucedida preserva `id`, relações e demais atributos;
- [x] número anterior, novo, data e usuário são gravados atomicamente;
- [x] o número anterior nunca volta ao conjunto de números disponíveis;
- [x] duas confirmações concorrentes para o mesmo estado produzem exatamente
      uma substituição bem-sucedida;
- [x] falha pode consumir número da sequence, mas não deixa atualização ou
      histórico parcial.

Especificação de execução:
[PATRIMONIOS-003](./tasks/PATRIMONIOS-003-substituir-numero-patrimonial.md).

## STORAGE-001 — Preparar armazenamento local de documentos

**Status:** concluído

### Resultado esperado

Persistir documentos no host por bind mount, fora do filesystem do container,
com chaves lógicas portáveis, validação de caminho, compensação e reconciliação
de órfãos.

### Escopo

- `./data/uploads` no host em desenvolvimento e `UPLOADS_HOST_PATH` absoluto em
  staging e produção;
- destino `/data/uploads` no container e `UPLOADS_ROOT_PATH` na aplicação;
- adapter reutilizável de filesystem sem rota estática pública;
- staging, limpeza compensatória e reconciliação após falhas ou interrupções.

### Critérios de aceite

- [x] recriação do container preserva os dados no host;
- [x] paths que escapem da raiz são rejeitados;
- [x] falhas não deixam órfãos permanentes nem removem arquivos referenciados;
- [x] configuração e comportamento possuem testes isolados.

Especificação de execução:
[STORAGE-001](./tasks/STORAGE-001-armazenamento-local-documentos.md).

## CONTRACTS-005 — Contratos dos cadastros patrimoniais relacionados

**Status:** concluído

### Resultado esperado

Definir requests, queries e responses de responsáveis, naturezas, espécies,
setores e fornecedores antes dos respectivos módulos da API.

### Critérios de aceite

- [x] operações refletem RF03, RF04, RF06, RF07 e RF08 sem aceitar campos
      controlados pelo servidor;
- [x] listagens possuem limites e responses usam allowlist;
- [x] schemas, tipos e exports públicos possuem testes.

Especificação de execução:
[CONTRACTS-005](./tasks/CONTRACTS-005-cadastros-patrimoniais-relacionados.md).

## RESPONSAVEIS-001 — Gerenciar responsáveis

**Status:** concluído

### Resultado esperado

Entregar cadastro, consulta, alteração e inativação de responsáveis somente ao
Administrador, preservando vínculos históricos.

### Critérios de aceite

- [x] matrícula obrigatória e conflitos são tratados de modo previsível;
- [x] inativação não exclui o registro nem rompe históricos;
- [x] paginação, auditoria e autorização possuem cobertura.

Especificação de execução:
[RESPONSAVEIS-001](./tasks/RESPONSAVEIS-001-gerenciar-responsaveis.md).

## NATUREZAS-001 — Gerenciar naturezas de bens

**Status:** concluído

### Resultado esperado

Entregar cadastro, consulta e alteração de naturezas somente ao Administrador,
com normalização e unicidade controladas pelo servidor.

### Critérios de aceite

- [x] nomes equivalentes após normalização não geram duplicatas;
- [x] vínculos existentes são preservados;
- [x] paginação, auditoria e autorização possuem cobertura.

Especificação de execução:
[NATUREZAS-001](./tasks/NATUREZAS-001-gerenciar-naturezas.md).

## ESPECIES-001 — Gerenciar espécies de bens

**Status:** concluído

### Resultado esperado

Entregar cadastro, consulta e alteração de espécies somente ao Administrador,
garantindo uma única natureza por espécie.

### Critérios de aceite

- [x] natureza obrigatória e existente é validada;
- [x] unicidade normalizada resiste a concorrência;
- [x] mudança de vínculo preserva patrimônios existentes.

Especificação de execução:
[ESPECIES-001](./tasks/ESPECIES-001-gerenciar-especies.md).

## SETORES-001 — Gerenciar setores

**Status:** concluído

### Resultado esperado

Entregar cadastro, consulta, alteração, ativação e inativação de setores somente
ao Administrador, sempre com responsável atual válido.

### Critérios de aceite

- [x] novo vínculo exige responsável ativo;
- [x] setor inativo não recebe novos patrimônios;
- [x] inativação preserva registros e históricos.

Especificação de execução:
[SETORES-001](./tasks/SETORES-001-gerenciar-setores.md).

## FORNECEDORES-001 — Gerenciar fornecedores

**Status:** concluído

### Resultado esperado

Entregar cadastro, consulta, alteração, ativação e inativação de fornecedores
somente ao Administrador, preservando aquisições e manutenções históricas.

### Critérios de aceite

- [x] CNPJ e demais dados seguem o contrato aprovado;
- [x] fornecedor inativo não entra em novo vínculo;
- [x] inativação preserva notas e manutenções existentes.

Especificação de execução:
[FORNECEDORES-001](./tasks/FORNECEDORES-001-gerenciar-fornecedores.md).

## CONTRACTS-006 — Contratos de processos de compra e notas fiscais

**Status:** concluído

### Resultado esperado

Definir contratos JSON e multipart para processos, até 20 notas opcionais e no
máximo um PDF de 10 MiB por nota.

### Critérios de aceite

- [x] o campo `dados` mapeia notas aos arquivos por índice sem ambiguidade;
- [x] a criação rejeita a 21ª nota e o 21º arquivo;
- [x] arquivos sem nota, índices repetidos e partes excedentes são rejeitados;
- [x] responses expõem URL autenticada derivada do `id`, nunca caminho físico.

Especificação de execução:
[CONTRACTS-006](./tasks/CONTRACTS-006-processos-compra-notas-fiscais.md).

## COMPRAS-001 — Gerenciar processos de compra

**Status:** em execução

### Resultado esperado

Entregar cadastro multipart, consulta e alteração de processos para
Administrador e Diretor de Patrimônio, incluindo de zero a 20 notas na criação
inicial.

### Critérios de aceite

- [ ] processo, notas e referências são consistentes como uma operação lógica;
- [ ] fornecedor inexistente ou inativo impede novo vínculo;
- [ ] qualquer falha limpa registros e arquivos parciais;
- [ ] consultas são paginadas e não expõem caminhos físicos.

Especificação de execução:
[COMPRAS-001](./tasks/COMPRAS-001-gerenciar-processos-compra.md).

## NOTAS-FISCAIS-001 — Gerenciar notas fiscais e anexos

**Status:** concluído

### Resultado esperado

Entregar consulta, criação posterior e alteração de notas, além de inclusão,
substituição, remoção e leitura autenticada do PDF pelo próprio domínio.

### Escopo

- operações de dados em `/api/notas-fiscais`;
- `GET`, `PUT` e `DELETE /api/notas-fiscais/:notaFiscalId/anexo`;
- streaming privado, sem `ServeStaticModule` ou `/api/uploads` genérico;
- remoção do arquivo anterior e reconciliação de órfãos.

### Critérios de aceite

- [x] somente sessão válida acessa o conteúdo;
- [x] PDF inválido ou maior que 10 MiB é rejeitado;
- [x] substituição e remoção não deixam órfãos permanentes;
- [x] a Web pode futuramente consumir
      `/api/backend/notas-fiscais/:notaFiscalId/anexo` pelo rewrite existente.

Especificação de execução:
[NOTAS-FISCAIS-001](./tasks/NOTAS-FISCAIS-001-gerenciar-notas-anexos.md).

## CONTRACTS-007 — Contratos de comissões

**Status:** concluído

### Resultado esperado

Definir contratos compartilhados de cadastro, consulta e alteração de
comissões e de inclusão, alteração de papel e remoção de seus integrantes antes
da implementação do módulo da API.

### Escopo

- params, criação, alteração, listagem paginada e responses de comissão;
- enum público `PRESIDENTE | MEMBRO` e contratos próprios para as operações de
  integrantes;
- criação com zero a 50 integrantes e datas civis de vigência com limites
  inclusivos;
- número do ato como texto opcional, sem expor auditoria como input;
- schemas estritos, limites finitos, tipos derivados e exports públicos.

### Critérios de aceite

- [x] criação vazia e criação com até 50 responsáveis são representáveis;
- [x] responsável repetido, papel inválido, segundo presidente e 51º integrante
      são rejeitados pelo boundary quando a inconsistência estiver no payload;
- [x] alteração de integrante aceita somente o novo papel e não permite trocar
      o responsável;
- [x] data final anterior à inicial é rejeitada e as datas permanecem `DateOnly`;
- [x] responses usam allowlist e não expõem models Prisma nem campos internos;
- [x] lint, typecheck, testes e consumidores afetados passam.

Especificação de execução:
[CONTRACTS-007](./tasks/CONTRACTS-007-contratos-comissoes.md).

## COMISSOES-001 — Gerenciar comissões

**Status:** concluído

### Resultado esperado

Entregar ao Administrador cadastro, consulta e alteração de comissões, incluindo
a gestão transacional de integrantes ativos e a preservação das características
históricas depois do primeiro uso patrimonial.

### Escopo

- listagem, detalhe, cadastro e alteração em `/api/comissoes`;
- inclusão, alteração de papel e remoção em
  `/api/comissoes/:comissaoId/membros`;
- correção de `numeroAto` para texto, papel obrigatório e garantias de unicidade
  no PostgreSQL;
- criação atômica da comissão e de zero a 50 integrantes;
- vigência inclusiva e bloqueio de número do ato, datas e integrantes após uso.

### Critérios de aceite

- [x] somente `ADMINISTRADOR` acessa as rotas e a auditoria deriva da sessão;
- [x] somente responsável ativo entra em novo vínculo e o mesmo responsável não
      se repete na comissão;
- [x] no máximo um presidente é garantido também sob concorrência;
- [x] falha em qualquer integrante desfaz a criação inteira;
- [x] após uso patrimonial, somente nome e descrição podem mudar;
- [x] listagens são paginadas, determinísticas e sem N+1;
- [x] migration, integração PostgreSQL, testes da API e build passam.

Concluído em 24 de outubro de 2026. A validação aplicou as onze migrations desde
um PostgreSQL 17 vazio e confirmou em banco a conversão preservadora de
`numero_ato`, o diagnóstico de papel nulo, a atomicidade da criação, a corrida
entre presidentes, a vigência inclusiva e o congelamento após uso patrimonial.

Especificação de execução:
[COMISSOES-001](./tasks/COMISSOES-001-gerenciar-comissoes.md).

## CONTRACTS-008 — Contratos de inventários

**Status:** concluído

### Resultado esperado

Definir os contratos compartilhados para criar, consultar, conferir, corrigir e
finalizar inventários, com estados discriminados e conflitos públicos estáveis,
antes da implementação do módulo da API.

### Escopo

- criação e consultas paginadas de inventários, setores e itens;
- enums, params, filtros, responses e agregados de progresso;
- operações próprias para iniciar e concluir setor, verificar e corrigir item e
  finalizar inventário;
- identificação pelo número patrimonial, sem acoplamento a câmera ou scanner;
- resultados idempotentes e conflitos de item previamente verificado;
- confirmação explícita da finalização com correções pendentes.

### Fora do escopo

- banco, migration ou NestJS;
- contratos das operações gerais de movimentação patrimonial;
- Web, mobile, câmera, scanner ou autenticação de clientes.

### Critérios de aceite

- [x] inputs não aceitam estados, datas, vínculos ou auditoria derivados;
- [x] schemas distinguem todas as transições e correções sem PATCH genérico;
- [x] listagens e filtros possuem limites finitos;
- [x] responses usam allowlist e não importam models Prisma;
- [x] idempotência e conflitos possuem payloads discriminados e testes;
- [x] lint, typecheck, testes e consumidores dos exports passam.

Especificação de execução:
[CONTRACTS-008](./tasks/CONTRACTS-008-contratos-inventarios.md).

## INVENTARIOS-001 — Criar e consultar inventários

**Status:** concluído

### Resultado esperado

Entregar ao Diretor de Patrimônio a API que cria atomicamente o inventário, os
setores ativos e os itens dos patrimônios ATIVOS, além das consultas finitas do
snapshot e de seu progresso.

### Escopo

- migration aditiva e revisão dos models de inventário existentes;
- auditoria das transições e garantia de um setor EM_ANDAMENTO por inventário;
- snapshot do status cadastral na verificação e vínculos opcionais ao empréstimo
  ou item de manutenção vigente;
- criação transacional sob comissão vigente;
- listagem e detalhe de inventários, setores e itens;
- agregados, paginação, ordenação determinística e queries sem N+1.

### Fora do escopo

- iniciar ou concluir setor, verificar ou corrigir item e finalizar inventário;
- cancelar, excluir ou editar genericamente inventário;
- Web e mobile.

### Critérios de aceite

- [x] criação inclui somente setores ativos e patrimônios ATIVOS do instante da
      operação;
- [x] setores e itens começam pendentes, sem datas nem correções;
- [x] setor esperado e vínculo com o setor do inventário refletem a localização
      cadastral inicial;
- [x] falha em qualquer parte desfaz toda a criação;
- [x] comissão e autorização são validadas e a auditoria deriva da sessão;
- [x] migration, PostgreSQL, API e consumidores dos contratos passam nas
      verificações aplicáveis.

Especificação de execução:
[INVENTARIOS-001](./tasks/INVENTARIOS-001-criar-consultar-inventarios.md).

## INVENTARIOS-002 — Conferir, corrigir e finalizar inventários

**Status:** concluído

### Resultado esperado

Entregar o ciclo operacional da API com uma conferência de setor por vez,
classificação consistente dos itens, correções rastreáveis, bloqueio setorial de
operações incompatíveis e concorrência comprovada no PostgreSQL.

### Escopo

- iniciar e concluir setor e finalizar inventário por operações próprias;
- registrar CORRETO, DIVERGENCIA e NAO_LOCALIZADO com datas e usuários;
- preservar, em cada verificação, o status do patrimônio e a operação vigente
  que explique ausência por empréstimo ou manutenção;
- corrigir por retorno físico ou transferência cadastral atômica;
- preservar leitura idempotente e rejeitar segunda conferência em outro setor;
- baseline entregue: controles do inventário e bloqueio setorial de operações
  incompatíveis; para transferências comuns prevalece a evolução RF19/B,
  planejada em MOVIMENTACOES-001, sem alterar o fluxo específico de correção;
- bloquear baixa de patrimônio incluído e inativação de setor até a finalização;
- impedir qualquer mutação depois da finalização;
- cobrir as corridas de início, leitura, conclusão, correção e finalização.

### Fora do escopo

- reabertura, cancelamento ou exclusão;
- APIs gerais de transferência, empréstimo, devolução, manutenção ou baixa;
- Web, mobile, câmera, scanner ou fila offline.

### Critérios de aceite

- [x] somente um setor por inventário fica EM_ANDAMENTO e um mesmo setor físico
      não possui duas conferências simultâneas;
- [x] estados e auditoria de setor, item e inventário mudam atomicamente;
- [x] conclusão transforma todos os itens ainda pendentes em NAO_LOCALIZADO e
      VERIFICADO;
- [x] correções preservam DIVERGENCIA e criam transferência somente na correção
      cadastral;
- [x] finalização exige todos os setores concluídos, confirmação de pendências e
      torna o conjunto imutável;
- [x] testes PostgreSQL reais comprovam locks, isolamento e conflitos;
- [x] API, contratos, banco e documentação passam nas verificações aplicáveis.

Concluído em 25 de outubro de 2026. A entrega adicionou as cinco mutações
operacionais, constraints e índices para os estados consultados, retry finito
para conflitos de serialização e proteção de inativação/baixa enquanto o
inventário permanece aberto. A integração foi validada em PostgreSQL 17
descartável com as migrations aplicadas desde banco vazio e corridas reais de
início, leitura, conclusão e finalização. Como as APIs gerais de movimentação,
empréstimo, manutenção e baixa ainda não existem, seus futuros módulos devem
usar a política de inventários e declarar `INVENTARIOS-002` como dependência.

Especificação de execução:
[INVENTARIOS-002](./tasks/INVENTARIOS-002-conferir-corrigir-finalizar.md).

## CONTRACTS-010 — Contratos de baixas patrimoniais

**Status:** concluído

### Resultado esperado

Definir o contrato compartilhado para registrar e consultar a baixa única e
irreversível de um patrimônio, incluindo o boundary multipart opcional e a URL
privada do documento, antes de alterar banco ou API.

### Escopo

- enum público com `ALIENACAO`, `INUTILIZACAO`, `SINISTRO`, `FURTO`,
  `EXTRAVIO`, `TRANSFERENCIA`, `RECLASSIFICACAO`, `ABANDONO`, `ERRO_REGISTRO`
  e `OUTRO`;
- params do patrimônio, dados estritos da baixa e parsing do campo multipart
  `dados`;
- `dataBaixa` como `DateOnly`, `comissaoId` e `motivo` obrigatórios e
  `observacao` opcional;
- no máximo um campo de arquivo `documento`, PDF de até 10 MiB;
- resposta detalhada da baixa com auditoria, comissão e `anexoUrl` derivada,
  sem expor a chave do filesystem;
- respostas de criação e consulta e códigos públicos dos conflitos de domínio.

### Fora do escopo

- Prisma, migration, NestJS ou filesystem;
- alteração, exclusão, substituição de documento ou estorno da baixa;
- listagem geral de baixas e histórico patrimonial agregado;
- Web e mobile.

### Critérios de aceite

- [x] contratos não aceitam status, auditoria, chave de arquivo ou URL enviados
      pelo cliente;
- [x] propriedades inesperadas, enum inválido, textos vazios ou acima dos
      limites e data inválida são rejeitados;
- [x] multipart possui limites explícitos de arquivo, campos e partes;
- [x] response usa allowlist e representa a ausência do documento sem vazar
      caminhos internos;
- [x] testes cobrem payload mínimo e completo, todos os tipos e API pública;
- [x] lint, typecheck, testes e consumidores dos exports passam.

Concluído em 27 de outubro de 2026. O package agora publica o boundary estrito
dos dados e do multipart, os dez tipos de baixa, os códigos públicos de domínio
e a resposta detalhada com URL derivada sem expor a chave do documento. Lint,
typecheck e 104 testes de contratos passaram, assim como o typecheck de API,
Web e mobile. Banco, API e filesystem continuam reservados para `BAIXAS-001`.

Especificação de execução:
[CONTRACTS-010](./tasks/CONTRACTS-010-contratos-baixas-patrimoniais.md).

## BAIXAS-001 — Registrar e consultar baixa na API

**Status:** concluído

### Resultado esperado

Entregar ao Diretor de Patrimônio a API que registra uma única baixa, altera o
status do bem para `BAIXADO` na mesma operação lógica, consulta o histórico da
baixa e transmite seu PDF opcional sem expor o armazenamento.

### Escopo

- migration nova para substituir o enum legado, representar `dataBaixa` como
  data civil e garantir no banco uma única baixa por patrimônio;
- criação multipart, consulta da baixa e streaming autenticado do documento;
- comissão obrigatória e vigente na `dataBaixa`, derivação de auditoria pela
  sessão e rejeição de data futura;
- lock do patrimônio e transação curta para validar `ATIVO`, criar a baixa e
  alterar o status atomicamente;
- integração com a política e a proteção de banco de `INVENTARIOS-002`;
- PDF privado opcional de até 10 MiB, compensação de falhas e reconciliação de
  órfãos;
- conflitos públicos estáveis e testes reais no PostgreSQL para as corridas de
  baixa.

### Fora do escopo

- edição, exclusão, estorno, substituição ou remoção do comprovante;
- baixa em lote;
- transferências internas entre setores, reclassificação cadastral da espécie
  ou apuração administrativa de furto e extravio;
- consulta agregada do histórico patrimonial, relatórios, Web e mobile.

### Critérios de aceite

- [x] somente `DIRETOR_PATRIMONIO` cria, consulta ou faz download do documento;
- [x] patrimônio inexistente, não ativo, já baixado ou participante de
      inventário aberto falha sem arquivo ou persistência parcial;
- [x] comissão inexistente ou fora da vigência da data informada e data futura
      são rejeitadas;
- [x] criação concorrente produz uma única baixa e um estado final consistente;
- [x] baixa, status e auditoria são persistidos atomicamente e não existe rota
      de estorno;
- [x] PDF inválido ou acima do limite é rejeitado; falhas são compensadas e o
      download não revela a chave persistida;
- [x] migration, PostgreSQL, API, contratos e consumidores passam nas
      verificações aplicáveis.

Concluído em 27 de outubro de 2026. A API registra uma única baixa em transação
com locks de patrimônio e comissão, preserva a proteção de inventário na policy
e no PostgreSQL e transmite o PDF privado por streaming. A migration foi
validada desde banco vazio e sobre o schema anterior; lint, tipos, testes,
build da API e consumidores Web/mobile passaram.

Especificação de execução:
[BAIXAS-001](./tasks/BAIXAS-001-registrar-consultar-baixas.md).

## CONTRACTS-011 — Contratos de depreciação patrimonial

**Status:** concluído

### Resultado esperado

Definir em `@repo/contracts` os boundaries da consulta de pendentes e das
execuções mensal, individual e em massa antes que banco ou API implementem o
processamento contábil.

### Escopo

- competência mensal explícita em `AAAA-MM`, validada estruturalmente no
  contrato e limitada à competência corrente pela API;
- consulta paginada dos patrimônios elegíveis ainda não depreciados, com quota
  prevista e resumo agregado dos itens no valor residual;
- bodies estritos e distintos para depreciar um patrimônio ou todos os
  elegíveis, sem aceitar arrays ou quantidades arbitrárias;
- comissão obrigatória e confirmação explícita para ignorar itens que já
  estejam no valor residual;
- resposta discriminada da execução individual, contendo a depreciação criada
  ou o motivo de inelegibilidade, e resposta agregada e finita da execução em
  massa;
- valores decimais serializados com até sete casas, datas civis e instantes sem
  interpretação dependente do fuso;
- códigos públicos para competência inválida, confirmação necessária e
  conflitos do domínio.

### Fora do escopo

- Prisma, migration, NestJS ou cálculo com acesso ao banco;
- reavaliação, estorno, edição ou exclusão de depreciação;
- histórico patrimonial agregado, relatórios, Web e mobile.

### Critérios de aceite

- [x] contratos não aceitam auditoria, valores calculados, situação contábil
      ou identificadores de parâmetro controlados pelo servidor;
- [x] execução individual e em massa não permitem selecionar subconjuntos de
      patrimônios;
- [x] consulta possui paginação finita, ordenação determinística e response
      suficiente para a conferência prévia;
- [x] responses usam allowlists e a resposta em massa permanece limitada
      independentemente da quantidade processada;
- [x] testes cobrem competência, confirmação, propriedades extras, precisão e
      API pública;
- [x] lint, typecheck, testes e consumidores afetados passam.

Concluído em 27 de outubro de 2026. A consulta ficou limitada a 50 itens por
página e sem ordenação controlada pelo cliente; os bodies não aceitam
subconjuntos e a resposta em massa contém somente agregados. Lint, typecheck e
115 testes do package passaram, assim como o typecheck de API, Web e mobile.

Especificação de execução:
[CONTRACTS-011](./tasks/CONTRACTS-011-contratos-depreciacoes-patrimoniais.md).

## DEPRECIACOES-001 — Consultar e executar depreciações na API

**Status:** concluído

### Resultado esperado

Permitir que somente o Diretor de Patrimônio confira os bens pendentes e
execute, de forma atômica, a depreciação linear da competência corrente para
um patrimônio ou para todos os elegíveis.

### Escopo

- consulta paginada dos itens ainda não depreciados na competência corrente,
  incluindo `ATIVO`, `EMPRESTADO` e `EM_MANUTENCAO`;
- execução individual e em massa com uma comissão vigente na data civil do
  processamento;
- início da depreciação no mês seguinte à `dataInicio`, sem fração do
  primeiro mês nem recomposição retroativa;
- quota linear calculada pelo saldo ainda depreciável e pela vida útil
  restante, com precisão decimal de até sete casas e ajuste final ao residual;
- atualização da situação contábil e criação do histórico individual na
  mesma transação;
- confirmação antes de ignorar itens que já estejam no residual e resumo dos
  que atingirem o residual nesta execução;
- rollback integral diante de erro inesperado e classificação explícita dos
  itens inelegíveis sem tratá-los como falha;
- locks, revalidação transacional, unicidade por patrimônio, parâmetro e
  competência, queries em lote e índices justificados pelo plano real;
- testes unitários, E2E e PostgreSQL para cálculo, atomicidade e concorrência.

### Fora do escopo

- reavaliação, estorno, edição ou exclusão de registros;
- depreciação proporcional por dias, processamento de competência passada ou
  futura e seleção de subconjunto em lote;
- scheduler, fila, processamento automático sem ação do usuário;
- histórico agregado, relatórios, Web e mobile.

### Critérios de aceite

- [x] somente `DIRETOR_PATRIMONIO` consulta pendentes e executa depreciação;
- [x] competência diferente do mês civil corrente é rejeitada sem escrita;
- [x] cada patrimônio recebe no máximo uma depreciação por parâmetro e
      competência, inclusive sob concorrência;
- [x] situação contábil e histórico permanecem consistentes e nenhuma quota
      reduz o valor líquido abaixo do residual;
- [x] a operação em massa desfaz todas as escritas diante de erro inesperado e
      retorna apenas agregados finitos;
- [x] cadastro tardio, empréstimo, manutenção, baixa, início no mês corrente,
      duplicidade e residual possuem cobertura explícita;
- [x] migration, PostgreSQL, API, contratos e consumidores passam nas
      verificações aplicáveis.

Concluído em 27 de outubro de 2026. A API consulta pendências em lote e executa
um patrimônio ou todo o acervo em transação serializável, com revalidação da
competência e comissão, locks ordenados, cálculo decimal e gravação agregada. A
migration impede mais de um parâmetro vigente por patrimônio; testes unitários,
E2E e PostgreSQL confirmaram autorização, concorrência, rollback, residual e o
plano da consulta com volume representativo.

Especificação de execução:
[DEPRECIACOES-001](./tasks/DEPRECIACOES-001-consultar-executar-depreciacoes.md).

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

## Movimentações entre setores — entregues

**Status:** contratos, API e Web implementados e integrados; verificações automatizadas concluídas em 28/10/2026. Homologação manual com leitor de tela pendente na Web.

1. [CONTRACTS-012](./tasks/CONTRACTS-012-contratos-movimentacoes.md): schemas,
   tipos, exports e 123 testes do package.
2. [MOVIMENTACOES-001](./tasks/MOVIMENTACOES-001-transferir-consultar-patrimonios.md):
   API, idempotência persistente, transações, política B e PostgreSQL real.
3. [WEB-MOVIMENTACOES-001](./tasks/WEB-MOVIMENTACOES-001-integrar-movimentacoes.md):
   consulta/detalhe para ambos os perfis, registro em três etapas somente pelo
   diretor, E2E padrão e real, inspeção visual e limites documentados.

A regra B e as restrições da população fixa estão implementadas para o fluxo
comum. Correções próprias preservam as validações existentes, sem nova
revalidação de vigência. A revisão futura dessas correções continua fora deste
ciclo. UUID individual, sem código TR nem lote; migrations aplicadas no local e
no ambiente isolado com dados preservados. O placeholder foi substituído.
[Evidências e reprodução](../PROMPTS-MOVIMENTACOES.md).
