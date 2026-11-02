# WEB-PATRIMONIOS-001 — Pesquisa, detalhe e ações patrimoniais

**Status:** implementada — validação E2E Web real e comparação visual completa
com o Figma pendentes

## Objetivo

Substituir a prévia estática de `/patrimonios` por uma consulta Web integrada e
uma tela individual do bem que permita consultar seus dados e histórico, gerar
sua ficha em PDF e, quando a sessão for de `DIRETOR_PATRIMONIO`, iniciar
movimentação, reavaliação, baixa e substituição do número patrimonial.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md), [Web](../apps/web/roadmap.md) e
  [contratos](../contracts/roadmap.md).
- Requisitos e decisões: [RF10–RF12, RF17, RF20 e RF21](../requisitos-SIPAT.md),
  [segurança e acesso](../security-and-access.md) e
  [integração Web–API](../integrations/web-api/README.md).
- Capacidades existentes: `PATRIMONIOS-002`, `PATRIMONIOS-003`,
  `MOVIMENTACOES-001`, `REAVALIACOES-001`, `BAIXAS-001` e
  [RELATORIOS-003](./RELATORIOS-003-pdf.md).
- Protótipo obrigatório: abrir com [@Figma](plugin://figma@openai-curated-remote)
  o [arquivo fornecido](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&t=boz1IfFBvEjQhObJ-1).
  O link entra em `Telas Mobile`, mas esta tarefa deve usar a página `Telas PC`
  e inspecionar os frames listados abaixo. O Figma é evidência visual de leitura;
  contratos e regras de negócio continuam nas fontes versionadas.

### Frames Web de referência

| Finalidade   | Frame                 | Node ID    |
| ------------ | --------------------- | ---------- |
| Pesquisa     | `Consulta do Bem`     | `298:565`  |
| Detalhe      | `Consulta de item`    | `298:756`  |
| Histórico    | `HIstorico do item`   | `283:347`  |
| Movimentação | `Movimentação do bem` | `298:1096` |
| Reavaliação  | `Reavaliação do bem`  | `298:1489` |
| Baixa        | `Baixa do bem`        | `301:1891` |
| Substituição | `Substituir plaqueta` | `301:2283` |
| Relatório    | `Relatório do bem`    | `303:2653` |

Antes de implementar cada objetivo, o agente deve reinspecionar os frames com
`@Figma` e comparar o resultado executado com o protótipo. Se houver divergência
visual, deve corrigi-la conforme o frame, exceto nas diferenças funcionais
deliberadas registradas nesta tarefa.

## Estado confirmado

- `/patrimonios` e `/patrimonios/[patrimonioId]` já consomem dados reais, com
  pesquisa, filtros, paginação, detalhe, histórico e ficha do bem.
- Situação contábil, responsável pelo cadastro, busca de eventos e opções de
  comissão da baixa já foram adicionados aos contratos e à API.
- Baixa e substituição já são executadas no detalhe por diálogos reais.
- `PatrimonioAcoes` ainda implementa “Movimentar” e “Reavaliar” como links para
  `/movimentacoes/nova` e `/reavaliacoes/nova`. Esse comportamento diverge dos
  frames e deve ser substituído pelos drawers definidos no Objetivo 4.
- Movimentação, reavaliação e relatórios já possuem consumidores Web reais que
  devem ser reutilizados. Não duplicar regras, schemas ou clientes HTTP.

## Escopo e roadmap de execução

### Objetivo 1 — Completar dados e opções da API

1. Ampliar aditivamente `PatrimonioResumoSchema` com `situacaoContabil` e o
   detalhe com a projeção mínima do usuário de cadastro (`id` e `nome`).
2. Ampliar a query paginada de eventos da ficha com `busca` opcional, aparada e
   limitada a 200 caracteres. A busca deve atuar sobre uma projeção textual
   normalizada dos campos públicos de cada evento, preservar filtros, total e
   paginação e não retornar payload bruto de auditoria.
3. Criar `GET /api/patrimonios/:patrimonioId/baixa/opcoes/comissoes`, exclusivo
   de `DIRETOR_PATRIMONIO`, com `dataBaixa`, `busca`, `pagina` e `limite`. Retornar
   somente comissões elegíveis para a data civil informada. Não ampliar a
   listagem administrativa geral de comissões.
4. Atualizar mappers, repositórios, testes, fixtures e consumidores atingidos.
   As mudanças são de leitura e não exigem migration.

### Objetivo 2 — Implementar pesquisa e detalhe reais

1. Manter `/patrimonios` como Server Component. Ler `searchParams` assíncronos,
   validar com o contrato compartilhado e consultar a API autenticada com
   `cache: "no-store"`.
2. Implementar busca e filtros por formulário GET, paginação por URL, estados de
   carregamento, vazio, erro recuperável e acesso por teclado. Cada linha deve
   navegar para `/patrimonios/[patrimonioId]`.
3. Criar a rota dinâmica de detalhe, buscar o UUID na API e renderizar somente
   valores reais. Campos opcionais ausentes devem usar rótulo neutro como “Não
   informado”, nunca dados de exemplo.
4. Remover `dados-exemplo.ts` e o controlador de telas em memória. Preservar
   componentes puramente visuais somente quando receberem dados tipados.
5. Expor as ações no detalhe conforme perfil: ambos os perfis consultam;
   `ADMINISTRADOR` não recebe controles de mutação; `DIRETOR_PATRIMONIO` recebe
   apenas ações permitidas pela API.

### Objetivo 3 — Integrar histórico e relatório

1. Representar a aba por URL (`aba=historico`) e os filtros de eventos por
   `evento`, `busca`, `dataInicial`, `dataFinal` e `pagina`, permitindo reload e
   navegação do navegador sem perder o estado.
2. Reutilizar a ficha e a fonte paginada de eventos de relatórios. Criar uma
   apresentação tipada para todos os tipos públicos de evento; não exibir JSON,
   IDs técnicos soltos ou textos fixos.
3. O comando “Relatório do bem” deve navegar para
   `/relatorios?tipo=ficha-bem&patrimonioId=<uuid>&consultar=1`, reutilizando a
   tela e o download autenticado existentes.
4. O formato aprovado continua sendo PDF. A opção HTML ilustrada no Figma não
   será criada sem requisito e contrato próprios.

### Objetivo 4 — Integrar as quatro ações do Diretor

Usar um pequeno limite Client Component para as ações; o detalhe e as leituras
permanecem server-first. “Movimentar” e “Reavaliar” devem ser botões que abrem
um drawer modal pela lateral direita da própria tela individual. Eles não podem
navegar para as páginas gerais `/movimentacoes/nova` ou `/reavaliacoes/nova`.

- Criar `apps/web/components/ui/drawer.tsx` como composição visual da primitive
  `Dialog` do `radix-ui` já instalado, sem nova dependência. O drawer deve ter
  overlay, título e descrição acessíveis, foco contido, fechamento por botão e
  `Esc`, devolução do foco ao gatilho, rolagem interna e largura responsiva
  coerente com o Figma. A [documentação oficial do Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
  é a referência de semântica e teclado.
- Manter no máximo um drawer aberto por vez e preservar a URL
  `/patrimonios/[patrimonioId]`. O patrimônio recebido pelo detalhe fica fixo,
  identificado no cabeçalho do drawer e não pode ser pesquisado, removido ou
  trocado dentro do formulário.
- Extrair dos fluxos gerais apenas os campos e a lógica compartilháveis. As
  páginas gerais continuam existindo para operações iniciadas fora do detalhe;
  o drawer não deve montar a página completa nem duplicar cliente HTTP, schema
  ou tratamento de conflito.

- **Movimentação:** reutilizar operações, schemas, catálogo de opções e chave de
  idempotência existentes, enviando exatamente um item: o patrimônio do detalhe.
  Origem e identificação do bem são somente leitura; destino, comissão e motivo
  seguem o contrato existente. A data é registrada pelo servidor; não criar
  campo de data do cliente apenas porque aparece no frame.
- **Reavaliação:** reutilizar preview, `versaoEsperada`, chave de idempotência e
  tratamento de conflitos existentes para exatamente o patrimônio do detalhe.
  A confirmação usa o preview válido mais recente; não calcular valor confirmado
  apenas no navegador.
- **Baixa:** adicionar operação/hook Web para `FormData`, com JSON no campo
  `dados` e PDF opcional em `documento`, sem definir manualmente
  `Content-Type`. Exigir confirmação explícita da irreversibilidade e usar as
  opções de comissão do Objetivo 1.
- **Substituição do número:** enviar somente o número atual canônico como
  pré-condição. O servidor gera o próximo número oficial; a interface não pode
  pedir nem sugerir o número novo. Exibir a ação apenas para bem de numeração
  oficial elegível, mantendo a API como autoridade final.
- Após sucesso, fechar o drawer, atualizar detalhe e histórico com
  `router.refresh()`, devolver o foco e anunciar o feedback na página. Durante
  envio, impedir nova confirmação e fechamento acidental. Em resultado de rede
  incerto, manter formulário e chave para recuperação/reenvio conforme o fluxo
  existente. Baixa e substituição não recebem retry automático; resultado
  incerto exige reconciliação por nova leitura.

## Fora do escopo

- Alterar o mobile. Ele permanece limitado a autenticação, inventário, cadastro
  e pesquisa já implementados; geração de relatórios será objetivo mobile
  separado. Movimentação, reavaliação, baixa e substituição são Web.
- Criar endpoints exclusivos por plataforma, fila offline ou cache persistente.
- HTML de relatório, edição/estorno de eventos, baixa em lote, número novo
  escolhido pelo cliente ou mudança nas regras de autorização.
- Redesenhar os fluxos gerais de movimentações, reavaliações ou relatórios.

## Decisões aprovadas

- `ADMINISTRADOR` consulta detalhe, histórico e relatório; somente
  `DIRETOR_PATRIMONIO` executa as quatro mutações.
- Estado de pesquisa, aba e filtros relevantes é endereçável por URL.
- O protótipo orienta composição, hierarquia, conteúdo e responsividade, mas
  não sobrepõe contratos, autorização, segurança ou semântica do servidor.
- A implementação segue o App Router do Next.js 16: páginas e layouts são
  Server Components por padrão, `searchParams` é assíncrono e Client Components
  ficam restritos à interatividade. Referências oficiais:
  [layouts e páginas](https://nextjs.org/docs/app/getting-started/layouts-and-pages),
  [Server e Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
  e [upgrade para Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16).

## Critérios de aceite

- [ ] Nenhuma tela patrimonial Web usa `dados-exemplo.ts`, usuários, datas,
      comissões, setores, valores ou históricos fixos.
- [ ] Pesquisa, filtros, paginação, detalhe, abas e histórico sobrevivem a
      reload e back/forward conforme seus parâmetros de URL.
- [ ] Lista e detalhe não fazem N+1 e validam respostas no boundary Web–API.
- [ ] Os oito estados principais foram comparados no `@Figma`; diferenças
      funcionais são somente as explicitadas nesta tarefa.
- [ ] Administrador não vê nem consegue executar mutações; a API continua
      protegendo todas as chamadas diretas.
- [ ] Diretor conclui movimentação, reavaliação, baixa e substituição e vê o
      resultado atualizado no detalhe/histórico.
- [ ] “Movimentar” e “Reavaliar” abrem drawers na tela individual, não alteram a
      URL, não permitem trocar o bem e enviam exatamente o patrimônio exibido.
- [ ] Os drawers prendem e restauram o foco, respondem a `Esc`, possuem nome e
      descrição acessíveis, rolagem interna e comportamento responsivo.
- [ ] Ficha real abre na tela de relatórios e o PDF autenticado é gerado; não há
      opção HTML fictícia.
- [ ] Baixa envia multipart corretamente, aceita um PDF opcional de até 10 MiB
      e comunica a irreversibilidade antes da confirmação.
- [ ] Estados vazio, loading, erro, conflito, sucesso e operação inelegível são
      cobertos sem sucesso otimista falso ou retry automático de mutação.
- [ ] Navegação por teclado, foco pós-operação, rótulos, mensagens e contraste
      passam pela revisão de acessibilidade aplicável.

## Arquivos ou módulos potencialmente afetados

- Contratos: `packages/contracts/src/patrimonio/`,
  `packages/contracts/src/relatorio-patrimonial/` e
  `packages/contracts/src/baixa-patrimonio/`.
- API: `apps/api/src/modules/patrimonios/`,
  `apps/api/src/modules/relatorios/` e `apps/api/src/modules/baixas/`.
- Web: `apps/web/app/(sistema)/patrimonios/`,
  `apps/web/features/patrimonios/`, `apps/web/features/relatorios/`,
  `apps/web/features/movimentacoes/` e `apps/web/features/reavaliacoes/`.
- Testes: suites unitárias dos módulos afetados, E2E de API e E2E Web real do
  fluxo patrimonial.

## Referências obrigatórias por objetivo

O agente implementador deve começar sempre por este documento e, em seguida,
abrir somente o conjunto do objetivo em execução:

1. **Dados e opções da API:**
   `packages/contracts/src/patrimonio/patrimonio-response.schema.ts`,
   `packages/contracts/src/relatorio-patrimonial/queries.ts`,
   `packages/contracts/src/relatorio-patrimonial/responses.ts`,
   `packages/contracts/src/baixa-patrimonio/`,
   `apps/api/src/modules/patrimonios/patrimonios.repository.ts`,
   `apps/api/src/modules/patrimonios/mappers/patrimonio-response.mapper.ts`,
   `apps/api/src/modules/relatorios/ficha.service.ts`,
   `apps/api/src/modules/relatorios/types/fonte-eventos.ts` e
   `apps/api/src/modules/baixas/`.
2. **Pesquisa e detalhe:** `apps/web/app/(sistema)/patrimonios/page.tsx`,
   `apps/web/app/(sistema)/patrimonios/[patrimonioId]/page.tsx`,
   `apps/web/features/patrimonios/api/server-patrimonio-operations.ts`,
   `apps/web/features/patrimonios/api/patrimonio-operations.ts`,
   `apps/web/features/patrimonios/components/patrimonio-lista.tsx` e
   `apps/web/features/patrimonios/components/patrimonio-detalhe.tsx`.
3. **Histórico e relatório:**
   `packages/contracts/src/relatorio-patrimonial/`,
   `apps/api/src/modules/relatorios/ficha.service.ts`,
   `apps/api/src/modules/relatorios/types/fonte-eventos.ts`,
   `apps/web/features/relatorios/api/`,
   `apps/web/features/relatorios/apresentacao.tsx` e
   `apps/web/app/(sistema)/relatorios/page.tsx`.
4. **Ações do Diretor:**
   `apps/web/features/patrimonios/components/patrimonio-acoes.tsx`,
   `apps/web/features/patrimonios/components/patrimonio-detalhe.test.tsx`,
   `apps/web/components/ui/dialog.tsx`,
   `apps/web/features/movimentacoes/api/`,
   `apps/web/features/movimentacoes/components/nova-movimentacao.tsx`,
   `apps/web/features/reavaliacoes/api/`,
   `apps/web/features/reavaliacoes/components/nova-reavaliacao.tsx`,
   `packages/contracts/src/baixa-patrimonio/`,
   `packages/contracts/src/patrimonio/substituir-numero-patrimonial.schema.ts`
   e os controllers de `baixas`, `patrimonios`, `movimentacoes` e
   `reavaliacoes` na API.

## Verificações esperadas

- Lint, testes e typecheck de `@repo/contracts`, API e Web afetados.
- Testes de contrato para novos campos, `busca` e opções de comissão.
- E2E da API para perfis, filtros, paginação, elegibilidade e erros.
- E2E Web com backend real cobrindo consulta por ambos os perfis e as quatro
  ações pelo Diretor, inclusive atualização do histórico e geração da ficha.
- Build Web e inspeção manual responsiva/acessível nos oito frames do Figma.
- `git diff --check` e validação dos links/documentação alterados.

## Pendências ou decisões bloqueantes

- Nenhuma. Divergência material entre o estado vivo da API e este contrato deve
  retornar ao planejador antes de ampliar comportamento externo.

## Handoff de execução — 2026-11-02

- A pesquisa e o detalhe de patrimônios passaram a consumir a API real, com
  filtros e paginação na URL, histórico público tipado e ficha do bem integrada
  à tela de relatórios.
- Os contratos e a API agora expõem a situação contábil, o responsável pelo
  cadastro, busca textual de eventos e as comissões elegíveis para baixa na data
  informada.
- As ações de movimentação e reavaliação agora abrem drawers modais na própria
  ficha, mantêm a URL e fixam o único patrimônio recebido pelo detalhe. Os
  formulários reutilizam os fluxos gerais, inclusive catálogos, preview,
  idempotência e conflitos, sem oferecer busca ou remoção do bem. Baixa e
  substituição continuam usando os consumidores Web reais existentes.
- Foram aprovados: 147 testes de contratos; 416 testes da API em 58 suítes; 74
  testes Web em 19 arquivos; lint e typecheck de API e Web; builds de API e Web;
  e `git diff --check`. A suíte completa da API ignorou 22 suítes/132 testes que
  dependem de infraestrutura ou flags específicas do ambiente. O build Web da
  correção dos drawers foi repetido fora do sandbox após o ambiente isolado
  impedir a criação de `apps/web/.next/server/app/api` com `EPERM`.
- A inspeção local com a API e os dados de demonstração confirmou abertura,
  conteúdo fixo, URL preservada, rolagem, fechamento por `Esc`, devolução do
  foco e ausência de erros no console para os dois drawers. Nenhuma mutação foi
  confirmada durante essa inspeção, para não alterar a base compartilhada.
- A inspeção programática dos oito frames foi impedida pelo limite do plano do
  conector Figma. O aplicativo desktop também não expôs uma janela controlável
  nesta execução. Permanecem pendentes a comparação visual completa dos oito
  frames, a revisão manual em viewports estreita e intermediária e o E2E Web
  com backend real confirmando as quatro ações e a geração da ficha.
