# Performance de banco de dados

## Escopo

Este documento cobre Prisma e PostgreSQL no monorepo. A meta é controlar
queries, conexões e volume de dados antes de aumentar infraestrutura.

## Métricas mínimas

| Métrica                           | O que revela                               |
| --------------------------------- | ------------------------------------------ |
| duração de query p50/p95/p99      | consultas comuns e caudas lentas           |
| queries por operação HTTP/job     | N+1 e trabalho duplicado                   |
| linhas lidas e retornadas         | over-fetching e scans desnecessários       |
| conexões em uso e disponíveis     | saturação do pool                          |
| espera e timeout do pool          | falta de capacidade ou queries longas      |
| transações abertas e duração      | locks e retenção de conexão                |
| tamanho e crescimento das tabelas | capacidade, manutenção e custo de consulta |
| uso de índices e scans            | compatibilidade entre índice e workload    |

Não registre parâmetros sensíveis ou SQL com dados pessoais em métricas. Logs
de query detalhados exigem redaction e política por ambiente.

## Prisma Client e pool

- Reutilize a instância compartilhada de `PrismaClient`; não crie uma por
  repository ou request.
- Cada processo ou réplica normalmente contribui com seu próprio pool.
- Planeje a soma aproximada:

```text
conexões da aplicação ≈ réplicas × processos por réplica × limite do pool
```

- Preserve conexões para migrations, observabilidade e tarefas administrativas.
- Não aumente o pool para esconder query lenta; isso pode apenas deslocar a
  saturação para o banco.
- Monitore espera e timeout antes de ajustar o limite.
- Em serverless ou alta multiplicação de instâncias, avalie pooler externo com
  base na topologia real.

## Queries e payload

- Selecione somente campos e relações usados pelo service e mapper.
- Evite N+1; confira o SQL e a quantidade de queries produzidas.
- Use operações em lote, como `createMany` e `updateMany`, quando preservarem a
  semântica.
- Paginação deve limitar o número de registros e usar ordenação determinística.
- Avalie cursor quando `skip` crescente se tornar caro ou instável.
- Agregações pertencem ao banco quando evitarem transferir grandes conjuntos
  para o Node.js sem necessidade.

## Índices e planos

Crie índices a partir de filtros, joins e ordenações observados. Índices aceleram
leitura, mas consomem armazenamento e aumentam custo de escrita; quantidade não
é sinônimo de performance.

Use `EXPLAIN` para inspecionar o plano e `EXPLAIN ANALYZE` em ambiente seguro
para comparar estimativas com execução real. `EXPLAIN ANALYZE` executa a
instrução: não o use inconscientemente em mutation ou produção.

Teste com volume representativo. Uma tabela mínima pode usar scan sequencial
corretamente e esconder o comportamento que aparecerá em produção.

## Transações

- Mantenha transações curtas.
- Não aguarde interação humana ou chamada externa dentro delas sem desenho
  específico.
- Defina isolamento a partir da consistência exigida, não por preferência.
- Meça duração, espera por lock e rollback.
- Dividir uma transação pode melhorar concorrência e quebrar atomicidade; essa
  decisão pertence à regra do sistema.

## Alterações de schema

- Avalie tempo de migration, locks e compatibilidade com versões em execução.
- Planeje índices grandes e mudanças que reescrevem tabela.
- Gere estatísticas adequadas após mudanças relevantes quando o banco não o
  fizer automaticamente.
- Verifique plano e métricas depois do deploy; migration aplicada não prova
  melhora de performance.
