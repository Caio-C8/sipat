# Handoff do aplicativo mobile

## Estado operacional

O mobile possui a infraestrutura inicial, a fundação visual e a autenticação
nativa. Os grupos `(auth)` e `(app)` aplicam a matriz de acesso; login, troca
obrigatória, confirmação, restauração, refresh coordenado e logout usam os
contratos de `/api/auth/mobile`. O access token fica em memória e o refresh fica
atrás do adapter `expo-secure-store` nativo.

O baseline usa Expo SDK 58, React Native 0.88 e React 19.3. A migração passou
nas verificações locais, nos três exports, no Expo Doctor e no smoke test do
container `mobile-web`; o novo binário ainda precisa ser gerado no EAS e
validado em dispositivo real.

Vitest cobre configuração, HTTP, formulários, storage, sessão, concorrência,
redirects, home, catálogo de rotas, política de `/check` e componentes
compartilhados. A validação local também executou o
cliente contra API e PostgreSQL reais para login, refresh, primeiro acesso e
logout. O CI também
constrói e inicia o container `mobile-web`, consulta `/health` e confirma que a
raiz protegida e `/check` servem HTML sem expor o conteúdo de development.
Ainda não existem navegação de domínio, cache/offline ou E2E em dispositivos.

`MOBILE-UI-001` implementou o shell comum observado na página `Telas Mobile`:
topbar azul-marinho com brasão e identificação municipal, safe area coerente e
bottom bar somente em `(app)`. `Início` é o único destino ativo; Bens,
Inventário, Cadastro e Relatórios permanecem disabled, sem rotas placeholder.
O `DevelopmentCheckBanner` não foi alterado. `MOBILE-AUTH-003` recompôs login,
troca obrigatória e confirmação conforme os três frames do Figma, preservando
contratos, sessão e redirects; a recuperação aparece disabled, sem rota.
`INVENTARIOS-003` e `MOBILE-HOME-002` continuam aprovados e não implementados;
eles cobrem as consultas necessárias e a Home de domínio.

`MOBILE-HOME-001` tornou `/` a home autenticada inicial com logout e sem dados
de domínio. `/check` preserva o diagnóstico de runtime/API, acrescenta o
catálogo tipado de todas as rotas e atravessa o gate de restauração somente em
`development`; staging e produção aplicam a mesma decisão de sessão da home.

O bloqueio global em retrato foi removido com `orientation: "default"`. A tela
`/check` usa a largura atual da janela e apresenta os cards em duas colunas a
partir de 900 pontos lógicos; topbar, faixa e shells permitem reflow de texto.
A verificação em tablet Android, iPad, TalkBack e VoiceOver reais continua
pendente e exige um novo binário; APKs anteriores preservam a configuração
nativa antiga.

## Antes da primeira feature

1. registre a entrega no [roadmap](./roadmap.md);
2. confirme requisitos, contrato e endpoint reais;
3. defina plataformas, acesso, estados, limites e falhas;
4. decida armazenamento e offline somente se o fluxo exigir;
5. implemente operação, UI e testes na mesma fronteira verificável;
6. valide Web e builds nativos afetados;
7. atualize este handoff com o estado realmente entregue.

## Verificação da infraestrutura

```bash
pnpm --filter @repo/mobile lint
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/mobile test
pnpm --filter @repo/mobile build
pnpm mobile:doctor
pnpm format:check
```

Para distribuição, execute também o build EAS adequado e instale o artefato em
um dispositivo. Um export bem-sucedido não valida assinatura nem build nativo.
