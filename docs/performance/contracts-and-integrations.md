# Performance de contratos e integrações

## Contratos como limite de custo

Contratos não existem apenas para tipagem. Eles limitam a quantidade de trabalho
que um consumidor pode solicitar e a quantidade de dados que o sistema promete
entregar.

Defina quando aplicável:

- tamanho mínimo e máximo de strings;
- quantidade máxima de elementos em arrays;
- página inicial, valor padrão e limite máximo de paginação;
- profundidade e campos permitidos de filtro e ordenação;
- quantidade, tipo e tamanho de arquivos;
- response resumida e detalhada como contratos distintos;
- campos opcionais caros somente quando a operação realmente os oferece.

Não crie um `max` universal sem contexto. Crie a capacidade reutilizável e
obrigue cada operação a escolher um limite finito coerente com seu custo.

Valide dados externos no boundary e reutilize o output validado. Repetir parse e
transformações profundas em várias camadas aumenta custo e pode alterar
semântica. Não remova validação de response ou segurança apenas por hipótese de
performance; meça antes.

## Integrações

Toda integração deve definir:

- timeout de conexão e de operação;
- cancelamento e propagação de abort quando suportado;
- retry apenas para falhas e operações seguras;
- idempotência de mutations que possam ser repetidas;
- limite de concorrência;
- paginação, streaming ou processamento em lote;
- cache, validade e invalidação;
- tamanho máximo de request e response;
- comportamento de degradação e indisponibilidade.

Evite waterfalls quando operações forem independentes. Evite também disparar
fan-out ilimitado com `Promise.all` sobre entrada do usuário.

## Métricas mínimas por integração

| Métrica                   | Observação                                    |
| ------------------------- | --------------------------------------------- |
| duração p50/p95/p99       | por operação e dependência                    |
| volume e concorrência     | requests, mensagens, itens ou bytes           |
| erros por categoria       | HTTP, timeout, cancelamento, parse e contrato |
| retries                   | tentativas e sucesso posterior                |
| tamanho de payload        | entrada e saída                               |
| cache hit/miss            | somente quando houver cache                   |
| tempo em cada dependência | separa rede, API, banco, fila e processamento |

Não use IDs, URLs completas, query strings, tokens ou dados pessoais como labels.

## Web, mobile e outros runtimes

Não replique automaticamente cache, autenticação ou timeout do navegador em um
app mobile, worker ou integração entre serviços. Os sinais transversais são os
mesmos, mas conectividade, ciclo de vida e tolerância a latência mudam.
