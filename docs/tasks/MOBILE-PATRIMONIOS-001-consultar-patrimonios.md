# `MOBILE-PATRIMONIOS-001` — Listar e consultar patrimônios no mobile

**Status:** implementada

## Objetivo

Implementar as telas mobile de listagem, busca, filtros e detalhe atual de
patrimônios para Administrador e Diretor de Patrimônio, integradas somente às
rotas gerais já existentes e visualmente fiéis aos frames aprovados do Figma.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#consulta-e-cadastro-de-patrimônios-no-mobile)
  e [mobile](../apps/mobile/roadmap.md#bens-e-cadastro-patrimonial).
- Requisitos: [RF11 e UC11](../requisitos-SIPAT.md).
- Backend: [PATRIMONIOS-002](./PATRIMONIOS-002-consultar-patrimonios.md).
- Fundação visual: [MOBILE-UI-001](./MOBILE-UI-001-paridade-figma-shell.md).
- Mobile: [arquitetura](../apps/mobile/architecture.md),
  [rotas](../apps/mobile/routing-and-navigation.md),
  [componentes](../apps/mobile/components-and-design-system.md),
  [responsividade](../apps/mobile/responsive-ux-accessibility.md) e
  [testes](../apps/mobile/testing-and-workflow.md).
- Integração: [clientes e operações](../integrations/mobile-api/clients-and-operations.md)
  e [erros/cache/testes](../integrations/mobile-api/errors-cache-testing.md).
- Figma obrigatório no navegador, página `Telas Mobile`:
  [página](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f),
  [listagem](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=315-43020&p=f),
  [busca com resultado](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1877&p=f),
  [aba Dados](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1981&p=f)
  e [aba Valores](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-2082&p=f).

## Pré-condição visual obrigatória

Antes de editar código, o implementador deve abrir os cinco links acima no
navegador, confirmar que está na página `Telas Mobile` e registrar no handoff
quais frames foram comparados. Não é permitido implementar somente a partir
desta descrição, de screenshots copiadas ou da UI mobile atual. O arquivo
Figma é somente leitura e não deve ser editado, comentado ou reorganizado.

## Ordem de execução

1. Confirmar branch, worktree, rotas reais, contratos, shell e sessão atuais.
2. Inspecionar no navegador todos os frames vinculados e os estados/protótipos
   acessíveis a partir deles.
3. Registrar `/bens` e `/bens/[patrimonioId]` no catálogo tipado e criar arquivos
   de rota finos no grupo `(app)`.
4. Implementar operações para listagem e detalhe, com query validada, Bearer em
   memória, timeout, cancelamento e response validada por `@repo/contracts`.
5. Implementar listagem, busca, filtros, paginação e estados remotos.
6. Implementar o detalhe com somente as abas `Dados` e `Valores`.
7. Tornar a bottom bar sensível à rota, com `Bens` selecionado nessas telas e os
   demais destinos preservados conforme seu estado real.
8. Cobrir componentes, operações, navegação, perfis, erros e acessibilidade.
9. Comparar a UI executada em 390×844 com cada frame e depois validar adaptação.

## Escopo

- `/bens` para `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`;
- `/bens/[patrimonioId]` para os mesmos perfis, com UUID validado antes da
  operação;
- reutilizar `GET /api/patrimonios` com busca, status, setor, espécie, natureza,
  tipo de numeração, página e limite já aprovados;
- reutilizar `GET /api/patrimonios/:patrimonioId` para o detalhe;
- formatar número oficial e `SP-` com seis dígitos apenas na apresentação;
- exibir cards de lista com número, descrição, setor, status e demais dados
  previstos no frame que existirem no contrato público;
- busca textual submetida de forma controlada, sem request a cada tecla sem
  política explícita; cancelamento substitui a consulta anterior;
- filtros usam somente os enums e identificadores públicos existentes;
- paginação respeita `meta`, não concatena páginas sem limite e preserva busca e
  filtros ao avançar/voltar;
- aba `Dados` exibe identificação, espécie/natureza e setor/responsável; a sala
  é obtida por `GET /api/setores/:setorId` depois de `PATRIMONIOS-004`, sem N+1
  na listagem;
- aba `Valores` deriva valor atual de
  `valorBrutoAtual - depreciacaoAcumuladaAtual` com aritmética decimal segura e
  exibe somente os dados contábeis, de tombamento e depreciação presentes no
  contrato;
- loading inicial, refresh, vazio, busca sem resultado, erro recuperável,
  offline/rede, timeout, `401`, `403`, `404` e response inválida;
- `Bens` ativo na bottom bar, sem alterar o destaque estrutural de Inventário
  previsto pelo shell.

## Fora do escopo

- aba `Histórico`, consulta agregada de eventos ou RF20;
- botão ou operação `Gerar ficha do bem`, relatórios ou PDF;
- cadastro, edição, substituição de número ou outra mutação patrimonial;
- cache remoto, persistência offline, fila, sincronização em background ou
  biblioteca nova de estado remoto sem decisão própria;
- endpoint, BFF ou response com semântica específica de mobile;
- buscar todas as páginas para fabricar uma lista ilimitada ou agregado ausente;
- exibir campo inexistente como dado real ou preencher ausência com exemplo do
  Figma.

## Decisões aprovadas

- Administrador e Diretor possuem a mesma capacidade de consulta.
- Histórico e geração da ficha serão integrados posteriormente ao objetivo de
  relatórios. As abas/ações correspondentes do protótipo não serão renderizadas
  nem simuladas nesta entrega.
- A fidelidade visual é obrigatória nos elementos em escopo; as duas omissões
  acima são desvios de produto explicitamente aprovados.
- O valor atual é apresentação derivada de campos decimais da response; não se
  usa `number` binário para cálculo monetário.
- Falta de permissão ou falha remota nunca se transforma em lista vazia.

## Critérios de aceite

- [ ] implementador registra que abriu e comparou no navegador todos os frames
      obrigatórios;
- [ ] os dois perfis listam, buscam, filtram, paginam e consultam um bem;
- [ ] listagem e detalhe validam integralmente as responses públicas;
- [ ] número patrimonial, moeda, datas, status e campos opcionais são formatados
      sem mudar o valor canônico;
- [ ] Dados e Valores correspondem ao Figma em 390×844, salvo omissões
      aprovadas;
- [ ] Histórico e Gerar ficha não possuem UI ativa, handler ou rota placeholder;
- [ ] estados loading, vazio, erro, offline, timeout, `401`, `403`, `404` e retry
      são distinguíveis e acessíveis;
- [ ] requests obsoletas são canceladas e não sobrescrevem consulta mais nova;
- [ ] bottom bar navega para Bens e anuncia corretamente o item selecionado;
- [ ] nenhuma rota de API específica para mobile é criada.

## Arquivos ou módulos potencialmente afetados

- novos `apps/mobile/src/app/(app)/bens/index.tsx` e
  `apps/mobile/src/app/(app)/bens/[patrimonioId].tsx`;
- novo `apps/mobile/src/features/patrimonios/` com `api/`, `components/`,
  apresentação, formatação e testes;
- `apps/mobile/src/lib/navigation/routes.ts` e seus testes de completude;
- `apps/mobile/src/components/shared/app-bottom-bar.tsx` e testes;
- `apps/mobile/src/theme/tokens.ts` somente para tokens semânticos realmente
  compartilhados;
- `apps/mobile/src/lib/api/api-client.ts` somente se faltar capacidade HTTP
  genérica comprovada;
- `@repo/contracts` como dependência de runtime, não como alvo presumido de
  alteração.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes HTTP de URL/query, paginação, token, timeout, cancelamento, `401`,
  `403`, `404` e response inválida;
- testes de tela dos dois perfis, busca, filtros, páginas, abas e estados;
- integração real com API/PostgreSQL para os dois perfis;
- comparação visual no navegador com os cinco frames em 390×844;
- telefone/tablet, retrato/paisagem, Web, fonte ampliada, foco, TalkBack e
  VoiceOver quando disponíveis;
- `corepack pnpm format:check` e `git diff --check`.

## Handoff da implementação

Em 28 de outubro de 2026, a implementação abriu e comparou no navegador a
página `Telas Mobile` e os frames `Consultar bens`, busca com resultado,
`Consulta de dados do patrimônio` e `Consulta de valores do patrimônio`.

Foram entregues `/bens` e `/bens/[patrimonioId]`, operações de listagem,
detalhe e catálogos com schemas públicos, cancelamento de requests obsoletas,
busca submetida, filtros, paginação, estados remotos e as abas `Dados` e
`Valores`. O cálculo do valor atual usa strings decimais escaladas com
`BigInt`; Histórico e geração de ficha não possuem UI nem handler. O Web serve
o template estático da rota dinâmica em deep links de patrimônio pelo Nginx.

Verificações executadas:

- lint e typecheck de `@repo/mobile`;
- 20 suítes e 67 testes de `@repo/mobile`;
- exports Android, iOS e Web com configuração sintética de API;
- duas suítes e 21 testes patrimoniais da API, incluindo PostgreSQL 17 em banco
  local descartável e a matriz HTTP dos dois perfis;
- build do container `mobile-web` e smoke de `/`, `/check`, `/health` e deep
  link dinâmico de patrimônio;
- `git diff --check`.

Permanecem como validação externa: comparação da UI executada com sessão real
em 390×844, integração completa app–API–PostgreSQL, aparelhos Android/iOS,
tablet, rotação, fonte ampliada, TalkBack e VoiceOver. Export e testes locais
não substituem essas evidências.

## Pendências ou decisões bloqueantes

- Nenhuma. Histórico e ficha estão conscientemente fora do escopo.
