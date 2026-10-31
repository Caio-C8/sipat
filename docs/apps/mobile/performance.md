# Performance do aplicativo mobile

## Estado atual

Home, patrimônios e inventários já executam leituras de domínio, ainda sem
cache remoto. Não há observabilidade mobile nem metas numéricas definidas. O
timeout de oito segundos do health check é um limite operacional dessa
verificação, não uma meta de latência para todas as operações.

## Princípios

- meça em build release; modo development inclui custos que não representam o
  binário distribuído;
- teste em aparelho e rede representativos, não apenas navegador ou emulador;
- evite trabalho síncrono longo na thread JavaScript e renderizações amplas;
- não use memoização, cache ou paralelismo sem localizar o gargalo;
- carregue dados, imagens e módulos conforme a necessidade do fluxo;
- pagine listas e limite payload, concorrência e tentativas;
- preserve feedback e resposta ao toque enquanto trabalho assíncrono ocorre;
- compare o mesmo cenário antes e depois da alteração.

## Sinais mínimos

| Sinal         | Exemplos de medição                                      |
| ------------- | -------------------------------------------------------- |
| inicialização | cold/warm start e tempo até conteúdo interativo          |
| frames        | FPS, frames lentos, travamentos e resposta ao toque      |
| recursos      | memória, CPU, bateria, rede e encerramentos por memória  |
| estabilidade  | crashes, ANRs, falhas nativas e sessões sem erro         |
| navegação     | duração por rota e transição                             |
| integração    | p50/p95/p99, timeout, cancelamento, retry e bytes        |
| listas        | tempo inicial, blank areas, itens renderizados e memória |
| artefato      | bundle JavaScript, APK/AAB/IPA e tempo de build          |

Não use ID, URL completa, query, token ou dado pessoal como label.

## Renderização e estado

Mantenha estado próximo do consumidor e evite provider global que faça toda a
árvore renderizar. Extraia componente pesado quando houver evidência. Use
`memo`, `useMemo` e `useCallback` somente quando identidade/recálculo tiver
impacto medido; eles também têm custo e complexidade.

Animação não deve executar cálculo pesado na thread JavaScript nem bloquear
interação. Verifique redução de movimento e desempenho em dispositivos mais
limitados do público real.

## Listas e imagens

Para coleções grandes, prefira `FlatList`/`SectionList` a mapear todos os itens
dentro de `ScrollView`. Defina chave estável, paginação e item leve. Ajustes como
`initialNumToRender`, `windowSize`, batch e `getItemLayout` têm trade-offs entre
memória, responsividade e áreas em branco; altere-os com medição.

Use dimensões adequadas e thumbnail em listagens. Evite decodificar imagem muito
maior que a área exibida. Cache de imagem precisa de validade, privacidade e
limpeza, especialmente se representar documento ou patrimônio.

## Rede, cache e offline

- cancele request obsoleta e não deixe resposta antiga sobrescrever estado novo;
- evite waterfall quando chamadas forem independentes, sem criar fan-out
  ilimitado;
- retry automático fica restrito a leitura segura e falha transitória;
- mutations exigem idempotência ou confirmação antes de repetição;
- defina tamanho máximo, paginação e compressão junto da API;
- cache precisa de escopo de usuário, validade, invalidação e limpeza;
- fila offline precisa de ordenação, conflito, deduplicação e feedback.

O cache em memória aprovado para `MOBILE-QUERY-001/002/003` usa 30 segundos
para dados operacionais, cinco minutos para catálogos e limpeza no encerramento
ou troca da sessão. A entrega deve comparar contagem de requests nos cenários de
remontagem, navegação de volta, foco e mutation antes/depois; reduzir chamadas
não autoriza esconder dado vencido nem omitir invalidação.

Não prometa modo offline porque a tela permaneceu aberta sem rede. Uma política
offline inclui persistência, sincronização e resolução de conflito testadas.

## Build e regressão

Monitore duração de install, lint, typecheck, export e EAS Build, além do tamanho
dos artefatos. Preserve lockfile e versões fixas para comparações reproduzíveis.
Depois de dependência nativa ou asset relevante, compare binário, inicialização,
memória e fluxo afetado.

Consulte também o [baseline transversal](../../performance/README.md) e
[contratos e integrações](../../performance/contracts-and-integrations.md).
