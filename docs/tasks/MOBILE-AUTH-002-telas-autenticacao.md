# `MOBILE-AUTH-002` — Implementar login e primeiro acesso mobile

**Status:** `aprovada`

## Objetivo

Entregar no aplicativo nativo as telas de login, criação obrigatória de nova
senha e confirmação, integradas à sessão de `MOBILE-AUTH-001`, com o fluxo e a
matriz de acesso equivalentes aos da Web e a interface dos frames mobile.

## Contexto e referências

- Dependências: [MOBILE-AUTH-001](./MOBILE-AUTH-001-sessao-nativa.md) e
  [MOBILE-FOUNDATION-001](./MOBILE-FOUNDATION-001-estrutura-visual-navegacao.md).
- Fluxo Web verificado: [WEB-AUTH-001](./WEB-AUTH-001-integrar-autenticacao.md).
- Rotas: [matriz mobile](../apps/mobile/routing-and-navigation.md#navegação-autenticada).
- Formulários: [primeira entrega](../apps/mobile/forms-and-validation.md#formulários-da-primeira-entrega).
- Sessão: [autenticação e armazenamento](../integrations/mobile-api/auth-storage.md#arquitetura-aprovada).
- Referência visual: arquivo Figma `YGy7F6OGLf6FhXrVomleGk`, incluindo os frames
  móveis `Login` (`334:43423`), `Crie sua nova senha` (`315:43371`) e `Senha
atualizada` na página `Telas Mobile`, além da imagem anexada ao planejamento.

## Escopo

- instalar `expo-secure-store` com a versão compatível com Expo SDK 58 e revisar
  config plugin, backup Android e comportamento do Keychain iOS;
- criar cliente HTTP e operações tipadas para login, refresh, `/auth/mobile/me`,
  conclusão do primeiro acesso e logout;
- manter access token somente em memória e encapsular leitura, rotação e remoção
  do refresh token atrás de uma interface de storage;
- coordenar refresh concorrente em uma única operação e limitar a uma repetição
  segura após `401`, sem retry automático de mutation;
- restaurar a sessão antes de decidir a rota inicial, sem flash de conteúdo
  protegido;
- implementar `/login` com e-mail institucional, senha, mostrar/ocultar,
  pending e erros seguros;
- direcionar login comum para `/` e login com `trocaSenhaObrigatoria` para
  `/redefinir-senha`;
- implementar `/redefinir-senha` com nova senha, confirmação, aviso de troca
  obrigatória, nome vindo da identidade e ação de sair;
- concluir o primeiro acesso, substituir atomicamente o par local somente após
  response válida e navegar para `/senha-atualizada` sem manter a família
  restrita;
- implementar `/senha-atualizada` protegida, com ação para continuar em `/`;
- aplicar a matriz de acesso em refresh e acesso direto às três rotas;
- limpar senha do estado, access token, refresh token, identidade e dados
  privados em logout ou invalidação definitiva;
- diferenciar sessão inválida de indisponibilidade temporária sem apagar refresh
  potencialmente válido por falha de rede;
- cobrir teclado, foco, fonte ampliada, leitor de tela, rotação, background e
  retomada;
- documentar o estado entregue somente após as verificações correspondentes.

## Fora do escopo

- recuperação de senha por e-mail, alteração voluntária da própria senha e MFA;
- conteúdo de domínio da home, implementado em `MOBILE-HOME-001`;
- cache remoto de domínio, fila offline, biometria ou renovação periódica em
  background;
- JWT, armazenamento em AsyncStorage ou persistência da senha;
- tornar a autenticação Bearer nativa disponível no navegador;
- copiar código interno, componentes ou cliente HTTP da Web.

## Decisões aprovadas

- fluxo pendente: `/login` → `/redefinir-senha` → `/senha-atualizada` → `/`;
- fluxo comum: `/login` → `/`;
- a tela de sucesso exige sessão comum válida; não é confirmação baseada apenas
  em estado local de navegação;
- a identidade autenticada fornece o nome; `Paulo` e demais exemplos não ficam
  hardcoded;
- `401` definitivo leva ao login; pendência leva à troca; `403` por perfil não
  é tratado automaticamente como sessão expirada;
- a ação “Esqueci minha senha” não fica inerte. Como recuperação mobile está
  fora desta tarefa, ela não é renderizada como ação até existir destino real;
- React Native Web não armazena token. Nesta entrega ele cobre renderização,
  acessibilidade e testes com adapter controlado; autenticação Web de produção
  exige transporte por cookie próprio, nunca fallback para Bearer persistido;
- falha ao gravar o refresh token impede declarar login concluído e aciona
  revogação/limpeza segura do material recém-emitido quando possível.

## Estados obrigatórios

- restauração inicial;
- formulário pronto, inválido, pending e sucesso;
- credencial inválida sem enumeração;
- rate limit com orientação segura e `Retry-After` quando exposto pelo contrato;
- API indisponível, timeout e offline;
- sessão expirada ou revogada durante cada tela;
- falha de leitura, gravação ou exclusão do SecureStore;
- rotação concluída sem reutilizar access ou refresh anterior.

## Critérios de aceite

- [ ] reiniciar o app restaura a sessão sem novo login quando refresh, oito
      horas e trinta minutos continuam válidos;
- [ ] sessão ausente, expirada, revogada ou inativa abre login sem mostrar home;
- [ ] access token não é persistido e refresh token não aparece fora do adapter
      SecureStore;
- [ ] login e primeiro acesso usam schemas compartilhados e validam toda
      response antes de alterar estado ou navegar;
- [ ] redirects e acesso direto seguem integralmente a matriz documentada sem
      loops ou flash de conteúdo protegido;
- [ ] primeiro acesso troca a família e a tela de sucesso continua autenticada;
- [ ] logout online revoga remotamente e sempre limpa o estado local; logout
      offline não afirma revogação remota concluída;
- [ ] falha temporária de rede na restauração não apaga silenciosamente a sessão;
- [ ] senha nunca aparece em log, storage, URL, analytics, exception ou snapshot;
- [ ] interface segue a imagem disponível, topbar e faixa de desenvolvimento,
      com diferenças intencionais documentadas;
- [ ] formulários permanecem utilizáveis com teclado, fonte ampliada, TalkBack,
      VoiceOver, retrato, paisagem e tablet;
- [ ] testes cobrem sessão, storage, concorrência de refresh, operações,
      formulários, redirects e falhas.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/package.json`, `app.json` e lockfile para `expo-secure-store`;
- `apps/mobile/src/app/(auth)/` e `apps/mobile/src/app/(app)/_layout.tsx`;
- `apps/mobile/src/features/auth/api/`;
- `apps/mobile/src/features/auth/forms/`;
- `apps/mobile/src/features/auth/session/`;
- `apps/mobile/src/features/auth/storage/`, incluindo implementação `.native` e
  contrato explícito para Web;
- `apps/mobile/src/lib/api/`;
- components e tokens entregues por `MOBILE-FOUNDATION-001`;
- testes unitários e de componentes do mobile.

## Verificações esperadas

- `pnpm --filter @repo/mobile lint`;
- `pnpm --filter @repo/mobile typecheck`;
- `pnpm --filter @repo/mobile test`;
- `pnpm --filter @repo/mobile build`;
- `pnpm mobile:doctor` e `pnpm security:patches` após instalar dependência;
- integração contra API e PostgreSQL reais para login, refresh, replay,
  primeiro acesso, logout e revogação;
- build nativo e teste em Android/iOS reais, incluindo reinício, background,
  expiração e armazenamento;
- inspeção visual e acessível nos tamanhos definidos pela documentação mobile;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Paridade visual fina continua dependente do acesso ao arquivo Figma.
- Autenticação funcional do export React Native Web em produção deve receber
  tarefa própria de cookie/BFF caso esse artefato deixe de ser somente preview e
  inspeção da interface.
