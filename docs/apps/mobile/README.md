# Desenvolvimento do aplicativo mobile

Este diretório documenta o padrão de desenvolvimento de `apps/mobile`.

## Objetivo

O aplicativo é o cliente Android e iOS do SIPAT. O baseline usa Expo SDK 58,
React Native 0.88.0, React 19.3.0, Expo Router, TypeScript estrito e React Native
Web para inspeção da interface no navegador.

O mobile pode importar contratos agnósticos de plataforma de
`@repo/contracts`, mas não importa `@repo/database`, código interno da Web ou
código interno da API.

## Estado atual

- `/` é a Home protegida e integrada por perfil: o Administrador acompanha
  totais de setores, bens e estados de inventários, enquanto o Diretor de
  Patrimônio recebe progresso, ocorrências e a última conferência disponível;
- `/check` concentra runtime, health check da API e o catálogo tipado das rotas
  reais, acessível sem sessão somente em `development`;
- `/login`, `/redefinir-senha` e `/senha-atualizada` implementam login, troca
  obrigatória e confirmação sob o grupo `(auth)`, com a composição visual dos
  frames correspondentes do Figma;
- a sessão restaura antes da navegação, mantém access token em memória, rotaciona
  refresh token no `expo-secure-store` e aplica a matriz de acesso nos layouts;
- o layout raiz aplica safe area, topbar SIPAT e a faixa de verificação somente
  em `development`; a topbar mantém a identificação municipal sem sessão e,
  quando autenticada, apresenta avatar com menu da conta e logout;
- o grupo `(app)` aplica a bottom bar do protótipo; `Início`, `Bens`,
  `Inventário` para o Diretor e `Cadastro` representam rotas existentes;
  Inventário comunica a restrição ao Administrador e Relatórios permanece
  disabled;
- `/bens` e `/bens/[patrimonioId]` implementam consulta para os dois perfis,
  com busca submetida, filtros públicos, paginação e detalhe nas abas `Dados` e
  `Valores`;
- `/inventarios`, `/inventarios/[inventarioId]` e o detalhe do setor permitem
  selecionar um inventário aberto, buscar e paginar setores e iniciar ou
  retomar exatamente uma conferência; o Administrador recebe somente leitura;
- a rota de conferência do setor em andamento aceita leitura pela câmera ou
  entrada manual, valida o número patrimonial no boundary, serializa mutations,
  refaz o progresso confirmado e distingue sucesso, divergência, idempotência e
  erros públicos; a simbologia final ainda depende do teste com a etiqueta real;
- `/cadastro/patrimonio` oferece ao Diretor quatro etapas, revisão e confirmação
  de cadastro unitário; o Administrador recebe `Cadastro restrito` sem montar o
  formulário nem consultar catálogos;
- tokens semânticos mínimos sustentam a base visual compartilhada;
- a resposta de `GET /api/health` é validada no boundary antes de ser exibida;
- a consulta possui timeout de oito segundos, cancelamento da chamada anterior
  e nova tentativa manual;
- a URL da API é resolvida por configuração pública validada;
- em desenvolvimento, o host anunciado pelo Metro pode ser usado para alcançar
  a API local;
- a interface universal funciona em Android, iOS e navegador;
- o Expo Router possui rotas tipadas habilitadas;
- o EAS possui perfis para desenvolvimento, APK de distribuição interna e
  build de loja;
- staging e produção possuem um container `mobile-web` opcional com o export
  estático do Expo servido por Nginx;
- a suíte Vitest cobre a configuração pública e o cliente do health check;
- o CI exporta as plataformas, constrói o container `mobile-web` e verifica ao
  vivo o endpoint `/health` e o documento HTML servido na raiz;
- `orientation: "default"` permite retrato e paisagem, e a tela técnica adapta
  os cards em duas colunas quando a janela possui largura suficiente;
- as primeiras operações de leitura de domínio consultam setores, patrimônios e
  inventários com token em memória, paginação mínima, filtros existentes,
  timeout, cancelamento e validação dos schemas públicos;
- ainda não existem cache remoto, persistência offline, fila de sincronização
  ou E2E em dispositivos;
- testes cobrem configuração, HTTP, formulários, mapper patrimonial, storage,
  sessão, concorrência,
  redirects, home, completude do catálogo, política de `/check`, topbar e faixa
  de desenvolvimento.

O estado “Aplicativo móvel operacional” confirma apenas que o bundle React
Native inicializou. Ele não substitui o health check da API.

## Princípios

- Mantenha arquivos de rota pequenos e componha a experiência por feature.
- Valide parâmetros, configuração e responses nas fronteiras.
- Separe apresentação, formulário, estado remoto, persistência e HTTP.
- Use componentes nativos e APIs Expo compatíveis com o SDK instalado.
- Toda tela deve funcionar em telefone e tablet, tanto em retrato quanto em
  paisagem, usando o espaço disponível sem manter uma viewport de telefone com
  bordas laterais.
- Modele loading, vazio, erro, sucesso, indisponibilidade, offline e permissão.
- Não replique automaticamente decisões da Web sobre cookies, cache ou layout.
- Não introduza biblioteca, provider global ou abstração sem consumidor real.
- Meça em build release e em aparelho representativo antes de otimizar.

## Início rápido

Prepare o repositório conforme o [README principal](../../../README.md) e crie
`.env.development` a partir do exemplo. Depois inicie API e Metro:

```bash
pnpm dev:api
pnpm dev:mobile
```

Escaneie o QR code com um aparelho compatível ou use:

```bash
pnpm mobile:android
pnpm mobile:ios
pnpm mobile:web
```

`mobile:ios` exige macOS para abrir o simulador. A versão Web normalmente fica
em `http://localhost:8081` e exige essa origem em `CORS_ORIGINS` na API local.
Consulte [Execução, builds e distribuição](./builds-and-distribution.md) para
rede local, túnel HTTPS, Docker, APK e TestFlight.

## Documentos

| Assunto                                       | Documento                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| Estado operacional                            | [Handoff](./handoff.md)                                                 |
| Entregas e critérios de aceite                | [Roadmap](./roadmap.md)                                                 |
| Organização, camadas e estado                 | [Arquitetura](./architecture.md)                                        |
| Expo Router, parâmetros e deep links          | [Rotas e navegação](./routing-and-navigation.md)                        |
| Componentização e design system               | [Componentes e design system](./components-and-design-system.md)        |
| Formulários e contratos                       | [Formulários e validação](./forms-and-validation.md)                    |
| Layout adaptável, UX e acessibilidade         | [Responsividade, UX e acessibilidade](./responsive-ux-accessibility.md) |
| Credenciais, dispositivo, rede e dependências | [Segurança](./security.md)                                              |
| Frames, listas, rede, bundle e métricas       | [Performance](./performance.md)                                         |
| Desenvolvimento, testes e definição de pronto | [Testes e workflow](./testing-and-workflow.md)                          |
| Web, Expo Go, APK, lojas e TestFlight         | [Execução, builds e distribuição](./builds-and-distribution.md)         |
| Fontes oficiais                               | [Referências](./references.md)                                          |

A comunicação HTTP está em
[Integração mobile–API](../../integrations/mobile-api/README.md).

## Decisões pendentes do SIPAT

- validação do novo binário responsivo em tablets Android e iPad reais;
- biblioteca de estado remoto para dados de domínio;
- política de cache, persistência e operação offline;
- observabilidade, crash reporting e analytics;
- ampliar a suíte unitária e adicionar testes de componentes e E2E em
  dispositivos;
- demais permissões nativas, notificações e deep links universais;
- metas numéricas de inicialização, frames, memória, bundle e rede;
- publicação Android na Play Store e política de EAS Update.

Esses itens não são capacidades já implementadas. Registre a decisão junto da
primeira feature que realmente a exigir.

A navegação autenticada, o transporte access/refresh e o armazenamento no
`expo-secure-store` foram implementados em `MOBILE-AUTH-002`. Build EAS,
inspeção visual fina e validação de acessibilidade em aparelhos reais continuam
pendentes.
