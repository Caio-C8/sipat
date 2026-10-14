# Performance da API

## Responsabilidade

A API deve limitar trabalho por requisição, medir seus caminhos críticos e
preservar capacidade sob concorrência. Performance participa do desenho da rota
e não deve ser tratada apenas depois de um incidente.

Siga também o [baseline transversal](../../performance/README.md).

## Métricas mínimas

Registre por operação e rota normalizada, sem IDs ou query strings como labels:

| Métrica                     | Recortes úteis                                |
| --------------------------- | --------------------------------------------- |
| duração da request          | p50, p95, p99, método, rota e status          |
| volume                      | requests por intervalo e rota                 |
| falhas                      | `4xx`, `5xx`, timeout, cancelamento e `429`   |
| requests em andamento       | total e por operação crítica                  |
| tamanho de request/response | bytes e itens retornados                      |
| event loop lag              | processo e instância                          |
| CPU e memória               | processo, container e instância               |
| dependências                | duração e falhas de banco e serviços externos |

`4xx` não deve ser somado indiscriminadamente como falha interna. Validação,
autenticação, autorização, conflito e rate limit possuem causas diferentes.

## Controller e boundary

- Limite body, arrays, strings, filtros, paginação e uploads nos contratos.
- Rejeite entrada excessiva antes de executar regra ou query cara.
- Não carregue, serialize ou registre o body completo sem necessidade.
- Retorne somente campos previstos no contrato e evite payloads redundantes.
- Use streaming quando um arquivo grande não precisar permanecer inteiro em
  memória.

## Service e processamento

- Execute em paralelo somente operações independentes.
- Considere a capacidade do pool e do serviço externo antes de usar
  `Promise.all` sobre coleções ou entrada não limitada.
- Limite concorrência em fan-out, importações e chamadas externas.
- Defina timeout e cancelamento para dependências.
- Não aplique retry automático a mutations sem idempotência.
- Envie processamento longo ou intensivo em CPU para fila, worker ou processo
  apropriado quando não precisar concluir na request.
- Evite filesystem, criptografia, compressão ou loops síncronos no caminho da
  request. Node.js perde throughput quando o Event Loop fica bloqueado.

## Repository e banco

- Use `select` ou payload específico quando o model completo não for necessário.
- Carregue relações somente quando o contrato e a regra exigirem.
- Evite N+1 e conte queries por request em caminhos importantes.
- Toda listagem potencialmente grande deve ter paginação e limite máximo.
- Avalie paginação por cursor para conjuntos grandes e mutáveis.
- Crie índices a partir das queries reais e confirme o plano no banco.
- Mantenha transações curtas e não faça chamadas de rede dentro delas sem uma
  decisão explícita.

Detalhes estão em [Performance do banco](../../performance/database.md).

## Interceptors, cache e compressão

Interceptors podem medir duração, aplicar timeout ou cache quando a posição no
ciclo da requisição e a semântica estiverem definidas. Não concentre regra de
negócio em um interceptor de performance.

Cache exige chave, escopo público ou privado, validade, invalidação e limite de
memória. Nunca compartilhe resposta dependente de identidade sem isolamento.

Em produção com tráfego relevante, prefira compressão no reverse proxy. Se ela
ficar no processo Node.js, meça CPU, latência e tamanho economizado. Não comprima
payload pequeno apenas por hábito.

Fastify pode ser avaliado quando o adaptador HTTP for um gargalo medido. A troca
afeta middleware e bibliotecas específicas do Express; benchmark e
compatibilidade vêm antes da migração.

## Testes de performance

- Use dados próximos do volume e da distribuição esperados.
- Inclua warm-up e duração suficiente para observar pool e memória.
- Teste concorrência, não apenas uma chamada isolada.
- Registre p50, p95, p99, throughput, erros e saturação.
- Cubra listagens no limite, filtros caros, upload e integrações externas.
- Compare resultado e configuração antes e depois da mudança.
- Não execute teste de carga contra produção sem autorização e planejamento.

## Checklist por módulo

- contratos possuem limites adequados;
- listagens são paginadas;
- response não contém dados desnecessários;
- quantidade e duração de queries foram avaliadas;
- chamadas independentes e dependentes estão ordenadas conscientemente;
- timeout, retry e concorrência foram decididos;
- rota possui métricas sem dados sensíveis;
- caminho crítico tem teste ou evidência proporcional ao risco.
