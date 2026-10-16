# Desenvolvimento do aplicativo mobile

Este diretório documenta o padrão de desenvolvimento de `apps/mobile`.

## Objetivo

O aplicativo é o cliente Android e iOS do SIPAT. O baseline usa Expo SDK 57,
React Native 0.86.3, React 19.2.3, Expo Router, TypeScript estrito e React Native
Web para inspeção da interface no navegador.

O mobile pode importar contratos agnósticos de plataforma de
`@repo/contracts`, mas não importa `@repo/database`, código interno da Web ou
código interno da API.

## Estado atual

- `/` apresenta o runtime do aplicativo e o health check da API;
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
- `orientation: "default"` permite retrato e paisagem, e a tela técnica adapta
  os cards em duas colunas quando a janela possui largura suficiente;
- ainda não existem autenticação, armazenamento persistente, operação de
  domínio, formulário, cache remoto, modo offline ou suíte automatizada mobile.

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

- identidade visual, tema e tokens definitivos;
- validação do novo binário responsivo em tablets Android e iPad reais;
- navegação autenticada e fluxo de sessão;
- armazenamento seguro da credencial;
- biblioteca de formulários e estado remoto;
- política de cache, persistência e operação offline;
- observabilidade, crash reporting e analytics;
- suíte unitária, de componentes e E2E em dispositivos;
- permissões nativas, notificações e deep links universais;
- metas numéricas de inicialização, frames, memória, bundle e rede;
- publicação Android na Play Store e política de EAS Update.

Esses itens não são capacidades já implementadas. Registre a decisão junto da
primeira feature que realmente a exigir.
