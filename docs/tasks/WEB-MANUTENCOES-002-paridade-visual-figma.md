# WEB-MANUTENCOES-002 — paridade visual das telas de manutenções

**Status:** implementada e verificada em 13/11/2026

## Objetivo

Adequar as telas Web de manutenções já integradas à API para reproduzir com
fidelidade o protótipo de `Telas PC` no Figma. `ADMINISTRADOR` e
`DIRETOR_PATRIMONIO` devem possuir exatamente as mesmas permissões em todo o
ciclo: consultar, criar, configurar ou revisar orçamento, anexar e abrir
documentos e registrar o retorno de cada bem.

## Contexto e referências

- Requisitos: [RF18, RNF05 e UC18](../requisitos-SIPAT.md).
- Estado funcional existente:
  [WEB-MANUTENCOES-001](./WEB-MANUTENCOES-001-interface-manutencoes.md),
  [CONTRACTS-013](./CONTRACTS-013-contratos-manutencoes.md) e
  [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md).
- Autorização:
  [manutenção patrimonial](../security-and-access.md#manutenção-patrimonial).
- Integração e qualidade:
  [Web–API](../integrations/web-api/README.md),
  [responsividade, UX e acessibilidade](../apps/web/responsive-ux-and-accessibility.md)
  e [testes Web](../apps/web/testing-and-workflow.md).
- Roadmap: [aplicação Web](../apps/web/roadmap.md#manutenção-de-patrimônios).
- Protótipo obrigatório: abrir no navegador integrado o
  [arquivo fornecido](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&t=bV2ZOdKAFjE39sbT-1),
  selecionar `Telas PC` e reinspecionar a referência de cada objetivo antes de
  editar seu código. Descrições, capturas e medidas registradas nesta tarefa não
  substituem a inspeção do arquivo vivo.

### Referências obrigatórias no Figma

| Objetivo | Referência no arquivo                         | Node ID     |
| -------- | --------------------------------------------- | ----------- |
| 1        | `Manutençoes ja realizadas`                   | `303:7544`  |
| 2        | `Novo pedido de manutenção`, estado vazio     | `343:43521` |
| 2        | `Novo pedido de manutenção`, bens adicionados | `211:5941`  |
| 2        | `Adicionar bens ao pedido`                    | `211:6393`  |
| 2        | `Configurar atendimento do item`              | `211:6665`  |
| 3        | `Pedido realizado`                            | `306:7952`  |
| 4        | `Pedido parcilamente retornado`               | `212:8073`  |
| 4        | `Registrar retorno do bem`                    | `212:7784`  |

Os nomes preservam a grafia encontrada no arquivo para facilitar a busca. Os
nodes `211:6393`, `211:6665` e `212:7784` identificam textos dentro de
composições sobrepostas. O implementador deve localizar e comparar o modal ou
painel ancestral completo, não reproduzir apenas o elemento selecionado.

O Figma é a autoridade para composição, hierarquia, proporções, espaçamentos,
tipografia, cores, bordas, ícones e estados visuais. RF18, contratos e API são
a autoridade para dados, regras, autorização, validação, erros e persistência.

## Estado confirmado em 13/11/2026

- `/manutencoes`, `/manutencoes/nova` e
  `/manutencoes/[manutencaoId]` já usam contratos e operações reais.
- A entrega `WEB-MANUTENCOES-001` implementou lista, criação, detalhe,
  orçamento, retorno, documentos, idempotência e o percurso Web–API–PostgreSQL,
  mas excluiu explicitamente a reprodução visual do Figma.
- RF18 e UC18 atribuem o gerenciamento a Administrador e Diretor. Todas as
  rotas de `ManutencoesController`, inclusive mutações e documentos, já aceitam
  os dois perfis. Não existe divergência conhecida que justifique alterar
  banco, contrato ou API.
- A tela atual concentra formulários extensos no detalhe e apresenta a criação
  em um formulário contínuo. A tarefa sucessora pode reorganizar a apresentação
  e as fronteiras de componentes, mas deve preservar operações, payloads,
  limites, regras e recuperação de resultado incerto.

## Escopo e ordem de execução

### Objetivo 1 — listagem compartilhada e fiel ao protótipo

1. Reproduzir `Manutençoes ja realizadas` em `/manutencoes`, dentro do shell
   autenticado existente: cabeçalho, ação principal, bloco de pesquisa, filtros,
   tabela, badges, documentos e ações devem seguir o frame vivo.
2. Manter somente filtros e campos suportados pelo contrato real, paginação,
   ordem mais recente primeiro e estados de carregamento, vazio, erro e filtros
   inválidos. Não inventar dado ilustrativo para preencher coluna do protótipo.
3. Administrador e Diretor devem ver a mesma listagem, o mesmo botão `Novo
pedido` e as mesmas ações. Não criar controle oculto por CSS, desabilitado ou
   condicionado ao perfil para qualquer operação de manutenção.
4. Preservar filtros na URL, navegação por teclado e informação completa quando
   a largura exigir reflow ou overflow horizontal.

### Objetivo 2 — novo pedido, seleção e configuração dos bens

1. Reproduzir os dois estados de `Novo pedido de manutenção` e as composições
   `Adicionar bens ao pedido` e `Configurar atendimento do item` em
   `/manutencoes/nova`.
2. Manter os dados reais de RF18: data de envio não futura em
   `America/Sao_Paulo`, comissão vigente, justificativa opcional e de 1 a 50
   patrimônios ativos e distintos. Por item, preservar tipo, fornecedor ativo,
   previsão, problema e orçamento inicial opcional.
3. O seletor deve permitir buscar e manter a seleção enquanto o modal estiver
   aberto. A configuração deve permanecer individual por bem; fechar, voltar ou
   corrigir erro não pode descartar silenciosamente os demais itens.
4. Reutilizar `CriarManutencaoBodySchema`, chave idempotente e tratamento dos
   três conflitos públicos. Não repetir mutação automaticamente nem converter
   resultado incerto em sucesso otimista.
5. PDF comum do pedido continua opcional e é enviado pela operação existente
   após a criação do agregado. Se o visual antecipar o arquivo no formulário,
   a implementação deve deixar explícita a ordem real e informar criação
   confirmada com upload falho, sem alterar o contrato para simplificar a UI.
6. Administrador e Diretor percorrem exatamente o mesmo fluxo, carregam os
   mesmos catálogos e recebem os mesmos controles e estados.

### Objetivo 3 — detalhe, orçamento e documentos compartilhados

1. Reproduzir `Pedido realizado` em
   `/manutencoes/[manutencaoId]`: dados do pedido, PDF, atendimentos por item,
   situação, totais, motivo e ações devem respeitar a composição viva.
2. Preservar URL profunda, reload, back/forward e nova leitura após mutação.
   Lista e detalhe continuam disponíveis integralmente aos dois perfis.
3. Configuração ou revisão de orçamento deve usar a apresentação prevista para
   o atendimento por item, preservando versões anteriores, `versaoEsperada`,
   fornecedor e bloqueio depois do retorno. A API continua decidindo conflitos
   e elegibilidade.
4. Documentos do pedido e dos itens permanecem privados, autenticados e
   associados às fases `PEDIDO`, `ENVIO` ou `RECEBIMENTO`. Não expor caminho de
   armazenamento nem abrir URL pública; falha de upload não desfaz mutação já
   confirmada.
5. Não criar edição ou exclusão do pedido, remoção de documento, estorno ou
   alteração direta do patrimônio. Essas capacidades não existem em RF18 nem
   nos contratos atuais.

### Objetivo 4 — retorno individual e estados do ciclo

1. Reproduzir `Registrar retorno do bem` a partir da ação de um item pendente,
   localizando a composição ancestral completa no Figma.
2. Preservar retorno individual e único, data válida desde o envio até hoje,
   descrição do serviço, valor realizado, garantia opcional e PDFs da fase de
   recebimento. Não concluir outros itens junto com a mesma confirmação.
3. Após sucesso, atualizar o detalhe por nova leitura e reproduzir o estado
   `Pedido parcilamente retornado` enquanto houver item pendente. O pedido só
   fica concluído quando todos retornarem, conforme resposta da API.
4. Itens retornados ficam somente leitura para novas revisões ou novo retorno;
   itens pendentes mantêm as ações aplicáveis. Foco, anúncio de sucesso e
   retorno ao acionador devem permanecer previsíveis.
5. Administrador e Diretor possuem a mesma ação de retorno e o mesmo acesso aos
   estados parcial e concluído. A Web não deve introduzir matriz mais restritiva
   que RF18 e os Guards existentes.

### Objetivo 5 — verificação visual, funcional e de regressão

1. Comparar lado a lado a implementação executada com cada referência no Figma
   em 1920 × 1080. Corrigir diferenças de composição, medidas, cores,
   tipografia, ícones, estados e alinhamento dentro do escopo.
2. Verificar adaptação em 1536, 900 e 390 px, zoom a 200%, conteúdo longo, foco
   visível, teclado e reduced motion. O protótipo desktop não autoriza esconder
   informação ou ação necessária em telas menores.
3. Exercitar o ciclo completo separadamente como Administrador e Diretor:
   listar, filtrar, criar com dois bens, anexar PDF, revisar orçamento, retornar
   um item, observar o estado parcial, retornar o último e observar a conclusão.
4. Cobrir carregamento, vazio, erro, validação, upload falho após mutação,
   conflito, resultado incerto, recuperação, sucesso, reload e navegação.
5. Confirmar por HTTP real que ambos os perfis continuam autorizados em todas
   as operações. Não usar a base de desenvolvimento no percurso E2E.

## Banco, contratos e API

Nenhuma alteração de banco, migration, contrato compartilhado ou API está
planejada. O estado confirmado já representa RF18 e UC18, inclusive a igualdade
de permissões entre Administrador e Diretor.

Antes de qualquer alteração fora de `apps/web`, o implementador deve reproduzir
uma divergência concreta entre requisitos, contrato e comportamento vivo,
registrar a evidência e retornar ao planejador ou ao usuário para nova decisão.
Não ampliar response, endpoint, permissão ou persistência para simplificar a
composição visual. Diferença apenas entre a UI atual e o Figma deve ser resolvida
na Web.

## Fora do escopo

- Migrations, modelos, seed, dados existentes ou schema Prisma.
- Novos endpoints, rotas específicas para Web, relaxamento de autorização ou
  alteração do contrato público sem divergência comprovada e decisão posterior.
- Mudar limites, elegibilidade, histórico de orçamentos, idempotência,
  concorrência, fuso, bloqueios de inventário ou transições patrimoniais.
- Edição ou exclusão de pedido, estorno de retorno, remoção de documento,
  alteração automática do valor patrimonial ou manutenção em lote posterior à
  criação.
- Alterar telas mobile ou redesenhar patrimônios, empréstimos, inventários,
  movimentações, reavaliações e outras features.
- Dados fictícios tratados como reais, handlers sem operação HTTP ou sucesso
  otimista.

## Decisões aprovadas

- Administrador e Diretor possuem as mesmas permissões em todas as telas e
  ações de manutenção. O perfil não diferencia controles, catálogos, requests
  ou estados desta feature.
- Paridade visual com as referências obrigatórias é critério de aceite.
  Diferença deliberada só é admitida para preservar requisito, contrato,
  acessibilidade ou segurança e deve ser registrada com evidência.
- O Figma vivo deve ser reinspecionado por objetivo. Captura, descrição deste
  documento ou implementação anterior não substitui essa inspeção.
- O Figma define o visual; RF18, contratos e API definem semântica e dados. Um
  elemento ilustrativo sem suporte funcional deve ser adaptado ao dado real no
  mesmo padrão visual, não transformado silenciosamente em nova regra.
- A API permanece a barreira definitiva de autorização. A igualdade visual na
  Web não substitui os Guards nem autoriza enfraquecer autenticação, CSRF ou
  validações do servidor.
- Componentes e operações existentes devem ser refatorados e reutilizados. Não
  duplicar cliente HTTP, schemas, idempotência ou formulários completos para
  modais.

## Critérios de aceite

- [x] Todas as oito referências foram reinspecionadas no arquivo vivo e a
      implementação foi comparada lado a lado em 1920 × 1080.
- [x] `/manutencoes` corresponde visualmente ao frame principal e mantém
      filtros, paginação e estados reais.
- [x] Administrador e Diretor veem e executam exatamente as mesmas ações em
      lista, criação, detalhe, orçamento, documentos e retorno.
- [x] O fluxo de criação corresponde aos estados e sobreposições do Figma e
      preserva itens, validação, PDF, idempotência e resultado incerto.
- [x] O detalhe e os estados parcial/concluído correspondem ao protótipo sem
      perder histórico de orçamento, documentos ou regras por item.
- [x] Retorno permanece individual e único; itens já retornados não oferecem
      ações inválidas.
- [x] Nenhum endpoint, contrato, migration, schema ou permissão foi alterado sem
      divergência reproduzida e nova decisão.
- [x] Loading, vazio, erro, upload parcial, conflito, recuperação e sucesso são
      coerentes visual e funcionalmente, sem retry automático de mutação.
- [x] Teclado, foco, zoom, contraste, reflow, conteúdo longo e axe foram
      verificados nos fluxos afetados.

## Referências obrigatórias por objetivo

O agente implementador deve começar por esta tarefa, RF18 e
WEB-MANUTENCOES-001. Depois deve abrir no Figma a referência do objetivo e
somente então ler o conjunto de arquivos correspondente.

1. **Listagem compartilhada:**
   `apps/web/app/(sistema)/manutencoes/page.tsx`,
   `apps/web/features/manutencoes/api/server-manutencao-operations.ts`,
   `apps/web/features/manutencoes/components/erro-manutencao.tsx`,
   `packages/contracts/src/manutencao/manutencao.schema.ts`,
   `apps/web/lib/navigation/system-navigation.ts` e o frame `303:7544`.
2. **Novo pedido, bens e atendimento:**
   `apps/web/app/(sistema)/manutencoes/nova/page.tsx`,
   `apps/web/features/manutencoes/components/novo-pedido.tsx`,
   `apps/web/features/manutencoes/api/manutencao-operations.ts`,
   `packages/contracts/src/manutencao/manutencao.schema.ts`,
   `apps/web/lib/api/core/idempotencia.ts`,
   `apps/web/components/ui/dialog.tsx`,
   `apps/web/components/ui/table.tsx` e os nodes `343:43521`, `211:5941`,
   `211:6393` e `211:6665`, incluindo os ancestrais das sobreposições.
3. **Detalhe, orçamento e documentos:**
   `apps/web/app/(sistema)/manutencoes/[manutencaoId]/page.tsx`,
   `apps/web/features/manutencoes/components/detalhe-pedido.tsx`,
   `apps/web/features/manutencoes/api/manutencao-operations.ts`,
   `apps/web/features/manutencoes/api/server-manutencao-operations.ts`,
   `apps/web/components/ui/dialog.tsx`,
   `apps/web/components/ui/table.tsx` e o frame `306:7952`.
4. **Retorno e estados do ciclo:**
   `apps/web/features/manutencoes/components/detalhe-pedido.tsx`,
   `apps/web/features/manutencoes/components/erro-manutencao.tsx`,
   `apps/web/features/manutencoes/api/manutencao-operations.ts`,
   `packages/contracts/src/manutencao/manutencao.schema.ts`,
   `apps/web/lib/api/core/idempotencia.ts`,
   `apps/web/components/ui/dialog.tsx` e os nodes `212:8073` e `212:7784`,
   incluindo o ancestral da sobreposição.
5. **Verificação visual, funcional e de perfis:**
   `apps/web/e2e/manutencoes-real.e2e.ts`,
   `apps/web/playwright.manutencoes-real.config.ts`,
   `apps/api/test/manutencoes-postgres.e2e-spec.ts`,
   `apps/api/test/manutencoes-postgres.spec.ts`,
   `apps/api/src/modules/manutencoes/manutencoes.controller.ts`,
   `apps/web/features/manutencoes/` e todas as referências obrigatórias no
   Figma.

Arquivos de API e banco são referências de verificação, não alvos previstos:
`apps/api/src/modules/manutencoes/` e
`packages/database/prisma/schema.prisma`.

## Verificações esperadas

- `pnpm --filter @repo/web lint`
- `pnpm --filter @repo/web typecheck`
- `pnpm --filter @repo/web test`
- `pnpm --filter @repo/web build`
- E2E Web dos dois perfis, navegação, modais, teclado e estados afetados.
- Percurso `manutencoes-real` contra API e PostgreSQL descartável, sem usar ou
  popular a base de desenvolvimento.
- Suíte HTTP/PostgreSQL de manutenção quando necessária para provar a matriz
  idêntica dos perfis ou se código de autorização for tocado.
- Comparação manual com Figma em 1920 × 1080 e revisão responsiva em 1536, 900
  e 390 px, com zoom a 200%, teclado e axe.
- `pnpm format:check`, links relativos e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Divergência material entre protótipo, requisitos e comportamento
  vivo deve retornar ao planejador antes de mudar comportamento externo.

## Verificação executada em 13/11/2026

- As oito referências de `Telas PC` foram abertas no arquivo vivo e comparadas
  com capturas da implementação em 1920 × 1080; também foram revisados 1536,
  900 e 390 px e zoom de 200%.
- O percurso real passou separadamente como Diretor e Administrador contra API
  e PostgreSQL descartável, incluindo dois bens, PDF, versões de orçamento,
  retorno parcial, conclusão, resultado incerto, idempotência e recuperação de
  upload falho após criação confirmada.
- Teclado, devolução de foco ao fechar modal, `prefers-reduced-motion`, ausência
  de overflow da página em 390 px e axe sem violações foram verificados no
  navegador.
- Passaram lint, typecheck, 115 testes Web, build Next.js, formatação,
  `git diff --check` e as duas suítes HTTP/PostgreSQL de manutenção (6 testes).
- Banco, migrations, contratos compartilhados, API e matriz de autorização não
  foram alterados.
