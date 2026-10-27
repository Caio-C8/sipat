# `BAIXAS-001` — Registrar e consultar baixas patrimoniais

**Status:** `aprovada`

## Objetivo

Implementar banco e API para registrar uma única baixa irreversível por
patrimônio, alterar seu status para `BAIXADO`, consultar o registro e transmitir
o PDF comprobatório opcional de forma privada.

## Contexto e referências

- Roadmap: [BAIXAS-001](../roadmap.md#baixas-001--registrar-e-consultar-baixa-na-api).
- Contratos: [CONTRACTS-010](./CONTRACTS-010-contratos-baixas-patrimoniais.md).
- Dependências: [STORAGE-001](./STORAGE-001-armazenamento-local-documentos.md),
  [COMISSOES-001](./COMISSOES-001-gerenciar-comissoes.md),
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md) e
  [PATRIMONIOS-002](./PATRIMONIOS-002-consultar-patrimonios.md).
- Requisitos: [RF17](../requisitos-SIPAT.md#rf17-baixa-de-patrimônios),
  [UC17](../requisitos-SIPAT.md#uc17---baixar-patrimônio), RN04, RN05, RN11,
  RN15, RNF01, RNF05, RNF06, RNF08, RNF09 e RNF11.
- API: [índice](../apps/api/README.md),
  [repositories](../apps/api/repositories.md),
  [services](../apps/api/services.md),
  [controllers](../apps/api/controllers.md),
  [módulos](../apps/api/modules.md) e
  [workflow e testes](../apps/api/workflow-and-testing.md).
- Segurança: [decisões transversais](../security-and-access.md) e
  [segurança da API](../apps/api/security/README.md).
- Armazenamento: [documentos privados](../file-storage.md).
- Performance: [banco](../performance/database.md) e
  [API](../apps/api/performance.md).
- Referências oficiais: [transações do Prisma ORM](https://www.prisma.io/docs/orm/prisma-client/queries/transactions),
  [índices únicos do PostgreSQL](https://www.postgresql.org/docs/current/indexes-unique.html)
  e [streaming no NestJS](https://docs.nestjs.com/techniques/file-upload#streaming-files).

## Escopo

### Persistência

- alterar `TipoBaixa` no schema atual para os dez valores aprovados e criar uma
  migration nova, sem editar migrations já aplicadas;
- antes de substituir o enum, verificar se `baixas_patrimoniais` possui dados;
  não mapear silenciosamente `INVERSIBILIDADE`, `PERDA_FISICA` ou
  `AJUSTE_CONTABIL`; se houver valores legados, retornar ao planejador ou ao
  usuário para definir a migração de cada registro;
- representar `dataBaixa` como `@db.Date`; se houver timestamps legados com
  horário significativo, interromper a migração em vez de truncá-los sem
  decisão;
- garantir uma única baixa por patrimônio com unicidade em `patrimonioId`,
  mantendo as FKs restritivas e os índices exigidos pelas consultas reais;
- manter `comissaoId`, `createdById`, `motivo` e `tipo` obrigatórios e
  `observacao` e a chave lógica do PDF opcionais;
- tratar o valor persistido em `caminhoAnexoDocumento` como chave lógica relativa
  sob `uploads/baixas/`, nunca como caminho físico ou URL;
- preservar o trigger de `INVENTARIOS-002` que impede inserir baixa para bem em
  inventário não finalizado e traduzir sua constraint para conflito público;
- gerar o Prisma Client antes de compilar API e testes.

### API

- criar `apps/api/src/modules/baixas/` com DTOs Zod, controller, service,
  repository, types, mappers, module e testes, seguindo o corte existente;
- registrar `BaixasModule` no `AppModule` e importar `ComissoesModule`,
  `InventariosModule` e `ArmazenamentoDocumentosModule` somente pelos services
  ou portas que o módulo realmente consumir;
- expor somente para `DIRETOR_PATRIMONIO`:
  - `POST /api/patrimonios/:patrimonioId/baixa` em `multipart/form-data`;
  - `GET /api/patrimonios/:patrimonioId/baixa`;
  - `GET /api/patrimonios/:patrimonioId/baixa/anexo`;
- receber no multipart o campo textual `dados` e, opcionalmente, um único campo
  `documento`, aplicando os limites antes de carregar o PDF em memória;
- validar extensão `.pdf`, MIME `application/pdf`, assinatura `%PDF-` e tamanho
  máximo de 10 MiB, reutilizando infraestrutura sem acoplar o novo domínio ao
  utilitário específico de nota fiscal;
- rejeitar `dataBaixa` futura pela data civil do relógio do servidor e exigir
  comissão existente e vigente inclusivamente nessa data;
- usar `ComissoesService` para a pré-validação pública e, dentro da transação da
  baixa, adquirir lock de leitura sobre a comissão e revalidar sua vigência sem
  importar `ComissoesRepository`;
- na mesma transação curta, bloquear o patrimônio, exigir status `ATIVO`,
  verificar ausência de baixa, criar o registro e alterar o status para
  `BAIXADO`, derivando `createdById` da sessão;
- executar a pré-verificação da política de inventários para produzir erro
  estável e manter o trigger como defesa contra corrida entre a verificação e o
  insert;
- não realizar escrita de filesystem dentro da transação: preparar o arquivo
  pelo coordenador, persistir a chave na operação e compensar o arquivo se o
  banco falhar;
- incluir as chaves de `baixas_patrimoniais` na reconciliação de órfãos;
- mapear a consulta por patrimônio para a allowlist do contrato, derivando
  `anexoUrl` apenas quando existir documento;
- transmitir o PDF com `StreamableFile`, headers seguros e cache privado, sem
  aceitar chave do cliente nem revelar a chave persistida;
- não aplicar retry HTTP automático à mutation irreversível; quando a transação
  usar isolamento serializável, qualquer retry interno deve ser finito e
  limitado a conflitos seguros anteriores à confirmação da baixa.

## Fora do escopo

- editar ou excluir a baixa, reativar o patrimônio ou reutilizar seu número;
- substituir ou remover o PDF depois da baixa;
- baixa em lote;
- apuração administrativa, boletim de ocorrência, indenização ou workflow
  jurídico para furto, extravio e sinistro;
- transferência entre setores, alteração da espécie ou alteração da situação
  contábil fora da própria baixa;
- histórico patrimonial agregado, relatórios, Web e mobile.

## Decisões aprovadas

- a baixa é única, irreversível e preservada como histórico;
- somente patrimônio `ATIVO` e fora de inventário não finalizado pode ser
  baixado;
- toda baixa exige comissão vigente na `dataBaixa`;
- datas passadas são aceitas e data futura é rejeitada;
- motivo é obrigatório, observação é opcional e `OUTRO` não muda essa regra;
- o PDF é opcional, único, privado, imutável e limitado a 10 MiB;
- `TRANSFERENCIA` significa saída permanente do acervo, não movimentação entre
  setores;
- `RECLASSIFICACAO` e `ERRO_REGISTRO` não autorizam editar ou excluir o
  patrimônio original;
- somente o Diretor de Patrimônio acessa as três rotas desta entrega;
- a ausência de documento retorna `anexoUrl: null` e a rota de anexo responde
  sem revelar detalhes do filesystem.

## Matriz de acesso

| Rota                                             | Pública | Perfil               |
| ------------------------------------------------ | ------- | -------------------- |
| `POST /api/patrimonios/:patrimonioId/baixa`      | não     | `DIRETOR_PATRIMONIO` |
| `GET /api/patrimonios/:patrimonioId/baixa`       | não     | `DIRETOR_PATRIMONIO` |
| `GET /api/patrimonios/:patrimonioId/baixa/anexo` | não     | `DIRETOR_PATRIMONIO` |

A mutation usa a proteção CSRF global. Usuário anônimo recebe `401` e
`ADMINISTRADOR` recebe `403`.

## Critérios de aceite

- [ ] migration aplica desde banco vazio e sobre o estado anterior sem
      reescrever migrations ou converter dados legados ambiguamente;
- [ ] a criação só aceita patrimônio `ATIVO`, comissão vigente na data e data
      não futura;
- [ ] baixa e alteração de status são atômicas e derivam auditoria da sessão;
- [ ] duas requisições concorrentes produzem uma baixa, um status final
      `BAIXADO` e um conflito estável para a perdedora;
- [ ] patrimônio em inventário aberto é bloqueado pela policy e pela proteção
      do PostgreSQL, inclusive sob corrida;
- [ ] falha de validação ou banco não deixa baixa parcial nem arquivo órfão;
- [ ] consulta e download usam allowlist, streaming e headers seguros sem expor
      chave ou path;
- [ ] não existem rotas de PATCH, DELETE, estorno ou alteração de anexo;
- [ ] autorização, CSRF, limites multipart, erros públicos e auditoria possuem
      cobertura;
- [ ] documentação só muda o status para concluído após as verificações
      correspondentes.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma`;
- nova migration em `packages/database/prisma/migrations/`;
- `packages/database/src/index.ts` e `packages/database/src/types.ts` se os
  tipos gerados exigirem ajuste de exports;
- `packages/contracts/src/baixa-patrimonio/` entregue por `CONTRACTS-010`;
- `apps/api/src/modules/baixas/`;
- `apps/api/src/modules/inventarios/inventarios-policy.service.ts` e testes para
  a pré-verificação estável da baixa;
- `apps/api/src/modules/inventarios/inventarios.module.ts` somente se o service
  exportado precisar ser ajustado;
- `apps/api/src/common/storage/` e a reconciliação para incluir as referências
  de baixas, preservando a porta genérica;
- utilitário PDF comum extraído de
  `apps/api/src/common/utils/anexo-nota-fiscal.ts`, caso a reutilização confirme
  semântica idêntica; não faça o módulo de baixas importar utilitário nominal de
  nota fiscal;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E, multipart, streaming, filesystem e integração
  PostgreSQL do domínio;
- `docs/apps/api/README.md`, `docs/roadmap.md`, `docs/contracts/roadmap.md`,
  `docs/file-storage.md` e esta tarefa depois da verificação.

## Verificações esperadas

- `pnpm --filter @repo/database db:generate`;
- lint e typecheck de `@repo/database`;
- lint, typecheck e testes de `@repo/contracts`;
- lint, typecheck, testes e build de `@repo/api`;
- aplicar todas as migrations desde PostgreSQL vazio e sobre snapshot do estado
  anterior à migration;
- testes PostgreSQL reais para unicidade, lock do patrimônio, atomicidade,
  corrida de duas baixas e corrida com inventário aberto;
- E2E com Guards reais para `401`, `403`, CSRF, criação, consulta, limite
  multipart e streaming;
- testes de compensação e reconciliação em diretório temporário isolado;
- typecheck de Web e mobile apenas como consumidores dos exports, sem criar
  interfaces;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Se existirem registros em `baixas_patrimoniais` com os tipos antigos ou
  `data_baixa` com horário significativo, a implementação deve parar e pedir o
  mapeamento de migração; esta especificação não autoriza perda semântica.
