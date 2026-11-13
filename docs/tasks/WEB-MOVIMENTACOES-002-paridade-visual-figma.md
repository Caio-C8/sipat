# WEB-MOVIMENTACOES-002 — paridade visual das telas de movimentações

**Status:** implementada e validada automaticamente em 13/11/2026;
homologação manual com leitor de tela pendente

## Evidências de execução em 13/11/2026

- O arquivo vivo foi aberto no navegador integrado, conforme autorizado pelo
  usuário, na página `Telas PC`. Foram reinspecionados os nodes `303:3229`,
  `303:3471`, `303:3728` e a composição completa do node `303:4123`, cujo
  frame ancestral localizado é `303:3982`.
- Lista, filtros, seleção, destinos, dados comuns, revisão, resultado e detalhe
  independente foram harmonizados com os frames. Data e horário continuam
  registrados pelo servidor; data manual, código TR e lote de domínio não
  foram adicionados.
- O drawer patrimonial não foi alterado. A variante `modoDetalhe` preservou sua
  apresentação e a regressão está coberta pela suíte unitária, inclusive
  `patrimonio-acoes.test.tsx`.
- `lint`, `typecheck`, 27 arquivos/112 testes unitários e o build de produção
  Web passaram. O E2E Web padrão passou em 7/7 cenários, com axe, teclado,
  reduced motion, zoom a 200% e viewports de 390, 768, 900, 1440, 1536 e
  1920 px.
- O percurso real passou em 5/5 cenários contra API compilada e PostgreSQL 17
  descartável, após aplicar as 28 migrations em banco exclusivo. A base de
  desenvolvimento não foi usada e o contêiner de teste foi removido.
- Nenhum endpoint, contrato, migration, schema, política de autorização ou
  arquivo do fluxo patrimonial foi alterado. Permanece pendente somente a
  homologação manual com tecnologia assistiva real.

## Objetivo

Adequar as telas Web independentes de movimentações já integradas à API para
reproduzir com fidelidade o protótipo de `Telas PC` no Figma. A consulta e o
detalhe permanecem disponíveis a `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`, mas
somente o Diretor de Patrimônio pode iniciar e confirmar movimentações.

Esta tarefa não altera o drawer de movimentação aberto no detalhe individual do
patrimônio. Esse fluxo já existe e deve permanecer funcional e visualmente
inalterado.

## Contexto e referências

- Requisitos: [RF01, RF13, RNF05 e UC13](../requisitos-SIPAT.md).
- Estado funcional existente:
  [WEB-MOVIMENTACOES-001](./WEB-MOVIMENTACOES-001-integrar-movimentacoes.md),
  [CONTRACTS-012](./CONTRACTS-012-contratos-movimentacoes.md) e
  [MOVIMENTACOES-001](./MOVIMENTACOES-001-transferir-consultar-patrimonios.md).
- Autorização: [política de movimentações](../security-and-access.md#movimentações--política-implementada).
- Integração e qualidade:
  [Web–API](../integrations/web-api/README.md),
  [responsividade, UX e acessibilidade](../apps/web/responsive-ux-and-accessibility.md)
  e [testes Web](../apps/web/testing-and-workflow.md).
- Roadmap: [aplicação Web](../apps/web/roadmap.md#movimentações).
- Protótipo obrigatório: abrir com
  [@Figma](plugin://figma@openai-curated-remote) o
  [arquivo fornecido](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&t=bV2ZOdKAFjE39sbT-1),
  selecionar a página `Telas PC` e reinspecionar o frame de cada objetivo antes
  de editar seu código. Descrições, capturas ou medidas registradas nesta tarefa
  não substituem a inspeção do arquivo vivo.

### Frames obrigatórios

| Objetivo | Referência no Figma                            | Node ID    |
| -------- | ---------------------------------------------- | ---------- |
| 1        | `Tela de movimentações`                        | `303:3229` |
| 2        | `Nova Movimentação`                            | `303:3471` |
| 3        | `Definição dos setores`                        | `303:3728` |
| 4        | revisão dentro do fluxo de `Nova movimentação` | `303:4123` |

Os nomes preservam a grafia do arquivo para facilitar a busca. O Figma é a
autoridade para composição, hierarquia, proporções, espaçamentos, tipografia,
cores, bordas, ícones e estados visuais. Requisitos, contratos e API são a
autoridade para dados, autorização, validação, erros e persistência.

O node `303:4123` identifica um elemento da composição de revisão, não um frame
independente. O implementador deve localizar seu frame ancestral no arquivo
vivo e comparar a composição completa, sem tratar o elemento isolado como a
tela inteira.

## Estado confirmado em 13/11/2026

- `/movimentacoes`, `/movimentacoes/nova` e
  `/movimentacoes/[movimentacaoId]` já consomem operações reais.
- O fluxo independente já possui seleção de até dez bens, definição de destinos,
  revisão, confirmação atômica, idempotência e recuperação de resultado incerto.
- O detalhe patrimonial já abre a movimentação de um único bem em drawer. Esse
  fluxo está fora desta tarefa, inclusive quando reutiliza componentes do fluxo
  independente.
- A API permite `GET /api/movimentacoes`, opções de filtro e
  `GET /api/movimentacoes/:movimentacaoId` aos dois perfis. Somente o Diretor
  acessa opções de registro e `POST /api/movimentacoes`.
- RF13 e a API já representam a regra solicitada. Não há divergência conhecida
  que justifique migration, alteração de banco, contrato ou endpoint.
- A tarefa anterior aprovou adaptações funcionais em relação ao desenho. Esta
  sucessora torna a paridade visual estrita um critério de aceite, preservando
  as adaptações semânticas exigidas pelos requisitos.

## Escopo e ordem de execução

### Objetivo 1 — lista compartilhada e autorização visível

1. Reproduzir o frame `Tela de movimentações` em `/movimentacoes`, dentro do
   shell autenticado existente.
2. Manter pesquisa, filtros reais, paginação, carregamento, vazio e erro. O
   Figma define a organização visual; o contrato define quais filtros existem.
   Não criar filtro ilustrativo sem contrato nem remover capacidade funcional
   para simplificar a aparência.
3. Permitir lista e acesso ao detalhe a Administrador e Diretor. Exibir `Nova
movimentação` somente ao Diretor; o Administrador não recebe botão oculto
   por CSS, controle desabilitado nem carregamento de opções de registro.
4. Preservar os filtros na URL, a ordem mais recente primeiro e a navegação por
   teclado. Quando as colunas não couberem, usar reflow ou overflow horizontal
   previsto sem ocultar informação.

### Objetivo 2 — seleção de bens exclusiva do Diretor

1. Reproduzir o frame `Nova Movimentação` como primeira etapa de
   `/movimentacoes/nova`: cabeçalho, stepper, busca, filtro por setor, tabela,
   seleção, contador e barra de ações devem seguir o protótipo.
2. Preservar o limite de 1 a 10 patrimônios distintos, seleção entre buscas e
   páginas, origem esperada e impedimentos de RF13. Nenhum estado visual
   substitui a revalidação da API.
3. Bloquear a rota para o Administrador antes de montar a experiência ou
   carregar catálogos. O acesso direto não deve produzir requests de registro.
4. Manter os dados ao avançar e voltar. Não realizar escrita nesta etapa.

### Objetivo 3 — destinos, comissão e motivo

1. Reproduzir o frame `Definição dos setores` como segunda etapa: stepper,
   bloco de dados comuns, tabela por patrimônio, destino individual, ação
   `aplicar a todos`, remoção e navegação inferior.
2. Manter comissão vigente e motivo obrigatórios e comuns à confirmação. Cada
   patrimônio conserva destino próprio; aplicar o mesmo destino é uma ajuda de
   preenchimento, não mudança de contrato.
3. Impedir destino igual à origem ou inativo, permitir origem histórica
   inativa e preservar campos corrigíveis após erro, conforme RF13.
4. Não copiar do protótipo data manual, código TR, opções meramente ilustrativas
   ou qualquer outro dado sem suporte no contrato.

### Objetivo 4 — revisão, confirmação e resultado

1. A partir do node `303:4123`, localizar e reproduzir a composição completa da
   revisão: retorno ao fluxo, hierarquia de títulos, cartão de dados comuns,
   resumo das transferências e ações finais.
2. Preservar o servidor como autoridade do instante. Se o Figma reservar uma
   posição para data, representar ali que data e horário serão registrados na
   confirmação; não criar campo editável nem enviar data pelo cliente.
3. Mostrar comissão, motivo, patrimônios, origens e destinos reais. Somente a
   confirmação explícita envia `POST`; voltar não grava nem descarta dados.
4. Preservar atomicidade, `origemEsperadaId`, chave idempotente, bloqueio de
   duplo envio, os três conflitos públicos e recuperação de resultado incerto,
   sem retry automático.
5. Após sucesso, apresentar a quantidade e os registros individuais retornados,
   atualizar as leituras afetadas e manter o padrão visual do protótipo. Não
   inventar lote, edição, estorno ou exclusão.

### Objetivo 5 — detalhe independente e regressão do drawer patrimonial

1. Manter `/movimentacoes/[movimentacaoId]` acessível aos dois perfis e somente
   para leitura, com os campos definidos por RF13 e suporte a reload, back e
   forward. O arquivo inspecionado não contém frame independente identificado
   para esse detalhe; não inventar uma nova composição em nome do Figma.
2. Harmonizar o detalhe apenas com primitives e padrões confirmados nos frames
   de movimentações, sem alterar informação, URL ou autorização.
3. Não alterar o drawer iniciado em `/patrimonios/[patrimonioId]`. Se a
   refatoração do componente compartilhado for necessária para as telas
   independentes, separar apresentação/variantes e provar que `modoDetalhe`
   mantém o comportamento e o visual anteriores.
4. O Administrador não recebe nenhuma ação de movimentação no detalhe
   independente nem no patrimônio; o Diretor conserva o drawer já entregue.

### Objetivo 6 — verificação visual, funcional e de regressão

1. Comparar lado a lado a implementação executada com cada referência no
   `@Figma` em 1920 × 1080. Corrigir diferenças de composição, medidas, cores,
   tipografia, ícones, estados e alinhamento dentro do escopo.
2. Verificar adaptação em 1536, 900 e 390 px, além de zoom a 200%, conteúdo
   longo, foco visível, teclado e reduced motion. O protótipo desktop não
   autoriza esconder dados ou ações necessárias em telas menores.
3. Cobrir ambos os perfis: consulta e detalhe para Administrador e Diretor;
   seleção, destinos, revisão e confirmação somente para Diretor; `403` da API
   para tentativa direta do Administrador.
4. Cobrir carregamento, vazio, erro, conflito de origem, resultado incerto,
   recuperação, sucesso, reload e navegação entre etapas. Reexecutar a regressão
   do drawer patrimonial sem promover esse fluxo ao escopo visual.

## Banco, contratos e API

Nenhuma alteração de banco, migration, contrato compartilhado ou API está
planejada. O estado atual já representa leitura compartilhada e mutação
exclusiva do Diretor.

Antes de qualquer alteração fora de `apps/web`, o implementador deve reproduzir
uma divergência concreta entre requisitos, contrato e comportamento vivo,
registrar a evidência e retornar ao planejador ou ao usuário. Não ampliar
response, endpoint, permissão ou persistência para simplificar o visual.

## Fora do escopo

- Alterar o drawer de movimentação do detalhe patrimonial.
- Migrations, modelos, seed, dados existentes ou schema Prisma.
- Novos endpoints, rotas específicas para Web ou relaxamento de autorização.
- Mudar limites, elegibilidade, atomicidade, idempotência, concorrência, fuso ou
  semântica das transferências.
- Edição, exclusão, estorno, agendamento, data manual, código TR ou lote de
  movimentações.
- Alterar telas mobile ou redesenhar patrimônios, inventários, empréstimos,
  reavaliações e outras features.
- Dados fictícios tratados como reais, sucesso otimista ou handlers sem
  operação HTTP real.

## Decisões aprovadas

- As telas independentes de consulta e detalhe são compartilhadas entre
  Administrador e Diretor; somente o Diretor acessa o fluxo de criação.
- Paridade visual com os quatro pontos obrigatórios do protótipo é critério de
  aceite. Diferença deliberada só é admitida para preservar requisito,
  contrato, acessibilidade ou segurança e deve ser registrada com evidência.
- O Figma deve ser aberto via `@Figma` em cada objetivo. Captura, descrição ou
  implementação anterior não substitui a inspeção do frame vivo.
- O Figma define o visual; RF13, contratos e API definem comportamento e dados.
  Paridade visual não autoriza data manual, TR ou outra semântica ilustrativa.
- A API continua sendo a barreira definitiva. O gate Web evita controles e
  requests incompatíveis, mas não substitui Guards.
- O drawer patrimonial está concluído e fica fora do escopo. Reuso de código não
  autoriza mudança visual ou funcional nesse consumidor.

## Critérios de aceite

- [x] Os quatro pontos obrigatórios foram reinspecionados no arquivo vivo pelo
      navegador integrado, conforme autorizado pelo usuário, e a
      implementação executada foi comparada lado a lado em 1920 × 1080.
- [x] `/movimentacoes` corresponde visualmente ao frame principal e funciona
      para os dois perfis com filtros, paginação e estados reais.
- [x] Somente o Diretor vê e acessa `Nova movimentação`; o gate ocorre antes de
      montar o fluxo ou carregar opções de registro.
- [x] Seleção, destinos e revisão correspondem aos frames e preservam todas as
      regras, dados corrigíveis e etapas da integração existente.
- [x] Data manual, código TR, lote de domínio e dados fictícios não foram
      introduzidos para reproduzir o protótipo.
- [x] O detalhe individual permanece compartilhado e somente leitura; chamadas
      diretas de criação pelo Administrador continuam recebendo `403`.
- [x] O drawer patrimonial não foi alterado e sua regressão funcional/visual
      foi verificada quando código compartilhado foi tocado.
- [x] Nenhum endpoint, contrato, migration ou schema foi alterado sem
      divergência reproduzida e nova decisão.
- [x] Loading, vazio, erro, conflito, resultado incerto, recuperação e sucesso
      são coerentes visual e funcionalmente, sem retry automático.
- [x] Teclado, foco, zoom, contraste, reflow, conteúdo longo e axe foram
      verificados nos fluxos afetados.

## Referências obrigatórias por objetivo

O agente implementador deve começar por esta tarefa, RF13 e
WEB-MOVIMENTACOES-001. Em seguida, deve abrir o frame vivo e somente o conjunto
do objetivo em execução.

1. **Lista compartilhada e autorização visível:**
   `apps/web/app/(sistema)/movimentacoes/page.tsx`,
   `apps/web/app/(sistema)/movimentacoes/loading.tsx`,
   `apps/web/features/movimentacoes/components/filtros-movimentacoes.tsx`,
   `apps/web/features/movimentacoes/presentation.ts`,
   `apps/web/features/movimentacoes/api/server-movimentacao-operations.ts`,
   `apps/web/lib/navigation/system-navigation.ts` e o frame `303:3229`.
2. **Seleção de bens:**
   `apps/web/app/(sistema)/movimentacoes/nova/page.tsx`,
   `apps/web/features/movimentacoes/components/nova-movimentacao.tsx`,
   `apps/web/features/patrimonios/api/hooks.ts`,
   `apps/web/features/patrimonios/api/patrimonio-operations.ts`,
   `packages/contracts/src/patrimonio/listar-patrimonios-query.schema.ts` e o
   frame `303:3471`.
3. **Destinos, comissão e motivo:**
   `apps/web/features/movimentacoes/components/nova-movimentacao.tsx`,
   `apps/web/features/movimentacoes/api/hooks.ts`,
   `apps/web/features/movimentacoes/api/movimentacao-operations.ts`,
   `packages/contracts/src/movimentacao/movimentacao.schema.ts`,
   `apps/web/components/ui/select.tsx`,
   `apps/web/components/ui/textarea.tsx` e o frame `303:3728`.
4. **Revisão, confirmação e resultado:**
   `apps/web/features/movimentacoes/components/nova-movimentacao.tsx`,
   `apps/web/features/movimentacoes/use-confirmacao-pendente.ts`,
   `apps/web/features/movimentacoes/api/hooks.ts`,
   `apps/web/features/movimentacoes/api/movimentacao-operations.ts`,
   `apps/web/lib/api/core/idempotencia.ts`,
   `packages/contracts/src/movimentacao/movimentacao.schema.ts` e o node
   `303:4123`, incluindo seu frame ancestral.
5. **Detalhe e regressão do drawer:**
   `apps/web/app/(sistema)/movimentacoes/[movimentacaoId]/page.tsx`,
   `apps/web/features/movimentacoes/api/server-movimentacao-operations.ts`,
   `apps/web/features/movimentacoes/presentation.ts`,
   `apps/web/features/patrimonios/components/patrimonio-acoes.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-acoes.test.tsx` e
   `apps/web/components/ui/drawer.tsx`. Os arquivos patrimoniais são referências
   de regressão, não alvos previstos.
6. **Verificação visual, funcional e de perfis:**
   `apps/web/e2e/movimentacoes.e2e.ts`,
   `apps/web/e2e/movimentacoes-real.e2e.ts`,
   `apps/web/playwright.movimentacoes-real.config.ts`,
   `apps/web/features/movimentacoes/tests/movimentacao-operations.test.ts`,
   `apps/api/test/movimentacoes-postgres.e2e-spec.ts`,
   `apps/api/src/modules/movimentacoes/movimentacoes.controller.ts` e todos os
   pontos obrigatórios no Figma.

Arquivos de API e banco são referências de verificação, não alvos previstos:
`apps/api/src/modules/movimentacoes/` e
`packages/database/prisma/schema.prisma`.

## Verificações esperadas

- `pnpm --filter @repo/web lint`
- `pnpm --filter @repo/web typecheck`
- `pnpm --filter @repo/web test`
- `pnpm --filter @repo/web build`
- E2E Web padrão de movimentações, perfis, navegação e drawer patrimonial.
- Percurso `movimentacoes-real` contra API e PostgreSQL descartável, sem usar a
  base de desenvolvimento.
- E2E de API focado na matriz `GET` compartilhado versus `POST` exclusivo do
  Diretor se a autorização for tocada ou para provar a regressão completa.
- Comparação manual com Figma em 1920 × 1080 e revisão responsiva em 1536, 900 e
  390 px, com zoom a 200%, teclado e axe.
- `pnpm format:check`, links relativos e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Divergência material entre protótipo, requisitos e comportamento
  vivo deve retornar ao planejador antes de mudar comportamento externo.
