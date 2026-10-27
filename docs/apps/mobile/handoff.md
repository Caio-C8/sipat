# Handoff do aplicativo mobile

## Estado operacional

O mobile possui a infraestrutura inicial e a fundação visual: grupos `(auth)` e
`(app)`, shells das cinco rotas aprovadas, safe area global, topbar SIPAT com
brasão local, faixa exclusiva de development, tokens semânticos e `/check` com
o health check existente. Ainda não há sessão, formulários ou guard de acesso.

O baseline usa Expo SDK 58, React Native 0.88 e React 19.3. A migração passou
nas verificações locais, nos três exports, no Expo Doctor e no smoke test do
container `mobile-web`; o novo binário ainda precisa ser gerado no EAS e
validado em dispositivo real.

Vitest cobre configuração pública, cliente do health check, rotas e renderização
dos componentes compartilhados. O CI também
constrói e inicia o container `mobile-web`, consulta `/health` e confirma que a
raiz serve HTML. Ainda não existem autenticação, navegação de domínio, dados
persistidos, operações patrimoniais, cache/offline ou E2E em dispositivos.

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
