# MOBILE-RELATORIOS-004 — PDF multiplataforma e validação final

**Status:** implementada e validada localmente em 14/11/2026; integração real
e validação em dispositivos pendentes

## Objetivo

Gerar, validar e abrir o PDF de todas as rotas atuais no Android, iOS e Web,
com autenticação, limites, limpeza de temporários e paridade visual final do
fluxo completo.

## Contexto e referências

- [Prévias e ficha](./MOBILE-RELATORIOS-003-previas-ficha.md).
- [Rotas, concorrência e limites de PDF](../apps/api/relatorios-patrimoniais.md#interface-http-e-limites-aprovados).
- [Cliente e sessão mobile](../integrations/mobile-api/clients-and-operations.md).
- [Testes e definição de pronto mobile](../apps/mobile/testing-and-workflow.md).
- [Expo FileSystem SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/).
- [Expo Sharing SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/).
- Figma somente leitura: [`01-relatorios 1`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1022&p=f),
  [`06-ficha-individual 1`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-542&p=f) e
  [`07-previa-individual 1`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-680&p=f).

## Escopo

- emitir PDF pelas nove rotas `/:tipo/pdf` e por
  `/ficha-bem/:patrimonioId/pdf`, sempre com filtros validados e Bearer atual;
- estender o boundary HTTP ou criar adapter binário equivalente para timeout de
  25 segundos, cancelamento, refresh seguro após `401`, erros públicos,
  `Content-Type: application/pdf` e limite de 10 MiB;
- no Android/iOS, gravar bytes em arquivo opaco dentro de `Paths.cache`, abrir
  pelo preview nativo de `expo-file-system` e usar `expo-sharing` somente como
  fallback quando não houver visualizador compatível;
- no Web, usar Blob/Object URL, abertura ou download iniciado pelo usuário e
  revogação garantida da URL;
- manter uma emissão por vez na interface, não aplicar retry automático e
  apresentar `Retry-After` quando a API responder `429`;
- limpar arquivos temporários em melhor esforço sem remover o arquivo enquanto
  o visualizador externo ainda puder utilizá-lo;
- concluir a comparação visual e a validação integrada das quatro tarefas.

## Fora do escopo

- renderizar PDF no React Native, editar ou assinar documentos, armazenar em
  Documents/galeria, compartilhar automaticamente, e-mail, impressão,
  histórico local ou retenção permanente;
- alterar PDFKit, layout do documento, limites, concorrência, endpoints,
  contratos, banco ou autorização da API;
- executar duas emissões paralelas, fila offline ou sucesso local sem resposta.

## Decisões aprovadas

- `expo-file-system` e `expo-sharing` devem ser dependências diretas alinhadas
  ao Expo SDK 58 por `expo install`; dependência transitiva não é contrato do
  app.
- O arquivo usa UUID aleatório e extensão `.pdf`, sem tipo, filtro, número
  patrimonial ou nome de pessoa. Token, URL completa, query e conteúdo não são
  logados.
- Arquivos ficam em cache, nunca em armazenamento persistente. A limpeza ocorre
  no início de uma nova emissão, no encerramento da sessão e em inicialização
  posterior; não se apaga imediatamente após `File.preview()`, pois a
  documentação oficial exige manter o arquivo disponível enquanto o viewer o
  utiliza.
- A emissão é um novo snapshot. A UI mantém a mensagem de que o PDF consulta
  novamente os dados e pode diferir da prévia.
- GET permite apenas a repetição segura após refresh de token. Timeout, rede,
  `422`, `429`, `503` ou resposta inválida não geram retry automático.

## Critérios de aceite

- [ ] os dez modelos abrem um PDF válido com os filtros atuais para
      Administrador e Diretor;
- [x] `Content-Type` incorreto, corpo acima de 10 MiB, response não PDF e
      arquivo ilegível falham sem abrir ou preservar conteúdo inválido;
- [ ] sessão expirada renova e repete o GET no máximo uma vez; falha definitiva
      aplica o fluxo de logout já existente;
- [ ] Android e iOS usam visualizador nativo ou fallback explícito de
      compartilhamento; Web revoga Object URL em sucesso, falha e desmontagem;
- [x] toque repetido não cria emissões concorrentes e cancelamento/desmontagem
      não apresenta sucesso tardio;
- [x] temporários não contêm dados no nome, não sobrevivem por decisão de
      produto e possuem limpeza testada em melhor esforço;
- [ ] o fluxo completo mantém exatamente a linguagem visual dos três frames em
      390×844, com os desvios comportamentais documentados, e funciona na
      matriz responsiva/acessível do mobile.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/package.json` e `pnpm-lock.yaml`;
- `apps/mobile/src/features/relatorios/api/relatorios-operations.ts`;
- `apps/mobile/src/features/relatorios/pdf/`;
- `apps/mobile/src/features/relatorios/components/`;
- `apps/mobile/src/lib/api/{api-client,api-error}.ts` e testes;
- `apps/mobile/src/features/auth/session/session-manager.ts`, somente para
  reutilizar o refresh GET e acoplar limpeza de temporários sem mudar o
  contrato de sessão;
- `apps/mobile/src/app/(app)/relatorios/[tipo].tsx`;
- `apps/mobile/src/theme/tokens.ts`;
- documentos de estado/handoff, apenas depois da implementação verificada.

## Verificações esperadas

- testes unitários do adapter binário, timeout, abort, MIME, tamanho, refresh,
  erros públicos, exclusão e fallback por plataforma;
- testes de interação para bloqueio de duplo toque, loading, cancelamento e
  mensagens de diferença entre prévia e PDF;
- integração real com todos os dez PDFs nos dois perfis, usando PostgreSQL
  descartável e a fixture existente, sem tocar banco de desenvolvimento;
- abertura real de pelo menos um PDF no Android e no iOS, download no Web,
  foreground/background, offline e ausência de viewer;
- lint, typecheck, testes, `expo-doctor`, export Android/iOS/Web, build nativo
  proporcional, formatação e CI completa antes de integração.

## Pendências ou decisões bloqueantes

- Nenhuma. Publicação em loja, capacidade de produção e E2E em dispositivos
  adicionais permanecem validações operacionais, não mudanças de escopo.

## Handoff da implementação

- As nove rotas `/:tipo/pdf` e a ficha usam o mesmo Bearer em memória e a
  recuperação segura de `401` já coordenada pela sessão. O boundary binário
  aplica timeout de 25 segundos, cancelamento, `application/pdf`, máximo de
  10 MiB, assinatura `%PDF-` e trailer `%%EOF`; paginação da prévia é removida
  antes da validação por `queryPdfRelatorio`.
- Android e iOS gravam `UUID.pdf` em `Paths.cache/relatorios-pdf`, validam o
  arquivo gravado, tentam `File.preview()` e só então usam `expo-sharing` como
  fallback. A limpeza em melhor esforço ocorre antes de nova emissão, na
  restauração e no encerramento da sessão; o arquivo não é apagado logo após a
  entrega ao viewer.
- Web cria Blob/Object URL e inicia download a partir da ação do usuário. A URL
  é revogada após a entrega, em falha e na desmontagem. A coordenação local
  mantém somente uma emissão ativa, aborta na desmontagem e ignora resultado
  tardio.
- O conector oficial do Figma atingiu o limite Starter. Os três frames foram
  reinspecionados em modo somente leitura pelo navegador integrado e a ação
  fixa preserva a linguagem de `07-previa-individual 1`; não houve comparação
  lado a lado da UI executada em emulador ou aparelho.
- Validações aprovadas: typecheck; 54 arquivos/276 testes Vitest; ESLint dos
  arquivos afetados sem warnings; exports Android, iOS e Web com 53 rotas;
  formatação afetada. O `expo-doctor` aprovou 19/20 checks e apontou somente o
  baseline `expo@58.0.24` abaixo do patch `~58.0.25` recomendado no catálogo em
  14/11/2026.
- Uma emissão real de relação de patrimônios foi homologada no emulador com
  Expo Go 58.0.5 e abriu no `PdfViewerActivity` instalado. Para isso, os módulos
  Expo usados no fluxo passaram a seguir os imports estáticos documentados para
  o SDK 58.
- Não foram executados nesta entrega: integração real com os dez PDFs e os dois
  perfis em PostgreSQL descartável, download runtime no Web, Android/iOS reais,
  ausência de viewer, foreground/background, offline, tablet, rotação,
  fonte ampliada, TalkBack, VoiceOver, build nativo APK/IPA, EAS e CI completa.
