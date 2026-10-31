# IDEMPOTENCIA-001 — API e persistência de operações críticas

**Status:** aprovada

## Objetivo

Impedir que reenvios, duplo clique, timeout ou concorrência criem registros ou
efeitos duplicados nas mutações de risco, usando a proteção mais barata que
preserve a coerência de cada entidade.

## Contexto e referências

- [CONTRACTS-016](./CONTRACTS-016-idempotencia-operacoes-criticas.md)
- [Requisitos do SIPAT](../requisitos-SIPAT.md)
- [Roadmap geral](../roadmap.md#idempotencia-de-operacoes-criticas)
- [API](../apps/api/README.md)
- [Workflow e testes da API](../apps/api/workflow-and-testing.md)
- [Performance do banco](../performance/database.md)
- Implementações existentes:
  [MOVIMENTACOES-001](./MOVIMENTACOES-001-transferir-consultar-patrimonios.md),
  [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md),
  [REAVALIACOES-001](./REAVALIACOES-001-api-persistencia-reavaliacoes.md) e
  [EMPRESTIMOS-001](./EMPRESTIMOS-001-api-persistencia-emprestimos.md).

## Pré-condição obrigatória

Antes de editar o schema, o implementador deve executar `prisma migrate status`
e `prisma migrate diff` contra o banco de desenvolvimento escolhido. Em
31/10/2026, `localhost:5432/sipat_db_development` possuía as 24 migrations e
nenhuma diferença em relação a `schema.prisma`.

Uma migration pendente deve ser aplicada ou investigada; não se cria outra
migration para compensá-la. Uma diferença causada somente por model Prisma
incorreto deve ser corrigida no schema antes de gerar migration.

## Matriz de proteção aprovada

| Operação                                                                                     | Proteção                                                      | Persistência adicional                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Movimentar patrimônios; confirmar reavaliações; registrar saída/devolução de empréstimo      | chave técnica mínima por usuário, operação e hash             | reduzir as tabelas existentes; remover `resultado` JSON            |
| Criar manutenção; registrar retorno; anexar documento de manutenção                          | chave técnica mínima e referências de domínio já existentes   | reduzir `IdempotenciaManutencao`; remover `resultado` JSON         |
| Criar patrimônio, inventário, processo de compra, nota fiscal, comissão, setor ou fornecedor | `chaveCriacao` e `hashCriacao` no próprio registro raiz       | colunas nullable para legado e unicidade por `createdById` + chave |
| Baixar patrimônio                                                                            | estado `ATIVO`, lock e `BaixaPatrimonio.patrimonioId @unique` | nenhuma                                                            |
| Depreciar patrimônio                                                                         | competência, parâmetro, lock e unicidade existente            | nenhuma                                                            |
| Substituir número patrimonial                                                                | número atual como precondição otimista                        | nenhuma                                                            |
| Iniciar/concluir/finalizar inventário; conferir/corrigir item                                | máquina de estados e unicidades existentes                    | nenhuma                                                            |
| Atualizar orçamento de manutenção                                                            | `versaoEsperada` e versão única por item                      | nenhuma                                                            |
| Adicionar membro de comissão                                                                 | unicidade comissão + responsável e presidente único           | nenhuma                                                            |
| Criar usuário, responsável, natureza ou espécie                                              | e-mail, matrícula ou nome normalizado únicos                  | nenhuma                                                            |
| Atualizações dirigidas a um recurso, situação e anexo substituível                           | estado atual e precondições concorrentes existentes           | nenhuma idempotência genérica                                      |
| Login, refresh, recuperação e troca de senha                                                 | tokens, uso único, rotação e regras de segurança próprias     | não aplicar esta política                                          |

Fornecedor entra na proteção porque CNPJ é opcional; setor e comissão não
possuem identidade natural obrigatória. Nas demais entidades da terceira linha,
uma repetição pode criar numeração nova, snapshot volumoso, notas/arquivos ou
opções ambíguas para operações futuras.

## Escopo

### Persistência mínima

- Remover snapshots JSON de resposta das quatro tabelas técnicas atuais.
- Conservar somente usuário, chave, tipo da operação, hash canônico, instante e
  referências estritamente necessárias para integridade.
- Para criações de um único agregado, gravar chave e hash no recurso raiz e
  criar unicidade composta com `createdById`.
- Manter colunas novas opcionais para registros legados, seed e backfills; a API
  passa a exigi-las em novas requisições pelos contratos.
- Criar no máximo uma migration descritiva para essas mudanças depois da
  pré-condição. Não renomear migrations aplicadas.

### Execução e concorrência

- Calcular hash determinístico depois da validação e normalização. Ordenar
  propriedades de objetos; preservar ordem somente quando ela for semântica;
  normalizar UUIDs; incluir hashes dos arquivos multipart.
- Adquirir lock transacional por usuário + chave antes de consultar ou executar
  o efeito. Não usar estado em memória.
- Na mesma transação: verificar chave, revalidar regras, executar o efeito e
  persistir a proteção. Rollback remove ambos.
- Mesma chave/operação/hash já confirmados retorna
  `409 OPERACAO_JA_PROCESSADA`; não consulta nem serializa a response antiga.
- Mesma chave com operação ou hash distintos retorna
  `409 CHAVE_IDEMPOTENCIA_REUTILIZADA`.
- Lock não obtido retorna `409 OPERACAO_EM_PROCESSAMENTO` sem esperar de forma
  indefinida.
- Preservar transações, locks de domínio, compensação de arquivos e retries
  internos finitos já existentes.
- Compartilhar apenas funções puras de canonicalização, hash e construção de
  conflitos. Repositories continuam responsáveis pelas operações Prisma e os
  services pelas regras; não criar decorator ou interceptor.

### Retenção e exclusão

- Registros mínimos bem-sucedidos não expiram automaticamente. Eles são parte
  da garantia de integridade, não logs de requisição.
- Não criar cron, TTL, deleção probabilística na request, JSON de auditoria ou
  endpoint administrativo de limpeza.
- Chaves gravadas no recurso seguem a retenção do próprio recurso.
- Registros técnicos somente podem ser removidos em uma futura política de
  retenção que também elimine ou torne irrecuperáveis os fatos de domínio
  protegidos. A remoção isolada deve ser recusada/documentada porque permitiria
  executar novamente uma chave antiga.
- Desenvolvimento e testes podem limpar o conjunto ao recriar o banco
  descartável. Produção não deve usar `VACUUM FULL` ou exclusão manual como
  rotina desta funcionalidade.
- Medir contagem e tamanho das tabelas com consultas operacionais agregadas,
  sem logar chaves. Uma futura limpeza por prazo exige nova decisão explícita e
  deverá declarar que a garantia passa a valer apenas dentro desse prazo.

## Fora do escopo

- Exactly-once global: uma nova chave continua representando um novo pedido.
- Deduplicação por comparação aproximada de nomes, datas ou valores.
- Retry automático de mutation, fila offline ou alteração de rota.
- Tabelas genéricas globais de requests, armazenamento de response, body ou
  erro, e observabilidade individual de chaves.
- Novas regras de exclusão ou estorno das entidades de domínio.

## Critérios de aceite

- [ ] Banco e migrations são reconfirmados antes da alteração; a migration
      proposta corresponde somente ao diff aprovado.
- [ ] Reenvio sequencial, simultâneo e após reinício cria no máximo um efeito e
      retorna o conflito explícito correto.
- [ ] Chave igual com payload diferente nunca executa o segundo pedido.
- [ ] Falha e rollback não deixam chave, recurso, histórico ou arquivo parcial.
- [ ] Nenhuma tabela nova armazena body, response ou erro em JSON.
- [ ] Operações da matriz sem persistência adicional continuam protegidas pelos
      invariantes reais, com testes que comprovam a decisão.
- [ ] Seeds geram chave quando chamarem contratos novos, sem transformar a
      migration em carga inicial.
- [ ] PostgreSQL isolado comprova unicidade, concorrência, rollback e plano dos
      índices; banco de desenvolvimento não é usado para testes destrutivos.
- [ ] Documentos antigos que descrevem replay permanecem como evidência
      histórica, mas roadmaps e documentação de estado apontam para a nova
      política após a implementação.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/`
- `apps/api/src/common/utils/` — somente funções puras compartilhadas
- `apps/api/src/modules/movimentacoes/`
- `apps/api/src/modules/manutencoes/`
- `apps/api/src/modules/reavaliacoes/`
- `apps/api/src/modules/emprestimos/`
- `apps/api/src/modules/patrimonios/`
- `apps/api/src/modules/inventarios/`
- `apps/api/src/modules/processos-compra/`
- `apps/api/src/modules/notas-fiscais/`
- `apps/api/src/modules/comissoes/`
- `apps/api/src/modules/setores/`
- `apps/api/src/modules/fornecedores/`
- `apps/api/src/commands/seed-geral/`
- testes unitários, E2E e PostgreSQL dos módulos acima

## Ordem de implementação

1. Confirmar `CONTRACTS-016`, migrations, diff e consumidores.
2. Criar utilitários puros e testes de canonicalização/hash.
3. Ajustar o schema e gerar uma única migration mínima; revisar SQL antes de
   aplicar em banco descartável.
4. Converter as quatro implementações existentes de replay para conflito sem
   JSON, preservando locks e transações.
5. Proteger as sete criações no próprio agregado, começando por patrimônio,
   inventário e processos/notas, depois comissão, setor e fornecedor.
6. Atualizar seed, testes e documentação de estado.
7. Liberar adaptações Web e mobile somente após contratos/API estarem
   verificadas.

## Verificações esperadas

- `pnpm --filter @repo/database db:generate`
- Lint e typecheck de banco, contratos e API.
- Testes unitários e E2E afetados, inclusive Guards/CSRF.
- Testes PostgreSQL isolados de concorrência, rollback, restart e multipart.
- Builds de API e consumidores; `pnpm format:check`.
- `prisma migrate status` e `prisma migrate diff` após aplicar a migration em
  banco descartável.

## Pendências ou decisões bloqueantes

- Nenhuma.
