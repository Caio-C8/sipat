# Arquitetura do aplicativo mobile

## Princípios

- `src/app` declara rotas e layouts; regra de negócio permanece fora dele.
- `@repo/contracts` é a fronteira compartilhada de dados, sem dependência de
  React Native ou Prisma.
- Dados externos são validados antes de entrar no estado da interface.
- Configuração, HTTP, persistência, estado remoto e apresentação são
  responsabilidades diferentes.
- Código específico de plataforma só existe quando o comportamento realmente
  difere; prefira uma implementação universal quando ela permanece clara.
- Providers globais devem ser mínimos e justificados por um consumidor real.

## Estrutura atual

```text
apps/mobile/
├── assets/
│   └── brasao.png
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── redefinir-senha.tsx
│   │   │   └── senha-atualizada.tsx
│   │   ├── _layout.tsx
│   │   └── check.tsx
│   ├── components/shared/
│   ├── features/
│   │   ├── auth/
│   │   └── home/
│   ├── theme/
│   ├── config/
│   │   └── public-app-config.ts
│   └── lib/
│       ├── api-health.ts
│       └── navigation/
├── app.json
├── eas.json
├── eslint.config.mjs
├── package.json
└── tsconfig.json
```

O layout raiz instala safe area, topbar, faixa exclusiva de desenvolvimento e
um `Stack` sem header. A rota `/check` faz a verificação técnica do runtime e da
API em development e apresenta o catálogo único das rotas. Os grupos `(auth)`
e `(app)` aplicam a matriz de sessão; `/` compõe a home protegida sem dados de
domínio. Não existe feature patrimonial nem cache remoto de domínio.

## Responsabilidades

- `src/app/`: rotas, layouts, composição da tela e limites de navegação.
- `src/config/`: leitura e validação da configuração pública incorporada ao
  bundle.
- `src/lib/`: infraestrutura agnóstica de domínio já necessária ao aplicativo.
- `src/components/ui/`: futuras primitives visuais sem conhecimento de domínio.
- `src/components/shared/`: futuras composições usadas por domínios distintos.
- `src/features/<dominio>/`: operações, estado, formulários e componentes de um
  domínio concreto.
- `assets/`: ícones, splash e imagens locais versionadas.

Não crie diretórios vazios para antecipar uma arquitetura. Adicione a camada
quando existir uma responsabilidade verificável.

## Estrutura de uma feature

Uma feature pode evoluir para:

```text
src/features/<dominio>/
├── api/
│   ├── get-recursos.ts
│   └── use-recursos.ts
├── components/
├── forms/
├── hooks/
└── lib/
```

A rota importa a API pública da feature e coordena navegação. Ela não deve
conter cliente HTTP duplicado, schema improvisado, persistência de credencial
ou regra que também precisa existir em outro fluxo.

## Estado

- Estado de navegação pertence ao Expo Router.
- Estado visual transitório fica próximo do componente.
- Estado de formulário pertence ao fluxo do formulário.
- Estado remoto exige política explícita de chave, retry, invalidação e cache.
- Estado persistido exige classificação do dado, expiração, migração e limpeza.
- Credenciais exigem armazenamento seguro e fluxo de sessão próprio.

O health check atual usa `useState`, `useEffect` e `AbortController` porque é
uma única operação sem cache. Isso não define a estratégia das futuras features.

## Estrutura aprovada para a primeira entrega autenticada

A estrutura abaixo é alvo das tarefas aprovadas e não representa código já
entregue:

```text
apps/mobile/src/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── redefinir-senha.tsx
│   │   └── senha-atualizada.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── _layout.tsx
│   └── check.tsx
├── components/
│   ├── shared/
│   │   ├── app-topbar.tsx
│   │   └── development-check-banner.tsx
│   └── ui/
├── features/
│   └── auth/
│       ├── api/
│       ├── components/
│       ├── forms/
│       ├── session/
│       └── storage/
├── lib/
│   └── api/
│       ├── core/
│       └── mobile-api-client.ts
└── config/
```

Os nomes finais devem ser confirmados contra as convenções do Expo Router
instalado. Grupos organizam políticas sem alterar as URLs. O layout raiz reúne
somente safe area, restauração da sessão e elementos realmente globais. O grupo
autenticado aplica a barreira de sessão; formulários, operações e armazenamento
continuam dentro da feature de autenticação.

Não crie todos os arquivos antecipadamente: cada tarefa adiciona somente os
módulos que possuirão comportamento e testes reais.

## Código por plataforma

Use `Platform` ou arquivos `.ios`, `.android`, `.native` e `.web` somente para
diferenças reais de API ou UX. Mantenha o contrato público igual entre as
implementações e teste cada plataforma afetada. Um desvio apenas visual deve
preferir tokens e estilos condicionais pequenos a árvores completamente
separadas.

## Telefone, tablet e janela

Responsividade é definida pelo espaço disponível, não por uma verificação fixa
de “telefone versus tablet”. Use dimensões da janela para adaptar colunas,
largura de conteúdo, navegação e densidade. Isso também cobre rotação, Split
View no iPad, multi-window no Android e redimensionamento no Web.

Uma tela pode limitar a largura de leitura de um bloco textual, mas o aplicativo
não pode manter toda a interface em uma viewport estreita de telefone e
preencher o restante do tablet com bordas vazias. Em paisagem, use o espaço
adicional para hierarquia, colunas ou respiro intencional sem esticar campos e
textos de forma ilegível.

Não bloqueie globalmente a orientação apenas para simplificar layout. Uma trava
por tela exige necessidade funcional documentada e teste nas duas plataformas.

## Dependências nativas

Instale pacotes compatíveis pelo `expo install`, confira suporte ao SDK 58 e
revise se há config plugin ou permissão nativa. Mudanças em código nativo,
plugins, ícone, splash ou permissões exigem novo binário; reiniciar apenas o
Metro não é suficiente. Quando esse caso surgir, adote e documente um
development build antes de depender da biblioteca.
