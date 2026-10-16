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

As imagens Docker limitam a instalação ao grafo da aplicação, compartilham
stores de pacotes e metadados por cache BuildKit e usam retries finitos para o
registry. Os mounts usam `sharing=locked` para serializar as instalações que
compartilham o cache; os scripts `stack:*:up` também limitam as operações do
Compose com `--parallel 1`. O primeiro build ainda precisa baixar dependências;
builds seguintes reutilizam o cache enquanto ele não for removido do builder.
Se uma indisponibilidade externa interromper esse primeiro download, repita o
mesmo comando `stack:*:up`: as camadas e os pacotes já concluídos permanecem no
cache. Falhas recorrentes devem ser investigadas como problema de proxy, DNS ou
acesso ao registry, em vez de desabilitar verificações de integridade.

Não use `trustLockfile` como atalho para uma rede lenta: essa opção pula a
reaplicação das políticas de supply chain ao lockfile. Também não execute
`docker builder prune` rotineiramente, pois ele remove caches que tornam os
builds seguintes mais rápidos e resilientes.

### Artefato standalone do Next.js

Com `output: "standalone"`, execute o `server.js` mínimo gerado em vez de
`next start`. O Next.js não copia `public` nem `.next/static` para o diretório
standalone por padrão. A imagem Docker da Web já copia esses diretórios para o
artefato final; uma execução manual precisa reproduzir as mesmas cópias antes
de iniciar o servidor. Sem os assets, o HTML pode responder enquanto os chunks
retornam `404`, o que invalida qualquer verificação funcional ou de performance.

### Export estático do mobile-web

O serviço `mobile-web` gera `apps/mobile/dist/web` durante o build da imagem e
serve os arquivos com Nginx. Meça separadamente tempo e tamanho do export,
bytes transferidos, compressão e cache dos assets. O health check `/health`
confirma somente o servidor estático; disponibilidade e latência da API devem
continuar sendo observadas pelo endpoint da API e pelos fluxos reais.

No CI, o target Docker `ci` reutiliza o export Web que a etapa `pnpm build` já
produziu e valida somente a camada de runtime. O target padrão `runner` continua
gerando seu próprio artefato para que imagens de deploy sejam autocontidas.

Variáveis `EXPO_PUBLIC_*` fazem parte do input do build. Trocar URL ou ambiente
sem reconstruir a imagem deixa o bundle antigo ativo, mesmo que o container
seja reiniciado.

## Deploy e regressão

- Registre versão ou commit nas métricas e traces.
- Compare o mesmo fluxo antes e depois do deploy.
- Defina rollback ou mitigação para regressão crítica.
- Use canary ou rollout gradual quando risco e infraestrutura justificarem.
- Não considere um build bem-sucedido como validação de capacidade em runtime.
