# `WEB-DASHBOARD-001` — Integrar a visão geral com capacidades existentes

**Status:** `concluída em 26 de outubro de 2026`

## Objetivo

Substituir os números ilustrativos do dashboard por dados reais que já possam
ser obtidos com os contratos e endpoints implementados, e apresentar estados
honestos de indisponibilidade para blocos sem suporte atual. As ações rápidas
permanecem sem funcionalidade nesta etapa.

## Contexto e referências

- Dependência: [WEB-SHELL-001](./WEB-SHELL-001-padronizar-shell-autenticado.md).
- Roadmap: [aplicação Web](../apps/web/roadmap.md).
- Requisitos e decisões:
  [RF11, RF19 e RF20](../requisitos-SIPAT.md),
  [integração Web–API](../integrations/web-api/README.md),
  [clientes e operações](../integrations/web-api/clients-and-operations.md),
  [testes Web](../apps/web/testing-and-workflow.md) e
  [performance de integrações](../performance/contracts-and-integrations.md).
- Contratos existentes:
  `ListarPatrimoniosQuerySchema`, `ListarPatrimoniosResponseSchema` e os status
  `ATIVO`, `BAIXADO`, `EMPRESTADO` e `EM_MANUTENCAO` em `@repo/contracts`.
- Estado relacionado: [handoff Web](../apps/web/handoff.md).
- Referência visual: frame `Home` (`298:80`) do
  [arquivo do Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=298-80).

Antes desta entrega, somente a identidade era real. Totais, pendências, setores,
atividades e datas de exemplo estavam fixos em `home-dashboard.tsx`. A API já
expunha a listagem paginada de patrimônios para os dois perfis e sua metadata
continha o total filtrado.

## Escopo

- criar uma operação Server para `GET /patrimonios`, usando
  `serverApiClient`, encaminhamento explícito do cookie, query validada e
  validação de response pelo schema compartilhado;
- obter em paralelo, com fan-out fixo e limitado, a metadata da listagem geral
  e das quatro consultas por status, sempre com `pagina=1` e `limite=1`;
- alimentar com `meta.total` os cartões `Total de bens`, `Bens ativos`,
  `Em manutenção` e `Em empréstimo`, além da distribuição por situação,
  incluindo `Baixados`;
- manter os cartões informativos, sem seta ou affordance de navegação enquanto
  não existir página Web de destino;
- substituir a data ilustrativa por data atual formatada em `pt-BR`, com
  elemento `time` e representação estável entre servidor e cliente;
- tratar loading, erro de contrato/rede e ausência de registros. Não usar os
  números ilustrativos como fallback em nenhuma falha;
- para `Pendências de atenção`, `Bens por setor` e `Últimas atividades`, exibir
  um estado visual preservando a hierarquia do Figma, com a mensagem
  `Dados ainda não disponíveis — integração não implementada`;
- não consultar todas as páginas de patrimônios para fabricar agregados por
  setor;
- manter `Ações rápidas` visível conforme o Figma, mas renderizar cada ação como
  botão desabilitado com indicação visível `Em breve`, sem `href`, handler,
  mutação ou chamada HTTP;
- remover do rodapé e dos nomes acessíveis qualquer indicação de `dados
ilustrativos` depois que os totais reais estiverem integrados;
- atualizar a documentação de estado somente após a implementação e as
  verificações correspondentes.

### Matriz de dados desta entrega

| Bloco                        | Fonte atual                            | Resultado nesta entrega    |
| ---------------------------- | -------------------------------------- | -------------------------- |
| Total de bens                | `GET /patrimonios`                     | integrado por `meta.total` |
| Totais por situação          | `GET /patrimonios?status=...`          | integrado por `meta.total` |
| Gráfico por situação         | mesmas consultas por status            | integrado                  |
| Pendências de atenção        | sem endpoint agregado comum aos perfis | estado não implementado    |
| Bens por setor               | sem endpoint de agregação por setor    | estado não implementado    |
| Últimas atividades/operações | sem endpoint de histórico geral/feed   | estado não implementado    |
| Ações rápidas                | sem rotas Web de destino               | desabilitadas, `Em breve`  |

`GET /inventarios` não deve ser usado para simular uma central geral de
pendências: ele é exclusivo do Diretor de Patrimônio e não cobre manutenção nem
as demais operações. Modelos de auditoria no banco também não constituem um
contrato público consumível pela Web.

## Fora do escopo

- criar endpoint específico de dashboard, agregado por setor, notificações,
  pendências ou histórico geral;
- criar páginas de pesquisa, cadastro, movimentação, manutenção, inventário ou
  relatórios;
- ativar ações rápidas;
- adicionar cache remoto, polling, retry automático ou estado global;
- exibir dados de um perfil por meio de endpoint ao qual ele não tem acesso;
- buscar todas as páginas de uma listagem para calcular agregados no cliente ou
  no servidor Web.

## Decisões aprovadas

- Integração parcial e explícita é preferível a dados falsos ou a agregações
  incorretas.
- As cinco consultas de patrimônio são um fan-out constante e temporário. O
  implementador deve executá-las em paralelo e instrumentá-las com os nomes de
  operação normalizados; qualquer expansão desse fan-out exige replanejamento
  ou endpoint agregado dedicado.
- O dashboard continua Server Component. Nenhum hook de cache será criado só
  para esta leitura inicial.
- Falha de integração não deve revelar mensagem interna da API, query, cookie,
  identificador ou detalhe de infraestrutura.
- A autorização continua na API; a UI adapta conteúdo e navegação, mas não a
  substitui.

## Critérios de aceite

- [x] Os cinco totais patrimoniais exibidos são derivados exclusivamente da
      metadata validada das listagens da API.
- [x] Administrador e Diretor de Patrimônio conseguem carregar os totais, pois
      `GET /patrimonios` permite os dois perfis.
- [x] Requisições independentes são paralelas, finitas e não criam waterfall ou
      paginação exaustiva.
- [x] Resposta fora do contrato, `401`, `403`, timeout e falha de rede produzem
      estado seguro e compreensível, sem reapresentar números ilustrativos.
- [x] Zero patrimônios é representado como estado válido, não como erro.
- [x] Pendências, setores e atividades comunicam que a integração ainda não
      existe e não exibem registros de exemplo.
- [x] Todos os botões de ação rápida estão desabilitados, marcados `Em breve` e
      não navegam nem disparam operação.
- [x] Nenhum card aparenta ser link enquanto a rota de destino não existir.
- [x] A data usa `pt-BR`, sem texto fixo de 2026 e sem mismatch de hidratação.
- [x] O dashboard preserva a hierarquia visual do Figma, reflow responsivo,
      headings, nomes acessíveis e contraste dos estados vazios/erro/loading.
- [x] Testes cobrem contrato da operação, montagem das queries, sucesso, zero,
      falha e a ausência de interatividade das ações rápidas.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/_home/home-dashboard.tsx`;
- `apps/web/app/_home/home.module.css`;
- `apps/web/app/dashboard/page.tsx` ou o caminho equivalente após
  `WEB-SHELL-001`;
- nova operação em `apps/web/lib/patrimonios/` ou
  `apps/web/features/patrimonios/`, conforme a convenção confirmada pelo
  implementador;
- `apps/web/lib/api/server-api-client.ts` somente como consumidor, sem criar
  outra instância HTTP;
- `apps/web/lib/observability/api-operations.ts`;
- `packages/contracts/src/patrimonio/` somente como fonte dos contratos já
  existentes; não há mudança de contrato prevista;
- novos testes unitários da operação e do dashboard;
- `apps/web/e2e/auth.e2e.ts` e o mock estrito da fronteira `/api/backend`.

## Verificações esperadas

- `pnpm --filter @repo/web lint`;
- `pnpm --filter @repo/web typecheck`;
- `pnpm --filter @repo/web test`;
- `pnpm --filter @repo/web build`;
- `pnpm --filter @repo/web test:e2e`;
- inspeção manual de sucesso, zero, loading e erro nos três intervalos de
  viewport, teclado, zoom de 200% e conteúdo longo;
- comparação visual do conteúdo com o frame `Home` do Figma, aceitando apenas
  as diferenças aprovadas para estados não implementados.

## Pendências ou decisões bloqueantes

- Nenhuma para a integração parcial descrita. Agregados por setor, feed de
  pendências, últimas operações e destinos das ações rápidas exigem contratos e
  objetivos futuros próprios.

## Resultado verificado

- lint, tipos e 40 testes unitários passaram;
- build de produção passou com Next.js 16.4.3;
- 15 cenários Playwright passaram no Chromium, incluindo sucesso, zero,
  loading, indisponibilidade, sessão e acessibilidade automatizável;
- o reflow foi inspecionado em 390, 1024 e 1600 px, incluindo o comportamento
  equivalente ao zoom de 200% pela redução da viewport CSS;
- a integração com uma stack real provisionada continua fora desta entrega; o
  E2E usa o backend estrito e validado por contratos já adotado pela Web.
