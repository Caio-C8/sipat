# Performance da aplicação Web

## Estado da base

A home é estática e a rota `/api/health` é dinâmica. Não há listagem, cache de
domínio, provider global de estado remoto nem biblioteca de formulários no
baseline. O Web Vitals Reporter normaliza nomes de rota antes de emitir métricas
e evita identificadores de alta cardinalidade.

O build de produção deve continuar sendo verificado sempre que rotas,
dependências ou configuração do Next.js mudarem.

## Princípios

- use Server Components por padrão e mantenha fronteiras Client pequenas;
- não adicione cache, memoização ou paralelismo sem identificar o gargalo;
- evite waterfalls artificiais;
- carregue componentes pesados apenas onde usados;
- use `next/image` e `next/font` quando aplicáveis;
- preserve espaço para conteúdo assíncrono;
- pagine volumes controlados por entrada externa;
- não aplique retries agressivos a mutações;
- compare cenários equivalentes antes e depois de otimizar.

## Medição

Antes de produção, execute o build, confira quais rotas são estáticas ou
dinâmicas, analise bundle após dependências relevantes e teste rede e CPU
limitadas. Em produção, acompanhe percentis — especialmente p75 de LCP, INP e
CLS — segmentados por ambiente e rota normalizada.

Metas numéricas pertencem ao produto derivado. A base exige medição,
justificativa para regressões e labels sem credenciais, dados pessoais, IDs ou
URLs brutas.

Consulte também [Performance](../../performance/README.md).
