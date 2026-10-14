# Performance de operação e build

## Runtime e containers

Observe por aplicação e instância:

- CPU, memória e event loop lag;
- reinicializações, falhas de health/readiness e encerramentos por memória;
- requests e jobs em andamento;
- conexões e file descriptors;
- fila, atraso e idade do item mais antigo quando houver worker;
- tráfego de entrada e saída;
- tempo de inicialização e graceful shutdown;
- réplicas disponíveis e saturação do recurso limitante.

Defina requests e limits de CPU/memória a partir de medição. Limite muito baixo
causa throttling ou reinício; limite muito alto reduz densidade e pode ocultar
vazamento.

Escalar a API aumenta também pools e chamadas ao banco. Revise conexões totais e
capacidade das dependências antes de aumentar réplicas.

## Proxy, cache e assets

- Termine TLS no componente documentado para o ambiente.
- Faça compressão no reverse proxy em produção de tráfego relevante quando a
  topologia permitir.
- Use CDN para assets públicos e imutáveis.
- Não cacheie resposta privada como pública.
- Meça cache hit/miss, bytes economizados, CPU e latência.
- Health check deve ser barato e readiness deve representar capacidade real de
  receber tráfego sem criar tempestade de chamadas às dependências.

## Build e CI

Performance de desenvolvimento também precisa de regressão visível. Acompanhe:

| Métrica                            | Utilidade                          |
| ---------------------------------- | ---------------------------------- |
| duração de install e build         | custo local e de CI                |
| duração de lint, typecheck e teste | feedback ao desenvolvimento        |
| cache hit/miss do Turborepo        | efetividade do grafo e dos outputs |
| tamanho dos artefatos              | deploy, cold start e transferência |
| bundle por rota web                | JavaScript entregue ao navegador   |
| duração e flakiness de testes      | confiança e custo do pipeline      |

- Declare inputs, outputs e variáveis relevantes nas tasks do Turborepo.
- Não habilite cache para tarefas persistentes ou que dependam de estado externo
  não representado.
- Investigue invalidação frequente antes de aumentar recursos do CI.
- Compare bundles e artefatos após dependências relevantes.
- Preserve lockfile e versões de runtime para tornar comparações reproduzíveis.

### Artefato standalone do Next.js

Com `output: "standalone"`, execute o `server.js` mínimo gerado em vez de
`next start`. O Next.js não copia `public` nem `.next/static` para o diretório
standalone por padrão. A imagem Docker da Web já copia esses diretórios para o
artefato final; uma execução manual precisa reproduzir as mesmas cópias antes
de iniciar o servidor. Sem os assets, o HTML pode responder enquanto os chunks
retornam `404`, o que invalida qualquer verificação funcional ou de performance.

## Deploy e regressão

- Registre versão ou commit nas métricas e traces.
- Compare o mesmo fluxo antes e depois do deploy.
- Defina rollback ou mitigação para regressão crítica.
- Use canary ou rollout gradual quando risco e infraestrutura justificarem.
- Não considere um build bem-sucedido como validação de capacidade em runtime.
