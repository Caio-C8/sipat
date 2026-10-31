# Desenvolvimento da API

Este diretório documenta o padrão de desenvolvimento da aplicação NestJS
`apps/api` para pessoas e agentes.

## Objetivo

A API é organizada em módulos por domínio. Cada camada possui uma
responsabilidade clara:

```text
requisição HTTP
      ↓
DTO + validação Zod
      ↓
controller
      ↓
service
      ↓
repository
      ↓
Prisma
```

O retorno percorre o caminho inverso e é convertido para o contrato HTTP por um
mapper antes de sair do controller.

Segurança e performance participam desse fluxo desde os contratos e queries até
a resposta e a observabilidade; não são revisões executadas somente ao final.

## Estado atual do SIPAT

No estado atual:

- `SEED-GERAL-001` fornece um comando Nest standalone opt-in para development e
  staging, cria a massa sintética pelos services da API, grava PDFs pelo storage
  privado e audita o estado final; production, test, migrations incompatíveis e
  banco não vazio são recusados;

- `MovimentacoesModule` lista/consulta transferências individuais, confirma de 1 a 10
  atomicamente e oferece auxiliares por contexto. Somente diretor registra; ambos
  consultam. Idempotência persistente, política B e concorrência foram verificadas
  em PostgreSQL isolado; ver [MOVIMENTACOES-001](../../tasks/MOVIMENTACOES-001-transferir-consultar-patrimonios.md).

- `ManutencoesModule` lista pedidos, itens, orçamentos e documentos, oferece
  seletores específicos e permite criação, revisão de orçamento, retorno por
  item e PDF privado para Administrador e Diretor. A migration foi testada com
  dados legados fictícios, e o fluxo HTTP/Web foi verificado em PostgreSQL
  descartável; ver [MANUTENCOES-001](../../tasks/MANUTENCOES-001-api-persistencia-manutencoes.md).

- `ReavaliacoesModule` oferece prévia, confirmação atômica, histórico e
  consulta. Os testes de API e PostgreSQL isolado passaram; a data de
  referência é limitada ao mês corrente até hoje; ver
  [REAVALIACOES-001](../../tasks/REAVALIACOES-001-api-persistencia-reavaliacoes.md).

- `EmprestimosModule` oferece duas opções paginadas, listagem, detalhe, saída e
  devolução parcial. Somente o Diretor registra; o Administrador também consulta.
  Idempotência, concorrência, inventário e cronologia foram verificados no
  PostgreSQL isolado; ver [EMPRESTIMOS-001](../../tasks/EMPRESTIMOS-001-api-persistencia-emprestimos.md).

- a API expõe `GET /api/health`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/me`,
  `POST /api/auth/alterar-senha`, `POST /api/auth/esqueceu-senha`,
  `POST /api/auth/redefinir-senha`, as cinco rotas protegidas de `/api/usuarios`,
  as cinco rotas administrativas de `/api/responsaveis`, as quatro rotas
  administrativas de `/api/naturezas`, as quatro rotas de `/api/especies`, as
  cinco rotas de `/api/setores`, as cinco
  rotas administrativas de `/api/fornecedores` e
  `GET /api/patrimonios`, `GET /api/patrimonios/:patrimonioId` e
  `POST /api/patrimonios` e
  `POST /api/patrimonios/:patrimonioId/substituicoes-numero`, além de
  `GET /api/processos-compra`, `GET /api/processos-compra/:processoCompraId`,
  `POST /api/processos-compra` multipart e
  `PATCH /api/processos-compra/:processoCompraId`, além das rotas de listagem,
  detalhe, criação e alteração em `/api/notas-fiscais` e de inclusão,
  substituição, remoção e streaming em
  `/api/notas-fiscais/:notaFiscalId/anexo`, além das quatro operações de
  comissão em `/api/comissoes` e das três mutações de integrantes em
  `/api/comissoes/:comissaoId/membros`, além de criação, listagem, detalhe,
  setores e itens paginados em `/api/inventarios` e das cinco mutações para
  iniciar/concluir setor, verificar/corrigir item e finalizar inventário;
- `AuthModule` registra autenticação, autorização e CSRF como Guards globais,
  nessa ordem;
- rotas não públicas exigem sessão válida e declaração de perfis; a ausência de
  perfis nega acesso;
- a sessão é consultada pelo hash SHA-256 do token e a identidade anexada à
  request contém somente `id`, `nome`, `email`, `perfil` e
  `trocaSenhaObrigatoria`, carregado da fonte persistente no usuário;
- `UsuariosModule` separa DTOs Zod, controller, service, repository, tipos e
  mappers; somente `ADMINISTRADOR` acessa suas rotas;
- `ResponsaveisModule` segue o mesmo corte por camadas, restringe as cinco
  operações ao `ADMINISTRADOR`, garante matrícula única no banco e inativa sem
  excluir nem romper vínculos existentes;
- `NaturezasModule` restringe cadastro, consulta, listagem e alteração ao
  `ADMINISTRADOR`, deriva nome normalizado e auditoria no servidor e preserva
  espécies vinculadas durante alterações;
- `EspeciesModule` permite consulta e listagem aos dois perfis, restringe
  cadastro e alteração ao `ADMINISTRADOR`, exige uma natureza existente, deriva
  normalização e auditoria no servidor e preserva patrimônios vinculados ao
  alterar sua natureza;
- `SetoresModule` permite consulta e listagem aos dois perfis, restringe
  cadastro, alteração e mudança de situação ao `ADMINISTRADOR`, exige
  responsável ativo em novos vínculos, deriva auditoria da sessão e inativa sem
  excluir nem romper vínculos;
- `FornecedoresModule` restringe cadastro, consulta, listagem, alteração e
  mudança de situação ao `ADMINISTRADOR`, normaliza CNPJ e contato, protege a
  unicidade sob concorrência e inativa sem excluir nem romper vínculos;
- `ComissoesModule` restringe todas as rotas ao `ADMINISTRADOR`, cria comissão
  e composição atomicamente, limita integrantes ativos, garante presidente
  único no PostgreSQL e congela ato, vigência e composição após o primeiro uso
  patrimonial;
- `InventariosModule` permite a `ADMINISTRADOR` e `DIRETOR_PATRIMONIO` as
  quatro consultas de inventários e restringe criação e as cinco mutações ao
  `DIRETOR_PATRIMONIO`; valida comissão vigente, materializa setores ativos e
  patrimônios `ATIVO`, consulta progresso em lote e executa início, conferência
  idempotente, correção, conclusão e finalização em transações serializáveis;
- `BaixasModule` restringe criação, consulta e download ao
  `DIRETOR_PATRIMONIO`, registra baixa e status `BAIXADO` atomicamente com locks
  de patrimônio e comissão e mantém policy e trigger contra inventário aberto;
- `DepreciacoesModule` restringe consulta e execução ao
  `DIRETOR_PATRIMONIO`, revalida competência e comissão, serializa execuções
  individuais e em massa e atualiza situação e histórico em lote;
- a conferência preserva o snapshot cadastral, diferencia ausência por
  empréstimo ou manutenção vigente, cria transferência somente na correção
  cadastral e mantém o fato histórico da divergência; itens encontrados fora do
  setor esperado são consultáveis nos dois setores sem duplicação, enquanto
  bens já consolidados como não localizados geram uma localização posterior
  separada;
- `InventariosPolicyService` bloqueia a inativação de setor participante até a
  finalização; triggers de banco fecham a corrida desse bloqueio e impedem a
  baixa de patrimônio incluído em inventário aberto;
- `PatrimoniosModule` aplica o mesmo corte por camadas; somente
  `DIRETOR_PATRIMONIO` cria, os dois perfis consultam, e a API deriva numeração,
  status, normalização, situação contábil e auditoria dentro de uma transação;
  toda criação exige e persiste o parâmetro inicial de depreciação, que somente
  poderá ser substituído futuramente por reavaliação;
- `ProcessosCompraModule` permite aos dois perfis criar, listar, consultar e
  alterar processos; a criação recebe até 20 notas e PDFs, valida fornecedores
  ativos, assinatura dos documentos e persiste notas e auditoria na mesma
  transação, com compensação dos arquivos em falhas;
- `NotasFiscaisModule` permite aos dois perfis criar, listar, consultar e
  alterar notas e gerenciar o PDF privado; substituições atualizam a referência
  antes da remoção física, conflitos são compensados e o download usa streaming
  sem revelar a chave persistida;
- a substituição do número oficial usa o número atual como precondição
  otimista, gera o novo valor pela sequence oficial e atualiza o mesmo patrimônio
  com histórico auditável na mesma transação;
- a consulta patrimonial usa paginação finita, busca textual normalizada ou
  número patrimonial exato, filtros, seleção mínima, ordenação determinística e
  relações atuais de setor, responsável, espécie e natureza;
- a listagem de usuários usa paginação finita, busca e filtros com seleção
  mínima e ordenação determinística; sua criação usa Argon2id e auditoria
  derivada da sessão;
- inativação é atômica com a revogação de sessões e protege autoinativação e o
  último administrador ativo;
- login, logout e `/auth/me` usam contratos Zod, cookie `HttpOnly`, sessão opaca
  revogável e rate limit persistente;
- `/auth/mobile` implementa login, refresh rotativo, identidade, primeiro
  acesso e logout com access e refresh opacos; somente hashes são persistidos,
  replay revoga a família e responses com tokens usam `no-store`;
- sessões Web e mobile compartilham duração absoluta, inatividade, perfil atual,
  revogação e o limite global de cinco famílias por usuário;
- `AUTH-004` persiste a troca obrigatória da senha inicial, restringe sessões
  pendentes a `/auth/me`, conclusão e logout e conclui o fluxo com atualização
  atômica da senha e rotação do cookie;
- alteração da própria senha exige a senha atual, usa limite persistente por
  escopo, troca o hash e revoga todas as sessões atomicamente e expira o cookie;
- recuperação usa response neutra, token aleatório armazenado somente por hash,
  uso único, validade de 15 minutos, SMTP desacoplado e revogação atômica das
  sessões; a solicitação pública é a única mutation Web/nativa isenta de CSRF,
  sem cookie ou sessão, enquanto redefinição e demais mutations mantêm Origin e
  header; fora de desenvolvimento, permanece desligada por flag até haver
  consumidor HTTPS e SMTP;
- a duração absoluta é 8 horas, a inatividade efetiva fica entre
  aproximadamente 25 e 30 minutos e no máximo cinco sessões ficam ativas por
  usuário;
- o trabalho Argon2 possui concorrência e fila finitas configuradas por
  ambiente;
- `apps/api` usa Zod 4 e `nestjs-zod` 5;
- `ZodValidationPipe` e `ZodSerializerInterceptor` estão registrados
  globalmente;
- o filtro de exceções produz o formato definido por `RespostaErroSchema`;
- o middleware de request ID cria um UUID por requisição, devolve
  `X-Request-Id` e o inclui nas respostas de erro;
- CORS usa a allowlist de `CORS_ORIGINS`, não aceita credenciais, permite o
  header `X-SIPAT-CSRF` e expõe somente `X-Request-Id` ao navegador;
- `DatabaseModule` cria, exporta e encerra um único Prisma Client quando um
  módulo consumidor o importa;
- `ArmazenamentoDocumentosModule` valida a raiz na inicialização e exporta uma
  porta de filesystem local com staging, compensação e reconciliação;
- `AuthModule`, `UsuariosModule`, `ResponsaveisModule`, `SetoresModule`,
  `FornecedoresModule`, `ComissoesModule`, `InventariosModule`, `BaixasModule`,
  `DepreciacoesModule`, `PatrimoniosModule`, `ProcessosCompraModule` e
  `NotasFiscaisModule` importam `DatabaseModule`;
  `AppModule` não acessa o client diretamente;
- `SessaoUsuario.lastActivityAt` sustenta inatividade e `TentativaLogin`
  persiste o rate limit com expiração e limpeza em lotes;
- testes unitários e E2E cobrem infraestrutura, Guards reais e as operações de
  usuários, responsáveis, autenticação, cadastro patrimonial, inventários,
  baixas e depreciações, incluindo `401`, `403`, `429`, CSRF, conflitos, regras administrativas
  e corridas reais no PostgreSQL.

Os exemplos desta documentação representam o padrão desejado, não código já
implementado no SIPAT.

## Pré-requisitos para um módulo

Antes de desenvolver rotas de um domínio:

1. confirme que os schemas de request e response existem em
   `@repo/contracts`;
2. confirme que os tipos de input e output foram derivados desses schemas;
3. confirme que o model e os tipos necessários existem no Prisma;
4. confirme que o Prisma Client foi gerado;
5. confirme que `DatabaseModule` pode ser importado pelo módulo do domínio;
6. confirme que os controles de acesso e limites da rota foram decididos.

Se os contratos ainda não existirem, interrompa a implementação do módulo. Não
crie silenciosamente contratos ou semânticas de campos para desbloquear a API.

## Documentos

| Assunto                                  | Documento                                            |
| ---------------------------------------- | ---------------------------------------------------- |
| Estrutura, fluxo e limites entre camadas | [Arquitetura](./architecture.md)                     |
| DTOs e validação de entrada              | [DTOs](./dtos.md)                                    |
| Tipos Prisma e mapeamento de resposta    | [Tipos e mappers](./types-and-mappers.md)            |
| Acesso ao banco                          | [Repositories](./repositories.md)                    |
| Regras de negócio e orquestração         | [Services](./services.md)                            |
| Rotas e respostas HTTP                   | [Controllers](./controllers.md)                      |
| Composição e dependências de módulos     | [Módulos](./modules.md)                              |
| Posicionamento de funções utilitárias    | [Utilitários](./utilities.md)                        |
| Ordem de implementação e testes          | [Workflow e testes](./workflow-and-testing.md)       |
| Políticas e validações de segurança      | [Segurança](./security/README.md)                    |
| Roadmap transversal inicial              | [Roadmap do SIPAT](../../roadmap.md)                 |
| Identidade, sessão e controle de acesso  | [Decisão do SIPAT](../../security-and-access.md)     |
| Limites, métricas e eficiência           | [Performance](./performance.md)                      |
| Guards, Interceptors, Filters e Pipes    | [Ciclo da requisição](./request-lifecycle/README.md) |
| Documentações oficiais                   | [Referências](./references.md)                       |

Assuntos que definem a comunicação entre API e consumidores devem ser
documentados também em [Integrações](../../integrations/README.md). Contratos
compartilhados seguem as regras de
[docs/contracts](../../contracts/README.md).

## Decisões pendentes por projeto

Esta estrutura não escolhe antecipadamente políticas que dependem da aplicação.
Antes de implementar recursos relacionados, documente:

- parâmetros operacionais e decisões abertas de autenticação listados em
  [Identidade, sessão e controle de acesso](../../security-and-access.md);
- catálogo de erros e exceptions de domínio;
- formato e limites de paginação;
- limites e propagação de transações;
- logging, observabilidade e dados sensíveis;
- metas e alertas de performance para fluxos críticos;
- versionamento da API e geração de OpenAPI.

Quando uma decisão afetar consumidores, registre-a também em
[Integrações](../../integrations/README.md) e, se mudar formatos compartilhados,
em [Contratos](../../contracts/README.md).

O armazenamento local e a entrega privada de documentos já possuem decisão
aprovada em [Armazenamento local de documentos](../../file-storage.md).
`STORAGE-001` entregou a infraestrutura local, `CONTRACTS-006` entregou os
contratos compartilhados e `NOTAS-FISCAIS-001` entregou o fluxo complementar de
notas e anexos. A implementação de `COMPRAS-001` permanece em validação.
