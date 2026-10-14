# Performance do sistema

## Objetivo

Performance é requisito de arquitetura, implementação, teste e operação. Este
diretório define um baseline reutilizável para qualquer projeto derivado sem
inventar metas numéricas que dependem do produto, da infraestrutura, do volume
de dados ou do perfil dos usuários.

O objetivo não é otimizar tudo antecipadamente. É impedir crescimento sem
limites, medir os caminhos relevantes, localizar gargalos e exigir evidência
antes e depois de uma otimização.

## Princípios

- Meça antes de otimizar e compare o mesmo cenário depois da mudança.
- Observe distribuições e percentis; média isolada esconde caudas lentas.
- Defina limites de entrada, saída e concorrência antes de receber carga real.
- Evite trabalho, dados e dependências desnecessários antes de trocar tecnologia.
- Não use cache sem definir escopo, validade, invalidação e isolamento.
- Não melhore um componente transferindo custo descontrolado para outro.
- Teste com volume e concorrência representativos; dados mínimos ocultam
  problemas de paginação, índices e memória.
- Registre regressões conhecidas e a evidência que justificou aceitá-las.

## Métricas transversais obrigatórias

As métricas abaixo permanecem relevantes independentemente do domínio. Nem todo
componente expõe todas elas, mas todo caminho crítico deve permitir responder a
essas perguntas.

| Sinal        | Medir                                                     | Por que é universal                      |
| ------------ | --------------------------------------------------------- | ---------------------------------------- |
| Duração      | p50, p95 e p99 da operação                                | mostra experiência comum e caudas lentas |
| Volume       | operações, requests, jobs ou bytes por intervalo          | contextualiza custo e capacidade         |
| Falhas       | erros, timeouts e cancelamentos por categoria             | diferencia lentidão de indisponibilidade |
| Saturação    | CPU, memória, event loop, pool, fila ou conexões          | revela proximidade do limite do recurso  |
| Dados        | bytes e quantidade de itens lidos, processados e enviados | expõe trabalho e payload sem limite      |
| Dependências | duração e falhas de banco, API externa, cache e fila      | localiza onde o tempo foi consumido      |
| Mudança      | comparação antes/depois por versão ou deploy              | detecta regressão e relaciona causa      |

Use nomes de rota e operação normalizados. Não use URL bruta, query, ID de
usuário, token ou outro valor de alta cardinalidade ou sensível como label de
métrica.

Métricas mostram tendência e alerta; logs explicam eventos específicos; traces
mostram a composição de uma operação distribuída. Nenhum deles substitui os
outros.

## Metas e orçamento

A estrutura padrão não define um p95 universal para a API, tamanho máximo de
upload, limite de paginação ou número de conexões. Esses valores dependem do
projeto e devem ser registrados antes de produção.

Use uma tabela por fluxo crítico:

| Indicador            | Meta | Alerta | Ambiente e cenário | Fonte de medição |
| -------------------- | ---- | ------ | ------------------ | ---------------- |
| duração p95          | TBD  | TBD    | TBD                | TBD              |
| taxa de falha        | TBD  | TBD    | TBD                | TBD              |
| volume esperado      | TBD  | TBD    | TBD                | TBD              |
| saturação do gargalo | TBD  | TBD    | TBD                | TBD              |
| tamanho de payload   | TBD  | TBD    | TBD                | TBD              |

`TBD` não é uma meta válida para liberar produção. Ele é apenas o marcador da
estrutura padrão até o contexto do projeto existir.

Os Core Web Vitals são a exceção útil: possuem limites públicos para classificar
experiência web e formam um baseline inicial. O projeto ainda pode adotar metas
mais restritas.

## Ambientes e comparação

- Desenvolvimento serve para encontrar trabalho duplicado e regressões óbvias,
  não para afirmar capacidade de produção.
- Homologação deve se aproximar da topologia, configuração e volume relevantes.
- Produção fornece comportamento real e precisa de métricas sem dados sensíveis.
- Benchmarks devem registrar hardware, versão, configuração, massa de dados,
  concorrência, duração, warm-up e percentis.
- Compare sempre cenários equivalentes e preserve o resultado que fundamentou a
  decisão.

## Documentos por camada

| Camada                          | Documento                                                  |
| ------------------------------- | ---------------------------------------------------------- |
| Aplicação web                   | [Performance web](../apps/web/performance.md)              |
| API NestJS                      | [Performance da API](../apps/api/performance.md)           |
| Prisma e PostgreSQL             | [Banco de dados](./database.md)                            |
| Contratos e integrações         | [Contratos e integrações](./contracts-and-integrations.md) |
| Runtime, containers, CI e build | [Operação e build](./operations-and-build.md)              |

## Fontes

- [Google: limites dos Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Node.js: não bloquear Event Loop e Worker Pool](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [NestJS: performance e Fastify](https://docs.nestjs.com/techniques/performance)
- [NestJS: compressão](https://docs.nestjs.com/techniques/compression)
- [Prisma: otimização de queries](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [Prisma: connection pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)
- [PostgreSQL: `EXPLAIN`](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: índices](https://www.postgresql.org/docs/current/indexes.html)
