# WEB-REAVALIACOES-002 — paridade visual do fluxo de reavaliações

**Status:** implementada em 13/11/2026; verificação automatizada concluída

## Objetivo

Adequar o fluxo Web de reavaliações já integrado à API para reproduzir com
fidelidade os frames de `Telas PC` no Figma, mantendo a consulta disponível a
`ADMINISTRADOR` e `DIRETOR_PATRIMONIO` e toda ação de reavaliação exclusiva do
Diretor de Patrimônio.

## Contexto e referências

- Requisitos: [RF01, RF14, RNF05 e UC14](../requisitos-SIPAT.md).
- Estado funcional existente:
  [WEB-REAVALIACOES-001](./WEB-REAVALIACOES-001-interface-reavaliacoes.md),
  [CONTRACTS-014](./CONTRACTS-014-contratos-reavaliacoes.md) e
  [REAVALIACOES-001](./REAVALIACOES-001-api-persistencia-reavaliacoes.md).
- Integrações relacionadas:
  [Web–API](../integrations/web-api/README.md) e
  [WEB-PATRIMONIOS-001](./WEB-PATRIMONIOS-001-pesquisa-detalhe-acoes.md).
- Roadmap: [aplicação Web](../apps/web/roadmap.md#reavaliações) e
  [roadmap geral](../roadmap.md#pesquisa-e-detalhe-patrimonial-na-web).
- Protótipo obrigatório: abrir com
  [@Figma](plugin://figma@openai-curated-remote) o
  [arquivo fornecido](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&t=bV2ZOdKAFjE39sbT-1),
  selecionar a página `Telas PC` e reinspecionar cada frame antes de implementar
  o objetivo correspondente. Descrições neste documento não substituem a
  inspeção visual do arquivo vivo.

### Frames obrigatórios

| Objetivo | Frame no Figma                                   | Node ID    |
| -------- | ------------------------------------------------ | ---------- |
| 1        | `Tela Reavaliação`                               | `307:8149` |
| 2        | `Nova reavaliação`                               | `307:8651` |
| 2        | `Nova reavaliação dados`                         | `307:8914` |
| 3        | `Detalhe da reavaliaçao`                         | `307:8374` |
| 4        | `Re-Avaliação integrada a pesuisa de patrimonio` | `298:1489` |

Os nomes preservam a grafia encontrada no arquivo para facilitar a busca. O
Figma é autoridade para composição, hierarquia, espaçamento, tipografia,
cores, dimensões, ícones e estados visuais. Requisitos, contratos e API são
autoridade para dados, regras, autorização e erros.

## Estado confirmado em 12/11/2026

- `/reavaliacoes`, `/reavaliacoes/nova` e
  `/reavaliacoes/[reavaliacaoId]` já usam operações e dados reais.
- O detalhe patrimonial já abre a reavaliação de um único bem em drawer e
  preserva o patrimônio selecionado.
- A API permite `GET /api/reavaliacoes` e
  `GET /api/reavaliacoes/:reavaliacaoId` aos dois perfis; somente o Diretor
  acessa `POST /api/reavaliacoes/previa` e `POST /api/reavaliacoes`.
- Contratos, persistência, idempotência, prévia, cálculo decimal e histórico já
  estão implementados. A tarefa anterior excluiu explicitamente a reprodução
  visual do Figma; esta tarefa cobre esse desvio, sem reimplementar o domínio.

## Escopo e ordem de execução

### Objetivo 1 — Lista compartilhada e autorização visível

1. Reproduzir o frame `Tela Reavaliação` na rota `/reavaliacoes`, usando o shell
   autenticado e os componentes/tokens existentes sempre que forem capazes de
   representar o protótipo com fidelidade.
2. Manter pesquisa, filtros suportados pelo contrato, paginação, carregamento,
   vazio e erro com dados reais. Não criar filtros ilustrados no Figma que não
   possuam contrato nem remover filtros funcionais sem decisão de produto; a
   composição deve acomodar os campos reais no mesmo padrão visual.
3. Exibir lista e acesso ao detalhe para Administrador e Diretor. Exibir o
   comando `Nova reavaliação` somente ao Diretor; o Administrador não recebe
   botão oculto por CSS, controle desabilitado nem requisição de catálogos de
   criação.
4. Preservar URL, filtros e paginação ao abrir e fechar o detalhe. A lista deve
   permanecer navegável por teclado e legível em overflow horizontal quando a
   largura não comportar as colunas.

### Objetivo 2 — Criação exclusiva do Diretor em etapas

1. Reproduzir os frames `Nova reavaliação` e `Nova reavaliação dados`, mantendo
   o fluxo selecionar bens → preencher dados comuns e parâmetros por bem →
   revisar a prévia → confirmar.
2. Preservar os limites e dados reais: 1 a 20 bens distintos, data de referência
   no mês corrente até hoje em `America/Sao_Paulo`, comissão elegível, novo
   valor bruto, vida útil e residual em valor ou percentual.
3. Reutilizar `PreviaReavaliacaoBodySchema`, `CriarReavaliacaoBodySchema`,
   `versaoEsperada`, chave de idempotência e tratamento dos três conflitos
   públicos. Não calcular ou confirmar no navegador um resultado que pertence
   à API e não repetir mutação automaticamente.
4. Preservar formulário, patrimônio e chave quando o resultado permanecer
   incerto. Erros conclusivos devem manter os campos corrigíveis e levar foco
   para a mensagem aplicável.
5. Bloquear `/reavaliacoes/nova` para o Administrador antes de montar o fluxo ou
   carregar catálogos. A API continua como barreira definitiva para chamadas
   diretas.

### Objetivo 3 — Detalhe compartilhado em painel lateral

1. Reproduzir o frame `Detalhe da reavaliaçao`: lista ao fundo, overlay e painel
   lateral direito com patrimônio, snapshots anterior/novo, comissão, data,
   autor e valores calculados retornados pela API.
2. Preservar `/reavaliacoes/[reavaliacaoId]` como URL compartilhável e válida em
   reload. Na navegação iniciada pela lista, usar rota interceptada e slot
   paralelo somente se isso for necessário para manter simultaneamente a lista
   e o painel sem duplicar consultas ou estado. A referência oficial é
   [Parallel Routes — Modals](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes#modals).
3. Reutilizar o `Drawer`/`Dialog` acessível existente: nome e descrição, foco
   contido, fechamento por botão e `Esc`, devolução do foco ao item acionador e
   rolagem interna. O fechamento deve voltar à lista com filtros preservados.
4. Administrador e Diretor veem os mesmos dados públicos do registro. O painel
   é somente leitura para ambos; não criar edição, exclusão, estorno ou nova
   mutação a partir do histórico.

### Objetivo 4 — Reavaliação integrada ao detalhe do patrimônio

1. Reproduzir o frame `Re-Avaliação integrada a pesuisa de patrimonio` no
   drawer aberto por `Reavaliar` em `/patrimonios/[patrimonioId]`.
2. Manter o bem do detalhe fixo e identificado; não permitir pesquisar, trocar
   ou remover o patrimônio dentro do drawer. Reutilizar o mesmo componente e as
   mesmas operações do Objetivo 2 com exatamente um item.
3. Exibir o acionador e montar o drawer somente para o Diretor. O Administrador
   consulta o patrimônio e o histórico, mas não recebe controles nem requests
   de mutação.
4. Após sucesso, fechar o drawer, atualizar detalhe e histórico por nova leitura,
   devolver o foco ao gatilho e anunciar o resultado. Durante confirmação,
   impedir duplo envio e fechamento acidental.

### Objetivo 5 — Verificação visual, funcional e de regressão

1. Comparar a implementação executada, não apenas o código, com cada frame no
   `@Figma` em 1920 × 1080. Corrigir diferenças de composição, medidas, cores,
   tipografia, ícones, estados e alinhamento dentro do escopo.
2. Verificar adaptação sem perda funcional em 1536, 900 e 390 px, preservando
   reflow, scroll previsto, foco visível e alvos operáveis. O protótipo desktop
   não autoriza esconder informação ou ação necessária em telas menores.
3. Cobrir ambos os perfis: consulta e detalhe para Administrador e Diretor;
   criação e drawer integrado somente para Diretor; `403` da API para tentativa
   direta do Administrador.
4. Cobrir estados carregando, vazio, erro, preview desatualizado, conflito,
   resultado incerto e sucesso, além de back/forward, reload, teclado e axe.

## Banco, contratos e API

Nenhuma alteração de banco, migration, contrato compartilhado ou API está
planejada. O estado atual já representa a regra aprovada de leitura
compartilhada e mutação exclusiva do Diretor.

Antes de qualquer alteração fora de `apps/web`, o implementador deve reproduzir
uma divergência concreta entre requisitos, contrato e comportamento vivo,
registrar a evidência e retornar ao planejador/usuário. Não ampliar responses,
endpoints, permissões ou persistência apenas para simplificar a composição
visual.

## Fora do escopo

- Migrations, novos modelos, seed ou alteração de dados existentes.
- Novos endpoints, rotas específicas para Web, mudanças aditivas de response ou
  relaxamento de autorização sem divergência comprovada e decisão posterior.
- Alterar cálculo, limites, elegibilidade, idempotência, concorrência, fuso,
  semântica contábil ou histórico de reavaliação.
- Edição, exclusão, estorno, upload, PDF ou relatório novo.
- Alterar as telas mobile ou redesenhar depreciações, movimentações, baixas e
  outros fluxos patrimoniais.
- Dados fictícios, sucesso otimista ou handlers sem operação real.

## Decisões aprovadas

- A tela e o detalhe de reavaliações são compartilhados por Administrador e
  Diretor; somente o Diretor inicia, preenche, gera prévia e confirma.
- A paridade visual com o protótipo é critério de aceite, não sugestão. Diferença
  deliberada só é aceita quando necessária para preservar requisito, contrato,
  acessibilidade ou segurança, e deve ser registrada com evidência.
- O Figma deve ser aberto via `@Figma` por objetivo. Screenshot ou descrição
  copiada para a tarefa não substitui a inspeção dos frames vivos.
- A API permanece autoridade para autorização e domínio; o gate Web evita
  controles e requests incompatíveis, mas não substitui os Guards.
- Componentes funcionais e operações existentes devem ser refatorados e
  reutilizados; não duplicar cliente HTTP, schema, idempotência ou formulário
  completo para o drawer patrimonial.

## Critérios de aceite

- [ ] Os cinco frames obrigatórios foram reinspecionados no `@Figma` e a
      implementação executada foi comparada lado a lado em 1920 × 1080.
- [x] `/reavaliacoes` corresponde visualmente ao frame principal e funciona
      para os dois perfis com filtros, paginação e estados reais.
- [x] Somente o Diretor vê e acessa `Nova reavaliação`; o gate ocorre antes de
      montar o formulário ou carregar catálogos.
- [x] O fluxo de criação corresponde aos dois frames, preserva preview,
      idempotência, dados corrigíveis e confirmação real da API.
- [x] O detalhe corresponde ao painel lateral do Figma, possui URL profunda,
      suporta reload/back/forward e é somente leitura para ambos os perfis.
- [x] A reavaliação iniciada no patrimônio corresponde ao drawer do Figma,
      mantém exatamente um bem fixo e existe somente para o Diretor.
- [x] Administrador recebe `403` ao chamar diretamente prévia ou criação; as
      leituras aplicáveis continuam permitidas conforme contrato.
- [x] Nenhum dado ilustrativo, endpoint novo, migration ou alteração de schema
      foi introduzido para atender ao visual.
- [x] Loading, vazio, erro, conflito, resultado incerto e sucesso são coerentes
      visual e funcionalmente, sem retry automático de mutação.
- [x] Teclado, foco, `Esc`, restauração de foco, contraste, reflow e axe foram
      verificados nos fluxos afetados.

O primeiro item permanece aberto: os cinco frames foram reinspecionados no
arquivo vivo e a implementação foi exercitada em 1536, 900 e 390 px, mas a
comparação lado a lado em 1920 × 1080 não foi registrada. Por decisão do usuário
durante a execução, o drawer patrimonial do Objetivo 4 já estava pronto e foi
preservado; o escopo implementado foi a experiência independente. Para o detalhe,
a rota canônica renderiza lista e painel em conjunto, sem slot paralelo, evitando
que o segmento dinâmico capture `/reavaliacoes/nova`.

## Referências obrigatórias por objetivo

O agente implementador deve começar por este documento e pelo frame indicado;
depois, abrir somente o conjunto do objetivo em execução.

1. **Lista e autorização visível:**
   `apps/web/app/(sistema)/reavaliacoes/page.tsx`,
   `apps/web/app/(sistema)/reavaliacoes/loading.tsx`,
   `apps/web/features/reavaliacoes/components/filtros-reavaliacoes.tsx`,
   `apps/web/features/reavaliacoes/presentation.ts`,
   `apps/web/features/reavaliacoes/api/server-reavaliacao-operations.ts`,
   `apps/web/lib/navigation/system-navigation.ts` e o frame `307:8149`.
2. **Criação em etapas:**
   `apps/web/app/(sistema)/reavaliacoes/nova/page.tsx`,
   `apps/web/features/reavaliacoes/components/nova-reavaliacao.tsx`,
   `apps/web/features/reavaliacoes/api/hooks.ts`,
   `apps/web/features/reavaliacoes/api/reavaliacao-operations.ts`,
   `packages/contracts/src/reavaliacao-patrimonio/reavaliacao.schema.ts`,
   `apps/web/lib/api/client/use-mutacao-sem-repeticao.ts` e os frames
   `307:8651` e `307:8914`.
3. **Detalhe lateral compartilhado:**
   `apps/web/app/(sistema)/reavaliacoes/[reavaliacaoId]/page.tsx`,
   `apps/web/app/(sistema)/reavaliacoes/page.tsx`,
   `apps/web/components/ui/drawer.tsx`,
   `apps/web/components/ui/dialog.tsx`,
   `apps/web/features/reavaliacoes/api/server-reavaliacao-operations.ts`,
   `apps/web/features/reavaliacoes/presentation.ts` e o frame `307:8374`.
4. **Integração patrimonial:**
   `apps/web/features/patrimonios/components/patrimonio-acoes.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-acoes.test.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-detalhe.tsx`,
   `apps/web/features/reavaliacoes/components/nova-reavaliacao.tsx`,
   `apps/web/components/ui/drawer.tsx` e o frame `298:1489`.
5. **Verificação e regressão:**
   `apps/web/e2e/reavaliacoes-real.e2e.ts`,
   `apps/web/playwright.reavaliacoes-real.config.ts`,
   `apps/api/src/modules/reavaliacoes/tests/reavaliacoes.service.spec.ts`,
   `apps/api/test/reavaliacoes-postgres.e2e-spec.ts`,
   `apps/web/features/reavaliacoes/`,
   `apps/web/features/patrimonios/components/patrimonio-acoes.test.tsx` e todos
   os cinco frames obrigatórios.

Arquivos de API e banco são referências de verificação, não alvos previstos:
`apps/api/src/modules/reavaliacoes/reavaliacoes.controller.ts`,
`apps/api/src/modules/reavaliacoes/` e
`packages/database/prisma/schema.prisma`.

## Verificações esperadas

- `pnpm --filter @repo/web lint`
- `pnpm --filter @repo/web typecheck`
- `pnpm --filter @repo/web test`
- `pnpm --filter @repo/web build`
- E2E Web padrão dos perfis e navegação afetada.
- Percurso `reavaliacoes-real` contra API e PostgreSQL descartável, sem usar a
  base de desenvolvimento.
- E2E de API focado na matriz `GET` compartilhado versus `POST` exclusivo do
  Diretor somente se o código de autorização for tocado ou para provar a
  regressão completa.
- Comparação manual com Figma em 1920 × 1080 e revisão responsiva em 1536, 900 e
  390 px, incluindo teclado e axe.
- `pnpm format:check`, links relativos e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Divergência material entre o protótipo, os requisitos e o estado
  funcional deve retornar ao planejador antes de mudar comportamento externo.
