# MOBILE-RELATORIOS-004 — PDF multiplataforma e validação final

**Status:** aprovada em 14/11/2026

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
- [ ] `Content-Type` incorreto, corpo acima de 10 MiB, response não PDF e
      arquivo ilegível falham sem abrir ou preservar conteúdo inválido;
- [ ] sessão expirada renova e repete o GET no máximo uma vez; falha definitiva
      aplica o fluxo de logout já existente;
- [ ] Android e iOS usam visualizador nativo ou fallback explícito de
      compartilhamento; Web revoga Object URL em sucesso, falha e desmontagem;
- [ ] toque repetido não cria emissões concorrentes e cancelamento/desmontagem
      não apresenta sucesso tardio;
- [ ] temporários não contêm dados no nome, não sobrevivem por decisão de
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
