# `MOBILE-INVENTARIOS-003` — Corrigir divergências e concluir setor no mobile

**Status:** `concluída`

## Objetivo

Permitir que o Diretor corrija uma divergência imediatamente ou depois e
conclua a conferência do setor, deixando ao servidor classificar os itens não
encontrados e apresentando um resumo fiel do resultado.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#conferência-de-inventário-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#conferência-de-inventário).
- Requisitos: [RF19 e UC19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Dependências:
  [MOBILE-INVENTARIOS-002](./MOBILE-INVENTARIOS-002-conferir-itens.md),
  [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md) e
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md).
- Figma somente leitura, página `Telas Mobile`:
  [Corrigir localização](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=315-43263&p=f)
  e
  [Inventário finalizado](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-511&p=f).

## Pré-condição visual obrigatória

O implementador deve abrir os frames no navegador, conferir também o modal de
divergência da tarefa anterior e registrar a comparação no handoff. O Figma é
somente leitura.

## Escopo

- adicionar rota de correção identificada por `inventarioId` e
  `itemInventarioId`, validando UUIDs e carregando o item real antes de montar o
  formulário;
- permitir correção somente quando o item estiver `DIVERGENCIA` com
  `statusCorrecao = PENDENTE`; estado incompatível deve voltar ao resumo
  atualizado, não montar body artificial;
- mapear `Trazer para o setor cadastrado` para
  `RETORNO_AO_SETOR_CADASTRADO`, preservando a divergência sem criar
  transferência;
- mapear `Manter no setor onde foi encontrado` para
  `TRANSFERENCIA_CADASTRAL`, deixando a API criar e vincular o histórico de
  transferência;
- exibir claramente setor esperado e setor encontrado. O setor encontrado vem
  da verificação e não é escolhido livremente pelo formulário;
- aceitar observação opcional conforme o contrato público, apesar do asterisco
  do protótipo, e validar seu limite antes do envio;
- chamar uma única vez
  `POST /api/inventarios/:inventarioId/itens/:itemInventarioId/correcoes`, sem
  retry automático, e atualizar a lista/progresso com a response validada;
- permitir abrir depois as divergências pendentes pela lista de itens filtrada
  por `situacao=DIVERGENCIA&statusCorrecao=PENDENTE`, com paginação explícita;
- na conferência em andamento, usar a ação `Concluir conferência do setor`, e
  não o rótulo ambíguo `Finalizar inventário` do frame;
- antes de concluir, mostrar confirmação com total verificado, total ainda
  pendente que se tornará `NAO_LOCALIZADO` e correções pendentes já registradas;
- chamar uma única vez
  `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/concluir`;
  a API, e não o cliente, converte itens pendentes em `NAO_LOCALIZADO` e
  `VERIFICADO` e registra datas/status operacionais;
- após sucesso, refazer setor e itens e mostrar `Conferência concluída`, com
  contagens de corretos, divergências e não localizados e acesso às divergências
  ainda corrigíveis enquanto o inventário estiver aberto;
- tratar conflito concorrente, item incompatível, inventário finalizado,
  vínculo de ausência inconsistente, `401`, `403`, timeout, offline/rede e
  response inválida sem simular conclusão.

## Fora do escopo

- criar ou finalizar globalmente o inventário no mobile;
- reabrir setor concluído ou alterar resultado de conferência consolidado;
- enviar lote de ocorrências, relatório, e-mail ou notificação;
- criar manualmente transferência ou aceitar `transferenciaId` do cliente;
- escolher setor encontrado diferente daquele registrado na conferência;
- marcar individualmente item como `NAO_LOCALIZADO` no cliente;
- fila offline, retry automático ou mutation otimista.

## Decisões aprovadas

- O fluxo mobile termina na conclusão do setor. A finalização global do
  inventário permanece fora do aplicativo.
- `Inventário finalizado` e `Enviar Ocorrências` do protótipo serão adaptados
  para `Conferência concluída` e navegação às divergências pendentes. Não existe
  endpoint de envio separado e nenhuma UI deve sugerir que o inventário inteiro
  foi finalizado.
- A situação do item continua `DIVERGENCIA` depois de qualquer correção; apenas
  o status e o tipo de correção mudam.
- Observação de correção é opcional porque o contrato aprovado assim define;
  mudar essa regra exige tarefa de contrato/produto própria.

## Critérios de aceite

- [x] o implementador registra a inspeção dos frames obrigatórios;
- [x] as duas escolhas enviam exatamente o enum correspondente e nenhuma
      transferência criada pelo cliente;
- [x] correção por transferência retorna `transferenciaCorrecaoId`, enquanto
      retorno físico permanece sem transferência;
- [x] pular correção mantém o item divergente e pendente e libera a próxima
      leitura;
- [x] divergência pendente pode ser reaberta e corrigida depois, enquanto o
      inventário não estiver finalizado;
- [x] a confirmação informa quantos itens serão marcados como não localizados;
- [x] conclusão chama somente a operação do setor e o resultado reflete
      `CONCLUIDO` e os `NAO_LOCALIZADO` retornados/refetchados;
- [x] nenhum controle chama a finalização global do inventário;
- [x] dupla ativação, falha de rede ou conflito não produzem correção ou
      conclusão duplicada;
- [x] resumo e pendências permanecem paginados, acessíveis e fiéis ao estado
      real da API.

## Arquivos ou módulos potencialmente afetados

- novas rotas de correção e resumo em
  `apps/mobile/src/app/(app)/inventarios/`;
- `apps/mobile/src/features/inventarios/correcao/` e
  `apps/mobile/src/features/inventarios/resumo/`;
- `apps/mobile/src/features/inventarios/api/` para listar itens, corrigir e
  concluir setor;
- componentes da conferência para confirmação e navegação às pendências;
- `apps/mobile/src/lib/navigation/routes.ts` e testes;
- `packages/contracts/src/inventario/` como boundary de runtime, sem mudança
  presumida.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes de mapper dos dois tipos de correção, opcionalidade/limite da
  observação, submissão única e estados incompatíveis;
- testes HTTP de listagem filtrada, correção, conclusão, conflitos, timeout,
  `401`, `403` e response inválida;
- integração real com API/PostgreSQL cobrindo retorno físico, transferência
  vinculada, correção posterior, pendências e conversão automática em
  `NAO_LOCALIZADO`;
- comparação visual em 390×844 e validação de telefone/tablet,
  retrato/paisagem, teclado, fonte ampliada, TalkBack e VoiceOver;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
