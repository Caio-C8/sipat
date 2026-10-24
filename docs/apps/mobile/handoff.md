# Handoff do aplicativo mobile

## Estado operacional

O mobile possui somente infraestrutura inicial: rota técnica, safe area,
configuração pública, health check, export Android/iOS/Web e perfis EAS. A tela
funciona no navegador, possui imagem estática para os stacks Docker de staging
e produção, e os builds remotos possuem runtime alinhado ao monorepo.

O baseline usa Expo SDK 58, React Native 0.88 e React 19.3. A migração passou
nas verificações locais, nos três exports, no Expo Doctor e no smoke test do
container `mobile-web`; o novo binário ainda precisa ser gerado no EAS e
validado em dispositivo real.

Vitest cobre configuração pública e cliente do health check. O CI também
constrói e inicia o container `mobile-web`, consulta `/health` e confirma que a
raiz serve HTML. Ainda não existem autenticação, navegação de domínio, dados
persistidos, operações patrimoniais, cache/offline, testes de componentes ou
E2E em dispositivos.

O bloqueio global em retrato foi removido com `orientation: "default"`. A home
usa a largura atual da janela e apresenta os cards em duas colunas a partir de
900 pontos lógicos. A verificação em tablet Android e iPad reais continua
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
