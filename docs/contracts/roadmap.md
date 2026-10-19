# Roadmap do `@repo/contracts`

Este arquivo registra:

1. o baseline técnico já entregue;
2. objetivos concretos dos contratos do SIPAT.

Ele não antecipa entidades ou semânticas além do que está confirmado nos
[requisitos do SIPAT](../requisitos-SIPAT.md). Cada capacidade é registrada
quando entrar em uma entrega concreta.

## Baseline técnico

- [x] Package compartilhado localizado em `packages/contracts`.
- [x] Nome de workspace definido como `@repo/contracts`.
- [x] Package privado com entrypoint e export público em `src/index.ts`.
- [x] Zod 4 disponível para contratos runtime.
- [x] Configurações compartilhadas de TypeScript e ESLint.
- [x] Scripts de lint, typecheck e testes disponíveis no package.
- [x] Dependências `workspace:*` configuradas nos apps Web e API.
- [x] Transpilação de `@repo/contracts` configurada no Next.js.
- [x] Package independente de `@repo/database` e de código server-only.
- [x] Contratos genéricos de resposta, erro e paginação implementados e
      testados.
- [x] Tipos neutros do health check compartilhados entre Web e API.
- [x] Teste que protege a API pública genérica do package.
- [x] Documentação de arquitetura, convenções, erros, integrações e testes.
- [x] Instruções para agentes apontando para a documentação de contratos.

O baseline contém somente a infraestrutura que já funciona no SIPAT. Uma
capacidade documentada, mas ainda não implementada e verificada, não deve ser
marcada como concluída.

## Objetivos específicos do projeto

Os contratos de identidade e perfis do `CONTRACTS-001`, de usuários e
autenticação do `CONTRACTS-002` e de alteração e recuperação de senha do
`CONTRACTS-003` e os contratos das operações básicas de patrimônios do
`CONTRACTS-004` estão implementados e validados.

Cada objetivo deve registrar:

- contexto e problema concreto;
- escopo e itens explicitamente excluídos;
- consumidores afetados;
- critérios de aceite verificáveis;
- decisões semânticas que não podem ser inferidas apenas do tipo.

### CONTRACTS-001 — Identidade e perfis para controle de acesso

**Status:** concluído

**Contexto**

`SEC-001` precisa compartilhar os dois perfis confirmados pelos requisitos e a
representação segura da identidade autenticada sem importar enums do Prisma.

**Escopo**

- schema e tipo de `ADMINISTRADOR | DIRETOR_PATRIMONIO`;
- schema e tipo da identidade segura com `id`, `nome`, `email` e `perfil`;
- constantes públicas `X-SIPAT-CSRF` e `1`, que não contêm segredo;
- testes de valores válidos, inválidos, propriedades inesperadas e API pública;
- exports independentes de `@repo/database`.

**Consumidores afetados**

- API, nos Guards e no contexto autenticado;
- Web, ao consultar a identidade atual em `AUTH-001`.

**Critérios de aceite**

- [x] schema é a fonte de verdade e os tipos são derivados;
- [x] somente os dois perfis dos requisitos são aceitos;
- [x] identidade não contém senha, hash, sessão ou campos internos;
- [x] lint, typecheck e testes do package passam;
- [x] consumidores afetados passam nas verificações aplicáveis.

### CONTRACTS-002 — Operações de usuários e autenticação

**Status:** concluído

**Contexto**

`USERS-001` e `AUTH-001` exigem contratos distintos para CRUD administrativo,
login e identidade atual. Formulário, body, response e model Prisma não são o
mesmo contrato.

**Escopo**

- **entregue:** params, query, criação, atualização e situação do usuário;
- **entregue:** response segura resumida/detalhada e resposta paginada;
- **entregue:** body estrito de login, response segura do login e response da
  identidade atual;
- testes cobrem limites, normalização de e-mail, senha, PATCH, enums,
  propriedades inesperadas e ausência de campos sensíveis.

**Consumidores afetados**

- módulos `usuarios` e `auth` da API;
- features de usuários e autenticação da Web.

**Critérios de aceite**

- [x] criação, atualização, situação e responses de usuário possuem schemas
      próprios quando suas semânticas diferem;
- [x] login e identidade atual possuem schemas próprios em `AUTH-001`;
- [x] senha existe somente nos inputs de criação e login;
- [x] responses de usuário nunca aceitam ou expõem senha, hash ou token;
- [x] paginação reutiliza o contrato comum sem remover seu limite finito;
- [x] contratos de usuário possuem testes antes do consumo pelos apps;
- [x] lint, typecheck, testes e consumidores afetados passam.

### CONTRACTS-003 — Alteração e recuperação de senha

**Status:** concluído

**Contexto**

`AUTH-002` e `AUTH-003` precisam compartilhar validação de entrada entre a API
e consumidores futuros, sem transformar models Prisma, token de recuperação ou
detalhes de SMTP em contratos públicos.

**Escopo**

- primitive pública de senha com 15 a 128 pontos de código Unicode, espaços
  permitidos e sem regra artificial de composição;
- preservação da compatibilidade semântica do contrato de senha inicial já
  consumido por `CriarUsuarioSchema`;
- `AlterarSenhaBodySchema` com `senhaAtual`, `novaSenha` e
  `confirmacaoNovaSenha`;
- `SolicitarRedefinicaoSenhaBodySchema` com e-mail normalizado;
- `RedefinirSenhaBodySchema` com token Base64url de 43 caracteres,
  `novaSenha` e `confirmacaoNovaSenha`;
- refinamento que rejeite confirmação divergente no boundary;
- response de solicitação com status `202` e mensagem neutra, sem confirmar se
  a conta existe, está ativa ou recebeu o e-mail;
- exports públicos, tipos derivados e testes de entradas válidas, limites,
  propriedades extras e ausência de campos sensíveis.

**Consumidores afetados**

- módulo `auth` da API em `AUTH-002` e `AUTH-003`;
- Web e mobile somente em objetivos futuros, sem alteração nesta entrega.

**Critérios de aceite**

- [x] schemas são estritos e tipos usam `z.input` ou `z.output` conforme a
      transformação realmente aplicada;
- [x] a senha não é normalizada, aparada ou registrada;
- [x] confirmação divergente é rejeitada;
- [x] token só aparece no input de redefinição;
- [x] response pública não diferencia conta elegível, inexistente ou inativa;
- [x] API pública do package e contratos existentes permanecem compatíveis;
- [x] lint, typecheck e testes do package e consumidores passam.

A especificação aprovada está em
[CONTRACTS-003](../tasks/CONTRACTS-003-contratos-senha.md).

### CONTRACTS-004 — Operações básicas de patrimônios

**Status:** concluído

**Contexto**

`PATRIMONIOS-001`, `PATRIMONIOS-002` e `PATRIMONIOS-003` precisam compartilhar
boundaries explícitos para cadastro, listagem, detalhe e substituição do número
oficial. O número atribuído, o status inicial, o texto de busca e a auditoria
pertencem ao servidor e não podem ser promovidos acidentalmente a inputs.

**Escopo**

- enum público `OFICIAL | SEM_NUMERO_OFICIAL`, além dos enums patrimoniais
  necessários às operações;
- params UUID do patrimônio;
- body estrito de cadastro com a indicação `semNumeroOficial`, dados cadastrais,
  vínculos e parâmetros iniciais de depreciação quando aplicáveis;
- query de listagem baseada no contrato comum de paginação, com padrão 20,
  máximo 50, busca e filtros por status, setor, espécie, natureza e tipo de
  numeração;
- schemas resumido, detalhado e paginado de response;
- body estrito da substituição contendo somente o número atual canônico como
  pré-condição, sem aceitar o número novo;
- datas em representação ISO acordada e valores decimais serializados sem perda
  de precisão;
- testes de limites, propriedades extras, transformações, API pública e ausência
  dos campos controlados pelo servidor nos inputs.

**Consumidores afetados**

- módulo `patrimonios` da API;
- Web e mobile somente em objetivos futuros, sem alteração nesta entrega.

**Critérios de aceite**

- [x] schemas são estritos e tipos derivam de Zod 4;
- [x] cadastro nunca aceita número patrimonial, status, texto de busca ou
      auditoria;
- [x] substituição exige o número atual e nunca aceita o número novo;
- [x] paginação e strings possuem limites finitos e testados;
- [x] responses distinguem o tipo de numeração e usam allowlist explícita;
- [x] contratos existentes e seus consumidores permanecem compatíveis;
- [x] lint, typecheck e testes do package passam.

A especificação aprovada está em
[CONTRACTS-004](../tasks/CONTRACTS-004-contratos-patrimonios.md).

### CONTRACTS-005 — Cadastros patrimoniais relacionados

**Status:** planejado

**Contexto**

Responsáveis, naturezas, espécies, setores e fornecedores precisam de contratos
explícitos antes que os módulos da API sejam implementados. Os contratos devem
preservar as dependências responsável → setor e natureza → espécie e não
promover normalização, auditoria ou estado protegido a input do cliente.

**Escopo**

- params, criação, alteração, situação, listagens e responses aplicáveis;
- paginação e filtros finitos;
- objetos estritos e allowlists de resposta;
- testes de limites, normalização esperada e API pública.

**Critérios de aceite**

- [ ] contratos correspondem a RF03, RF04, RF06, RF07 e RF08;
- [ ] diferenças entre alteração parcial, `null` e ausência estão explícitas;
- [ ] lint, typecheck e testes do package passam.

Especificação aprovada:
[CONTRACTS-005](../tasks/CONTRACTS-005-cadastros-patrimoniais-relacionados.md).

### CONTRACTS-006 — Processos de compra e notas fiscais

**Status:** planejado

**Contexto**

O cadastro inicial de processo aceita até 20 notas e arquivos opcionais em uma
requisição multipart. Metadados e partes precisam de associação inequívoca e
limites finitos, sem expor detalhes do filesystem aos consumidores.

**Escopo**

- contratos de processo e nota para criação, alteração, consulta e listagem;
- envelope multipart com `dados`, `anexos` e `anexoIndice`;
- no máximo 20 notas e 20 arquivos na criação de um processo;
- no máximo um PDF de 10 MiB por nota;
- `anexoUrl` autenticada derivada do identificador da nota;
- testes de índices, partes excedentes, limites e API pública.

**Critérios de aceite**

- [ ] nota sem arquivo e processo sem nota são representáveis;
- [ ] a 21ª nota ou o 21º arquivo é rejeitado;
- [ ] índices ambíguos e arquivos sem consumidor são rejeitados;
- [ ] caminhos físicos ou relativos persistidos não fazem parte da response;
- [ ] lint, typecheck e testes do package passam.

Especificação aprovada:
[CONTRACTS-006](../tasks/CONTRACTS-006-processos-compra-notas-fiscais.md).

## Histórico do baseline

### CONTRACTS-BASELINE-001 — Consolidar contratos genéricos antes do domínio SIPAT

**Status:** concluído

**Contexto**

O repositório consolidou contratos runtime genéricos compartilhados entre API e
Web antes da implementação do domínio SIPAT. O baseline permanece pequeno para
que cada novo contrato patrimonial tenha semântica e consumidores concretos.

**Escopo**

- remover da API pública os schemas e tipos exclusivos do domínio didático;
- preservar contratos, helpers e testes comprovadamente genéricos;
- atualizar API, Web, banco e documentação para não consumirem os contratos
  removidos;
- manter o package em Zod 4, independente de `@repo/database` e pronto para
  receber contratos do SIPAT;
- validar o package e todos os consumidores afetados.

**Consumidores afetados**

- `apps/api`, que voltou a expor somente o health check;
- `apps/web`, que voltou a expor somente a página inicial e a infraestrutura;
- `packages/database`, cujo schema não possuía models de domínio ao concluir
  esta limpeza; os models do SIPAT foram adicionados em uma entrega posterior.

**Critérios de aceite**

- [x] somente contratos genéricos permanecem exportados;
- [x] contratos removidos não possuem consumidores na `main`;
- [x] lint, typecheck e testes de `@repo/contracts` passam;
- [x] API, Web e banco passam nas verificações aplicáveis;
- [x] documentação diferencia o baseline atual das capacidades previstas para o
      SIPAT.
