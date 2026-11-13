# `WEB-BAIXAS-001` — Implementar a interface Web de baixa

**Status:** `aprovada`

## Objetivo

Implementar a área Web identificada somente como `Baixa`, com consulta de
registros para Administrador e Diretor de Patrimônio e registro de uma baixa
unitária somente pelo Diretor, reproduzindo com fidelidade os frames de `Telas
PC` no Figma.

## Contexto e referências

- Requisitos: [RF17, UC17, RN04, RN05, RN15 e RNF05](../requisitos-SIPAT.md).
- Domínio existente:
  [CONTRACTS-010](./CONTRACTS-010-contratos-baixas-patrimoniais.md),
  [BAIXAS-001](./BAIXAS-001-registrar-consultar-baixas.md),
  [BAIXAS-002](./BAIXAS-002-consulta-administrador.md) e
  [RELATORIOS-001](./RELATORIOS-001-consultas-tabulares.md).
- Web: [índice](../apps/web/README.md),
  [páginas e rotas](../apps/web/pages-and-routing.md),
  [design system](../apps/web/components-and-design-system.md),
  [responsividade e acessibilidade](../apps/web/responsive-ux-and-accessibility.md)
  e [testes](../apps/web/testing-and-workflow.md).
- Integração: [Web–API](../integrations/web-api/README.md).
- Segurança: [política de baixas](../security-and-access.md#baixas-patrimoniais--política-aprovada-para-a-interface-web).
- Roadmaps: [Web](../apps/web/roadmap.md#baixa) e
  [geral](../roadmap.md#ordem-das-entregas-de-baixas-patrimoniais).
- Protótipo obrigatório: abrir com
  [@Figma](plugin://figma@openai-curated-remote) o
  [arquivo fornecido](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&t=bV2ZOdKAFjE39sbT-1),
  selecionar `Telas PC` e reinspecionar o frame de cada objetivo antes de
  editar. Este documento não substitui a leitura do arquivo vivo.

### Frames obrigatórios

| Objetivo | Nome no Figma                       | Node ID    |
| -------- | ----------------------------------- | ---------- |
| 1        | `Tela de Baixas`                    | `248:2`    |
| 2        | `Nova Baixa`                        | `248:197`  |
| 2        | `Seleção de itens para baixa`       | `248:373`  |
| 2        | `Seleção de itens para baixa`       | `249:559`  |
| 3        | `Historico da baixa`                | `250:914`  |
| 4        | `Baixa de item na tela de consulta` | `301:1891` |

Os nomes preservam a grafia do arquivo para facilitar a busca. O Figma é a
autoridade para composição, hierarquia, proporções, espaçamentos, tipografia,
cores, bordas, ícones e estados visuais. Requisitos, contratos e API são a
autoridade para dados, autorização, validação, erros e persistência.

## Estado confirmado em 13/11/2026

- Não existe rota independente de baixas na Web. O item de navegação ainda se
  chama `Baixa e estorno`, está indisponível e aparece somente ao Diretor.
- O detalhe patrimonial já permite ao Diretor registrar uma baixa real por
  drawer e possui operações Web tipadas para criação, consulta e opções de
  comissão.
- `GET /api/relatorios/baixas` já lista baixas com paginação e filtros para os
  dois perfis. O resultado contém `id`, `patrimonioId`, número, descrição,
  data, tipo, motivo, comissão, autor, `registroEm` e observação.
- A consulta individual existente ainda nega o Administrador; `BAIXAS-002`
  corrige somente essa autorização. Criação, opções e anexo permanecem
  exclusivos do Diretor.
- O banco e a API representam uma baixa única por patrimônio. O protótipo
  ilustra vários bens agrupados, mas baixa em lote está explicitamente fora do
  escopo de `CONTRACTS-010` e `BAIXAS-001`.
- A tentativa de leitura estruturada pelo MCP do Figma atingiu o limite do
  plano Starter. Os seis nodes foram localizados e inspecionados no arquivo
  vivo pelo navegador; o implementador deve abri-los novamente durante a
  execução e na comparação final.

## Escopo e ordem de execução

### Objetivo 1 — lista compartilhada e identificação correta

1. Criar `/baixas` no shell autenticado e reproduzir o frame `Tela de Baixas`.
2. Alterar o item de navegação para `id: "baixa"`, label `Baixa`, perfis
   Administrador e Diretor, `href: "/baixas"` e breadcrumb sem a palavra
   `estorno`. A metadata deve resultar em `Baixa | <nome da aplicação>`.
3. Remover `Baixa e estorno` de títulos, descrições, filtros, acessibilidade e
   testes. Não deve existir ação, estado, coluna ou texto que sugira estorno.
4. Consumir `GET /api/relatorios/baixas` com os filtros e a paginação que o
   contrato realmente suporta. Sem filtros, listar todas as baixas; o período é
   opcional e, quando usado, exige início e fim. Organizar campos reais no padrão
   visual do Figma; não inventar situação de estorno, valor congelado ou
   identificador agrupador inexistente.
5. Administrador e Diretor veem lista, vazio, erro, carregamento, paginação e
   acesso ao detalhe. Somente o Diretor vê `Registrar baixa`.
6. Manter filtros compartilháveis na URL. Quando a tabela não couber, usar
   overflow horizontal previsto e focável, sem esconder informação necessária.

### Objetivo 2 — registro unitário exclusivo do Diretor

1. Criar `/baixas/nova` e reproduzir os frames `Nova Baixa` e as duas variantes
   de `Seleção de itens para baixa`, preservando a hierarquia visual de dados da
   baixa, seleção, resumo, justificativa e ações.
2. Adaptar o protótipo para selecionar exatamente um patrimônio `ATIVO`. Usar
   linguagem no singular, contador máximo de um e radio/seleção única acessível;
   não simular uma lista mutável que depois envie várias requisições.
3. Reutilizar as consultas patrimoniais e a operação multipart existentes.
   Data, tipo, motivo, observação, comissão e PDF opcional seguem
   `BaixarPatrimonioDadosSchema`; não reduzir `tipo` a um `motivo` ilustrativo
   do Figma.
4. Carregar opções de comissão pela rota específica somente depois de haver
   data válida e somente para o Diretor. Preservar formulário corrigível em
   erros conclusivos e não fazer retry automático da mutation irreversível.
5. Bloquear o acesso do Administrador antes de montar o formulário ou carregar
   patrimônios/opções de registro. A chamada direta continua protegida pela
   API.
6. Antes da confirmação, mostrar patrimônio, data, tipo, comissão, motivo,
   observação e nome do PDF. Exigir confirmação explícita da irreversibilidade,
   impedir duplo envio e anunciar sucesso ou erro de forma acessível.
7. Após sucesso, abrir o detalhe persistido ou voltar à lista com atualização
   real. Não usar sucesso otimista.

### Objetivo 3 — detalhe individual compartilhado

1. Criar `/baixas/[patrimonioId]` e reproduzir a composição de `Historico da
baixa` usando exatamente um registro e um patrimônio. O parâmetro da rota é
   o `patrimonioId`, pois a consulta pública existente é por patrimônio.
2. Identificar a página como `Detalhe da baixa` ou `Baixa — <número
patrimonial>`, nunca como histórico agrupado ou estorno. Não fabricar código
   `BAI-*`, quantidade de itens ou valor total ausentes do contrato.
3. Exibir os campos da allowlist individual: patrimônio, comissão, tipo, data,
   motivo, observação, autoria e instante. Administrador e Diretor veem os
   mesmos dados estruturados.
4. Mostrar a ação de abrir o PDF somente ao Diretor quando `anexoUrl` existir.
   O Administrador não recebe controle oculto, desabilitado ou request do
   anexo.
5. Suportar URL profunda, reload, back/forward e retorno à lista com filtros
   preservados. O detalhe é somente leitura para ambos os perfis.

### Objetivo 4 — drawer no detalhe patrimonial

1. Adequar o drawer existente ao frame `Baixa de item na tela de consulta`,
   mantendo o patrimônio fixo e identificado.
2. Reutilizar o mesmo formulário/operações do Objetivo 2 em variante de item
   fixo; não duplicar validação, multipart ou tratamento de erro.
3. Montar o acionador e o drawer somente para o Diretor. Após sucesso, atualizar
   o detalhe e o histórico patrimonial, devolver foco ao gatilho e anunciar o
   resultado.
4. Preservar Dialog/Drawer acessível: nome, descrição, foco contido, `Esc`,
   rolagem interna e bloqueio de fechamento durante confirmação.

### Objetivo 5 — paridade visual, perfis e regressão

1. Comparar lado a lado a implementação executada com cada node no Figma em
   1920 × 1080. Corrigir composição, medidas, cores, tipografia, ícones,
   estados, bordas e alinhamentos dentro do escopo.
2. Verificar 1536, 900 e 390 px, zoom a 200%, conteúdo longo, teclado, foco,
   reduced motion e axe. A adaptação responsiva não autoriza ocultar dados ou
   ações necessárias.
3. Cobrir Administrador e Diretor: lista/detalhe para ambos; nova baixa e
   drawer somente para Diretor; `403` da API para tentativa direta do
   Administrador.
4. Cobrir loading, vazio, erro, documento ausente, validação, conflito,
   inventário aberto, resultado incerto e sucesso, além de reload e navegação.

## Banco, contratos e API

Não estão previstos migration, alteração de banco, novo contrato ou novo
endpoint. A tela deve reutilizar:

- `GET /api/relatorios/baixas` para lista e filtros;
- `GET /api/patrimonios/:patrimonioId/baixa` para detalhe;
- `GET /api/patrimonios/:patrimonioId/baixa/opcoes/comissoes` e
  `POST /api/patrimonios/:patrimonioId/baixa` somente no fluxo do Diretor;
- `GET /api/patrimonios/:patrimonioId/baixa/anexo` somente para o Diretor.

O planejamento original previa em `BAIXAS-002` somente o ajuste de autorização
da consulta individual. Em 13 de novembro de 2026, o usuário autorizou ampliar
a response do detalhe com o nome do autor já relacionado à baixa, preservando o
`createdById` para compatibilidade e auditoria. Qualquer outra response
adicional, baixa em lote, consulta por `baixaId`, acesso administrativo ao PDF
ou persistência nova deve retornar ao planejador/usuário antes de alterar o
escopo.

## Fora do escopo

- Estorno, reativação, edição, exclusão ou substituição de documento.
- Baixa em lote, grupo de baixas, código `BAI-*` ou confirmação por várias
  requisições unitárias.
- Migration, modelo novo, seed ou alteração de dados existentes.
- Novo endpoint de listagem ou rota específica para Web.
- Acesso do Administrador às opções de criação, mutation ou anexo.
- Copiar valor atual do patrimônio como se fosse snapshot contábil da baixa.
- Alterar telas mobile, relatórios ou outros fluxos patrimoniais.
- Dados fictícios tratados como reais, handlers sem operação HTTP ou sucesso
  otimista.

## Decisões aprovadas

- Toda identificação visível e acessível da feature usa `Baixa`; não existe
  estorno no sistema.
- Administrador consulta registros; somente Diretor registra baixas. O gate Web
  evita controles e requests incompatíveis, mas não substitui a API.
- O PDF permanece exclusivo do Diretor conforme a política de segurança
  existente.
- Paridade visual com o Figma é critério de aceite, não sugestão. Diferença
  deliberada só é aceita para preservar requisito, contrato, acessibilidade ou
  segurança e deve ser registrada com evidência.
- O Figma deve ser reaberto em cada objetivo. Captura ou descrição nesta tarefa
  não substitui a inspeção do arquivo vivo.
- A composição dos frames de múltiplos itens deve ser mantida com seleção e
  detalhe unitários. O desenho não autoriza baixa em lote nem agrupamento
  inexistente no domínio.
- Componentes e operações já funcionais devem ser refatorados e reutilizados;
  não duplicar cliente HTTP, schema, multipart ou formulário completo.

## Critérios de aceite

- [ ] Os seis nodes obrigatórios foram reinspecionados no Figma e comparados
      lado a lado com a implementação em 1920 × 1080.
- [ ] Navegação, breadcrumb, metadata, headings e textos identificam a área
      somente como `Baixa`, sem referência a estorno.
- [ ] `/baixas` corresponde visualmente ao protótipo e lista dados reais para
      Administrador e Diretor com todos os registros por padrão, filtros,
      paginação e estados completos.
- [ ] Somente o Diretor vê e acessa `/baixas/nova`; o gate ocorre antes de
      qualquer request de criação.
- [ ] O fluxo visual de seleção aceita exatamente um patrimônio e envia uma
      única mutation multipart real.
- [ ] `/baixas/[patrimonioId]` funciona para os dois perfis e não inventa lote,
      código agrupador, valor histórico ou estado de estorno.
- [ ] O anexo aparece e é solicitado somente para o Diretor.
- [ ] O drawer patrimonial corresponde ao frame, mantém o bem fixo e atualiza
      detalhe/histórico após sucesso.
- [ ] Nenhum endpoint, contrato, migration ou schema foi alterado além da
      autorização explicitamente coberta por `BAIXAS-002`.
- [ ] Loading, vazio, erro, conflito, resultado incerto e sucesso são coerentes
      visual e funcionalmente, sem retry automático ou duplo envio.
- [ ] Teclado, foco, `Esc`, restauração de foco, zoom, contraste, reflow,
      conteúdo longo, reduced motion e axe foram verificados.

## Referências obrigatórias por objetivo

O implementador deve começar por esta tarefa, RF17, `BAIXAS-001` e
`BAIXAS-002`. Depois, deve abrir o node vivo e somente o conjunto do objetivo
em execução.

1. **Lista e navegação:**
   `apps/web/lib/navigation/system-navigation.ts`,
   `apps/web/features/relatorios/api/operations.ts`,
   `apps/web/features/relatorios/apresentacao.tsx`,
   `packages/contracts/src/relatorio-patrimonial/queries.ts`,
   `packages/contracts/src/relatorio-patrimonial/responses.ts`, as novas rotas
   sob `apps/web/app/(sistema)/baixas/` e o node `248:2`.
2. **Registro e seleção unitária:**
   `apps/web/features/patrimonios/components/patrimonio-acoes.tsx`,
   `apps/web/features/patrimonios/api/patrimonio-operations.ts`,
   `apps/web/features/patrimonios/api/hooks.ts`,
   `packages/contracts/src/baixa-patrimonio/`,
   `apps/web/components/ui/select.tsx`,
   `apps/web/components/ui/textarea.tsx`,
   `apps/web/components/ui/dialog.tsx` e os nodes `248:197`, `248:373` e
   `249:559`.
3. **Detalhe compartilhado:**
   `apps/web/features/patrimonios/api/server-patrimonio-operations.ts`,
   `packages/contracts/src/baixa-patrimonio/baixa-patrimonio-responses.schema.ts`,
   as novas rotas sob `apps/web/app/(sistema)/baixas/[patrimonioId]/`,
   `apps/web/components/ui/drawer.tsx` ou `dialog.tsx` se realmente reutilizado,
   e o node `250:914`.
4. **Drawer patrimonial:**
   `apps/web/features/patrimonios/components/patrimonio-acoes.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-acoes.test.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-detalhe.tsx`,
   o componente compartilhado criado para o Objetivo 2 e o node `301:1891`.
5. **Perfis e verificação:**
   `apps/api/src/modules/baixas/baixas.controller.ts`,
   `apps/api/test/baixas.e2e-spec.ts`, novos testes unitários/Playwright da
   feature, configuração E2E real proporcional ao fluxo e todos os nodes.

Confirme os caminhos novos contra a organização viva antes de criá-los. Os
arquivos de contratos, API e banco são referências de integração; fora de
`BAIXAS-002`, não são alvos previstos.

## Verificações esperadas

- `pnpm --filter @repo/web lint`;
- `pnpm --filter @repo/web typecheck`;
- `pnpm --filter @repo/web test`;
- `pnpm --filter @repo/web build`;
- E2E Web de navegação, perfis, lista, detalhe, criação e drawer;
- percurso Web–API–PostgreSQL descartável para consulta nos dois perfis e uma
  baixa real pelo Diretor, sem usar a base de desenvolvimento;
- verificações de `BAIXAS-002` na API;
- comparação manual com o Figma em 1920 × 1080 e revisão em 1536, 900 e 390 px;
- zoom a 200%, teclado, foco, reduced motion e axe;
- `pnpm format:check`, links relativos e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Se surgir necessidade de baixa em lote, acesso administrativo ao
  PDF, campo ausente ou novo endpoint, o implementador deve retornar ao
  planejador antes de mudar comportamento externo.
