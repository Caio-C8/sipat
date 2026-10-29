# `MOBILE-INVENTARIOS-002` — Conferir itens por etiqueta ou número no mobile

**Status:** `aprovada`

## Objetivo

Implementar a conferência de um setor `EM_ANDAMENTO` por leitura de código de
barras ou digitação do número patrimonial, registrando o resultado real da API
e permitindo que uma divergência seja corrigida agora ou permaneça pendente.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#conferência-de-inventário-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#conferência-de-inventário).
- Requisitos: [RF19 e UC19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Dependências:
  [MOBILE-INVENTARIOS-001](./MOBILE-INVENTARIOS-001-selecionar-iniciar-setor.md),
  [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md) e
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md).
- Mobile: [segurança](../apps/mobile/security.md),
  [performance](../apps/mobile/performance.md),
  [responsividade](../apps/mobile/responsive-ux-accessibility.md) e
  [testes](../apps/mobile/testing-and-workflow.md).
- Expo SDK 58: [Camera](https://docs.expo.dev/versions/v58.0.0/sdk/camera/)
  e [permissões](https://docs.expo.dev/guides/permissions/).
- Figma somente leitura, página `Telas Mobile`:
  [Conferência de bens](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-257&p=f)
  e
  [inconsistência leitura do bem](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-449&p=f).

## Pré-condição visual obrigatória

O implementador deve abrir os frames no navegador e registrar a comparação no
handoff. O Figma é somente leitura. A tela executada, e não uma imagem copiada,
deve ser comparada ao frame em 390×844.

## Escopo

- adicionar a rota de conferência sob o inventário e o setor selecionados,
  validando ambos os UUIDs e confirmando que o setor continua
  `EM_ANDAMENTO`;
- instalar a versão de `expo-camera` compatível com o Expo SDK 58 por
  `expo install`, configurar o plugin sem permissão de áudio e usar
  `CameraView`/`onBarcodeScanned` para códigos suportados pelas etiquetas reais;
- definir mensagem de permissão de câmera específica para leitura patrimonial e
  modelar carregando, concedida, negada recuperável, negada sem nova pergunta,
  câmera indisponível e falha de montagem;
- desmontar ou desativar a câmera quando a rota perder foco, quando um modal
  estiver aberto ou durante o processamento de uma leitura;
- manter entrada manual sempre disponível; normalizar e validar scanner e campo
  com `NumeroPatrimonialSchema` antes de enviar;
- serializar submissões e desabilitar temporariamente o callback depois de uma
  leitura, impedindo que vários eventos do mesmo código criem requests
  concorrentes;
- chamar `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/verificacoes`
  sem retry automático e validar `VerificarItemInventarioResponseSchema`;
- para `CORRETO`, mostrar a última leitura confirmada e liberar o próximo item;
- para `DIVERGENCIA`, mostrar setor cadastrado e setor encontrado e oferecer
  `Continuar conferência` ou `Corrigir localização agora`;
- `Continuar conferência` apenas fecha o estado de divergência: não existe uma
  segunda operação de “adicionar ocorrência”, pois a própria verificação já
  persistiu o item como divergente e com correção pendente;
- em `LEITURA_IDEMPOTENTE`, exibir o resultado existente sem contar novamente;
- tratar `ITEM_INVENTARIO_NAO_ENCONTRADO`,
  `ITEM_INVENTARIO_JA_VERIFICADO`, setor fora de andamento, inventário
  finalizado, conflito concorrente, `401`, `403`, timeout, offline/rede e
  response inválida sem perder o contexto da conferência;
- mostrar progresso apenas com dados confirmados/refetch, sem incremento
  otimista que possa divergir do servidor.

## Fora do escopo

- reconhecer imagem, OCR ou fotografar/armazenar etiquetas;
- solicitar microfone, gravar áudio/vídeo ou manter câmera ativa em background;
- fila offline, persistência local de leituras ou retry automático de mutation;
- correção da divergência, conclusão do setor ou finalização do inventário;
- inventar um endpoint ou entidade de ocorrência separado de `ItemInventario`;
- aceitar código inválido do scanner como número patrimonial.

## Decisões aprovadas

- Leitura de etiqueta e entrada manual convergem no mesmo
  `numeroPatrimonial` e na mesma operação da API.
- A resposta do servidor decide `CORRETO` ou `DIVERGENCIA`; o cliente não
  compara setores nem antecipa a mutação.
- “Adicionar a ocorrência” do protótipo significa preservar a divergência
  pendente e seguir para o próximo item; não haverá novo `POST` para isso.
- Sem rede não existe sucesso local. O número pode permanecer no campo para
  tentativa explícita, mas não entra em fila.

## Critérios de aceite

- [ ] o implementador registra a inspeção dos dois frames;
- [ ] permissão e ciclo de vida da câmera funcionam sem solicitar microfone;
- [ ] etiqueta e entrada manual enviam o mesmo valor canônico e a mesma
      operação;
- [ ] uma leitura física produz no máximo uma mutation em andamento;
- [ ] `CORRETO`, `DIVERGENCIA`, idempotência, item ausente e item já verificado
      em outro setor possuem estados distintos e acessíveis;
- [ ] continuar após divergência não cria operação ou entidade adicional;
- [ ] falha de rede não incrementa progresso nem marca sucesso local;
- [ ] sair, voltar, trocar orientação ou abrir modal não mantém câmera indevida
      nem duplica uma leitura;
- [ ] o fluxo manual continua utilizável quando a câmera está indisponível ou
      sem permissão.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/package.json`, lockfile e `apps/mobile/app.json` para
  `expo-camera` e sua configuração;
- nova rota de conferência em
  `apps/mobile/src/app/(app)/inventarios/`;
- `apps/mobile/src/features/inventarios/conferencia/` com câmera, campo manual,
  estado de leitura, apresentação e testes;
- `apps/mobile/src/features/inventarios/api/` para a operação de verificação;
- `apps/mobile/src/lib/navigation/routes.ts` e testes;
- `packages/contracts/src/inventario/` como boundary de runtime, sem mudança
  presumida.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- `pnpm mobile:doctor` depois da dependência nativa;
- testes de permissão, indisponibilidade, unmount/foco, evento repetido,
  submissão única, manual, scanner e todos os resultados públicos;
- integração real com a API para correto, divergência, idempotência e conflito
  entre setores;
- build nativo atualizado e teste em aparelho Android/iOS com etiqueta real;
- comparação visual em 390×844, rotação, fonte ampliada, TalkBack/VoiceOver e
  teclado no Web;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto está bloqueante. Antes de declarar a tarefa
  concluída, confirmar em uma etiqueta real quais simbologias de código de
  barras são usadas e restringir `barcodeScannerSettings` a elas. A entrada
  manual permite desenvolver e validar o restante do fluxo antes desse teste
  físico.
