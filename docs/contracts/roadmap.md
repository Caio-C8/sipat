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

Os contratos de `CONTRACTS-001` a `CONTRACTS-010` estão implementados e
validados. A integração do estado de primeiro acesso pela API e pela Web
permanece, respectivamente, em `AUTH-004` e `WEB-AUTH-001`; banco e API de
baixas patrimoniais foram concluídos em `BAIXAS-001`.

Cada objetivo deve registrar:

- contexto e problema concreto;
- escopo e itens explicitamente excluídos;
- consumidores afetados;
- critérios de aceite verificáveis;
- decisões semânticas que não podem ser inferidas apenas do tipo.

### CONTRACTS-009 — Primeiro acesso

**Status:** concluído

**Contexto**

`AUTH-004` e `WEB-AUTH-001` precisam compartilhar o estado mínimo que indica
troca obrigatória da senha inicial e o body da conclusão, sem promover sessão,
hash ou campos do banco a contrato público.

**Escopo**

- acrescentar `trocaSenhaObrigatoria` à identidade autenticada usada por login
  e `/auth/me`;
- body estrito de conclusão com nova senha e confirmação;
- resposta `204 No Content` sem payload;
- exports e testes de limites, confirmação, propriedades extras e ausência de
  campos sensíveis.

**Consumidores afetados**

- API em `AUTH-004`;
- Web em `WEB-AUTH-001`.

**Critérios de aceite**

- [x] schemas e tipos derivam de Zod 4 e preservam allowlists estritas;
- [x] senha não é normalizada nem aparece em response;
- [x] a identidade expõe somente o boolean necessário, sem detalhes internos;
- [x] lint, typecheck e testes de `@repo/contracts` passam;
- [x] consumidores afetados compilam com a compatibilidade transitória; a
      semântica persistente permanece em `AUTH-004` e `WEB-AUTH-001`.

Especificação aprovada:
[CONTRACTS-009](../tasks/CONTRACTS-009-primeiro-acesso.md).

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

- primitive pública de senha compartilhada pelos fluxos de criação, alteração,
  primeiro acesso e recuperação;
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

**Status:** concluído

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

- [x] contratos correspondem a RF03, RF04, RF06, RF07 e RF08;
- [x] diferenças entre alteração parcial, `null` e ausência estão explícitas;
- [x] lint, typecheck e testes do package passam.

Especificação aprovada:
[CONTRACTS-005](../tasks/CONTRACTS-005-cadastros-patrimoniais-relacionados.md).

### CONTRACTS-006 — Processos de compra e notas fiscais

**Status:** concluído

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

- [x] nota sem arquivo e processo sem nota são representáveis;
- [x] a 21ª nota ou o 21º arquivo é rejeitado;
- [x] índices ambíguos e arquivos sem consumidor são rejeitados;
- [x] caminhos físicos ou relativos persistidos não fazem parte da response;
- [x] lint, typecheck e testes do package passam.

Especificação aprovada:
[CONTRACTS-006](../tasks/CONTRACTS-006-processos-compra-notas-fiscais.md).

### CONTRACTS-007 — Operações de comissões

**Status:** concluído

**Contexto**

`COMISSOES-001` precisa compartilhar os boundaries de comissões e integrantes
sem expor models Prisma. A criação deve aceitar a composição inicial, inclusive
vazia, e as mutações posteriores de integrantes possuem semânticas distintas.

**Escopo**

- enum público `PRESIDENTE | MEMBRO`;
- params UUID de comissão e de integrante;
- criação estrita com nome de até 150 caracteres, descrição opcional de até
  2.000 caracteres, número do ato textual opcional de até 100 caracteres, datas
  civis de vigência e zero a 50 integrantes, sem permitir que adições
  posteriores ultrapassem esse total;
- alteração parcial de comissão e operações próprias para adicionar integrante,
  alterar somente seu papel e removê-lo;
- listagem paginada com máximo 50, busca textual finita, resumo e detalhe com
  integrantes;
- responses com datas `DateOnly`, auditoria permitida e allowlist explícita;
- testes de limites, duplicidade local, presidente único local, datas, PATCH,
  propriedades extras e API pública.

As validações que dependem do banco — responsável ativo, uso patrimonial prévio
e concorrência entre requisições — pertencem a `COMISSOES-001`, não a
refinements do contrato compartilhado.

**Consumidores afetados**

- módulo `comissoes` da API;
- Web e mobile somente em objetivos futuros, sem alteração nesta entrega.

**Critérios de aceite**

- [x] schema é a fonte de verdade e os tipos são derivados;
- [x] criação aceita zero integrantes e rejeita o 51º;
- [x] o mesmo responsável não aparece duas vezes no payload e há no máximo um
      presidente;
- [x] alteração de integrante não aceita `responsavelId`;
- [x] data final anterior à inicial é rejeitada sem conversão dependente de
      fuso;
- [x] inputs não aceitam auditoria, estado derivado ou identificadores criados
      pelo servidor;
- [x] lint, typecheck, testes e consumidores afetados passam.

Especificação aprovada:
[CONTRACTS-007](../tasks/CONTRACTS-007-contratos-comissoes.md).

### CONTRACTS-008 — Operações de inventários

**Status:** concluído

**Contexto**

`INVENTARIOS-001` e `INVENTARIOS-002` precisam compartilhar os boundaries de
criação, consulta, conferência, correção e finalização sem expor models Prisma.
As transições são operações de domínio distintas e não devem ser representadas
por um PATCH genérico de status.

**Escopo**

- enums públicos de inventário, setor, situação, verificação e correção;
- params UUID de inventário, setor do inventário e item;
- criação sem estados, datas, setores, itens ou auditoria enviados pelo cliente;
- listagens paginadas, filtros finitos, resumos e detalhes com agregados;
- início e conclusão de setor e finalização do inventário;
- conferência por número patrimonial com resultados correto, divergente,
  idempotente e já verificado em outro setor;
- correção estrita por retorno ao setor cadastrado ou transferência cadastral;
- snapshot do status patrimonial observado e referências opcionais ao empréstimo
  ou item de manutenção que justifique um bem não localizado;
- confirmação explícita para finalizar com correções pendentes;
- códigos públicos estáveis para transições e conflitos concorrentes.

**Consumidores afetados**

- módulo `inventarios` da API;
- Web e mobile somente em objetivos futuros, sem alteração nesta entrega.

**Critérios de aceite**

- [x] schema é a fonte de verdade e os tipos são derivados;
- [x] inputs não aceitam estado, datas, auditoria ou transferência criada pelo
      cliente;
- [x] cada transição possui contrato próprio e combinações inválidas falham no
      boundary quando independem do banco;
- [x] responses usam allowlist, paginação e agregados finitos;
- [x] idempotência, segunda conferência, correções e finalização com pendências
      possuem resultados discriminados;
- [x] API pública, lint, typecheck, testes e consumidores afetados passam.

Especificação aprovada:
[CONTRACTS-008](../tasks/CONTRACTS-008-contratos-inventarios.md).

### CONTRACTS-010 — Operações de baixas patrimoniais

**Status:** concluído

**Contexto**

`BAIXAS-001` precisa compartilhar o boundary multipart da baixa, a consulta do
registro histórico e a referência HTTP do comprovante sem expor Prisma, paths
ou decisões de filesystem. A operação é única por patrimônio e não possui
PATCH, DELETE ou estorno.

**Escopo**

- enum dos dez tipos de baixa aprovados em RF17;
- params UUID pelo patrimônio e dados de criação estritos;
- `dataBaixa` como `DateOnly`, `comissaoId` e `motivo` obrigatórios e
  `observacao` opcional, com textos normalizados e limitados a 2.000 caracteres;
- schema multipart com campo JSON `dados`, campo de arquivo opcional
  `documento`, um arquivo, um campo textual, duas partes e limite de 10 MiB;
- detalhe da baixa com patrimônio, comissão, tipo, data, motivo, observação,
  auditoria e `anexoUrl` anulável derivada do recurso;
- envelopes de criação e consulta e códigos públicos para baixa já existente,
  patrimônio não ativo, inventário aberto, comissão inválida e data futura;
- exports da feature e testes isolados e da API pública.

`TRANSFERENCIA` representa somente saída permanente do acervo e não conflita
com a movimentação interna entre setores. `RECLASSIFICACAO` representa
desincorporação contábil, enquanto `ERRO_REGISTRO` preserva o lançamento
indevido como histórico baixado. `OUTRO` continua exigindo motivo textual.

**Consumidores afetados**

- módulo `baixas` da API em `BAIXAS-001`;
- Web e mobile somente em objetivos futuros, sem implementação nesta entrega.

**Critérios de aceite**

- [x] schema é a fonte de verdade e os tipos são derivados de Zod 4;
- [x] input não aceita status, auditoria, chave de documento ou URL;
- [x] data inválida, enum inválido, texto vazio, excesso de tamanho e
      propriedades extras são rejeitados;
- [x] constantes multipart permitem limitar o parser antes de carregar o
      arquivo e a response nunca expõe paths;
- [x] API pública, limites, payload mínimo/completo e os dez tipos possuem
      testes;
- [x] lint, typecheck, testes e consumidores afetados passam.

Especificação aprovada:
[CONTRACTS-010](../tasks/CONTRACTS-010-contratos-baixas-patrimoniais.md).

### CONTRACTS-011 — Operações de depreciação patrimonial

**Status:** concluído

**Contexto**

`DEPRECIACOES-001` precisa compartilhar os boundaries da conferência prévia e
das execuções individual e em massa sem expor models Prisma nem permitir que o
cliente controle cálculos, auditoria ou situação contábil.

**Escopo**

- primitive de competência mensal canônica `AAAA-MM`, distinta de `DateOnly` e
  sem coerção para `Date` no boundary compartilhado;
- query paginada de pendentes com competência, página e limite finito;
- item de prévia com identidade patrimonial, status, valores contábeis,
  residual, vida útil restante, quota prevista e indicação de que atingirá o
  residual;
- resumo agregado da conferência, inclusive quantidade já no residual;
- body da execução em massa com `competencia`, `comissaoId` e confirmação
  para ignorar itens no residual, sem IDs ou quantidades de patrimônio;
- params UUID e body equivalente da execução individual, sem permitir que o
  mesmo body receba arrays;
- resposta discriminada da execução individual, com a depreciação criada ou o
  motivo de inelegibilidade, e resposta agregada da execução em massa, com
  quantidades processadas, inelegíveis por motivo e bens que atingiram o
  residual, sem coleção proporcional ao lote;
- valores monetários decimais serializados por string com até sete casas,
  `dataCompetencia` civil e `dataDepreciacao` como instante UTC;
- códigos públicos para competência não corrente, comissão inválida,
  confirmação do residual necessária e conflito concorrente.

As regras que comparam a competência ao relógio, consultam comissão,
classificam patrimônios ou calculam quotas pertencem a `DEPRECIACOES-001`, não
a refinements do contrato compartilhado.

**Consumidores afetados**

- novo módulo `depreciacoes` da API;
- Web e mobile somente em objetivos futuros, sem implementação nesta entrega.

**Critérios de aceite**

- [x] schemas são estritos e os tipos derivam de Zod 4;
- [x] cliente não informa valores calculados, status, auditoria, parâmetro ou
      nova situação contábil;
- [x] nenhuma operação aceita array ou quantidade arbitrária de patrimônios;
- [x] paginação e responses permanecem finitas e usam allowlists;
- [x] competência malformada, propriedades extras, confirmação inválida e
      decimais fora do contrato são rejeitados;
- [x] API pública, lint, typecheck, testes e consumidores afetados passam.

Concluído em 27 de outubro de 2026. O package passou em lint, typecheck e 115
testes; API, Web e mobile passaram no typecheck como consumidores dos exports.

Especificação aprovada:
[CONTRACTS-011](../tasks/CONTRACTS-011-contratos-depreciacoes-patrimoniais.md).

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

## CONTRACTS-013 — Contratos de manutenção

**Status:** implementado e verificado em 29/10/2026 (127 testes do pacote, tipos e lint).

Schemas e tipos de consulta, criação, orçamento, retorno e documentos de
manutenção, com limite de itens, versões e respostas públicas. API e Web
consomem os mesmos contratos. [Resultado](../tasks/CONTRACTS-013-contratos-manutencoes.md).

## CONTRACTS-012 — Contratos de movimentações

**Status:** implementado e verificado em 28/10/2026 (123 testes do package; consumidores verificados).

Schemas/tipos para consulta individual e confirmação atômica de até dez bens,
sem entidade de lote; comissão/motivo comuns, origem esperada, chave de
idempotência, filtros, erros por item e auxiliares por contexto/perfil.
[Especificação e verificações](../tasks/CONTRACTS-012-contratos-movimentacoes.md).

Executar antes de MOVIMENTACOES-001 e WEB-MOVIMENTACOES-001. A existência de
TransferenciaPatrimonio e de correções não comprova contratos gerais.
A regra B e a vigência de comissão nas transferências comuns estão aprovadas;
a avaliação de vigência nas correções é futura e não bloqueia este contrato.
