# `MOBILE-DEPS-001` — Atualizar Expo SDK 58 e reavaliar patches transitivos

**Status:** `em validação externa`

## Objetivo

Migrar o aplicativo mobile do Expo SDK 57 para o SDK 58 com as versões
compatíveis de React Native e React, retirar o patch de
`decode-uri-component` quando a árvore instalada deixar de consumi-lo e
registrar uma disposição verificável para o Zod 3 usado pela CLI do Expo.

## Contexto e referências

- Roadmap: [aplicativo mobile](../apps/mobile/roadmap.md).
- Requisitos e decisões: [segurança mobile](../apps/mobile/security.md) e
  [builds e distribuição](../apps/mobile/builds-and-distribution.md).
- Estado anterior à migração: o Expo SDK 57.0.31 resolvia
  `expo-router -> query-string@7.1.3 -> decode-uri-component@0.2.2` e
  `@expo/cli -> zod@3.25.76`.

## Escopo

- seguir o procedimento oficial de upgrade para o Expo SDK 58;
- alinhar `expo`, Expo Router, React Native, React, React DOM e os packages Expo
  às versões recomendadas pelo SDK;
- executar `expo install --fix` e revisar toda alteração nativa/config plugin;
- confirmar a árvore instalada com `pnpm why` e remover o patch de
  `decode-uri-component` somente se nenhuma cópia afetada permanecer;
- verificar se a versão atual da CLI do Expo ainda usa Zod 3 sem backport para
  o advisory `GHSA-mrhx-c7xc-m3w5`;
- se o Zod 3 permanecer, comparar uma atualização oficial da CLI com um
  backport local mínimo do commit oficial, acompanhado de teste comportamental
  contra coleções adversariais, antes de escolher a mitigação;
- atualizar a documentação e o script `security:patches` conforme a árvore
  efetivamente instalada.

## Fora do escopo

- migrar NestJS, Prisma, ESLint ou outras majors sem relação com o SDK;
- forçar Zod 3 para Zod 4 por override;
- remover o patch de `node-forge` sem release oficial corrigida ou substituição
  validada da dependência;
- adicionar features de domínio ao aplicativo mobile.

## Decisões aprovadas

- não substituir `decode-uri-component@0.2.2` por `0.5.x` dentro do Expo SDK 57,
  pois a linha corrigida é ESM e está fora do intervalo aceito pelo consumidor;
- não tratar o Zod 3 da CLI como código de runtime do aplicativo, mas manter o
  risco explícito na cadeia de build enquanto não houver correção compatível;
- preservar os patches e seus testes até que a árvore instalada prove que cada
  um deixou de ser necessário.

## Critérios de aceite

- [x] `pnpm why` não encontra `decode-uri-component@0.2.2` antes da remoção do
      patch correspondente;
- [x] `pnpm audit` não apresenta finding não mitigado de runtime introduzido
      pela migração;
- [x] uma disposição explícita e testada existe para o Zod 3 da CLI;
- [x] `pnpm security:patches` cobre apenas patches ainda ativos;
- [x] lint, typecheck, testes e export Android/iOS/Web do mobile passam;
- [x] Expo Doctor passa sem incompatibilidades do SDK;
- [x] o container `mobile-web` e a configuração Compose continuam válidos;
- [ ] pelo menos um build nativo de desenvolvimento ou preview é gerado e
      validado em dispositivo real antes de considerar a migração concluída.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/package.json`, `apps/mobile/app.json` e `apps/mobile/eas.json`;
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `patches/` e
  `scripts/verify-security-patches.mjs`;
- `docker/mobile-web.Dockerfile` e manifests Compose relacionados;
- `docs/apps/mobile/`.

## Verificações esperadas

- `pnpm install --frozen-lockfile` após gerar e revisar o lockfile;
- `pnpm security:patches` e `pnpm audit --prod`;
- `pnpm --filter @repo/mobile lint`, `typecheck`, `test` e `build`;
- `pnpm mobile:doctor`;
- build e smoke test da imagem `mobile-web`;
- build EAS e teste em dispositivo real conforme
  [builds e distribuição](../apps/mobile/builds-and-distribution.md).

## Resultado da execução local

- Expo SDK 58.0.19, Expo Router 58.0.26, React Native 0.88.0 e React 19.3.0
  alinhados pelo `expo install --fix`;
- `decode-uri-component@0.2.2` deixou a árvore e o patch foi removido;
- Expo CLI 58.1.15 continua em Zod 3.25.76, mitigado por backport local do
  short-circuit de limites superiores e regressão comportamental;
- lint, typecheck, 10 testes, exports Android/iOS/Web, Expo Doctor 20/20,
  imagem/smoke test `mobile-web` e validação Compose passaram;
- `pnpm install --frozen-lockfile`, verificação de peers, `pnpm check`,
  `pnpm build`, `pnpm format:check` e `git diff --check` passaram; os tipos React
  do Web foram alinhados à linha 19.3 para evitar duas identidades de `Ref` no
  consumidor compartilhado;
- `pnpm audit --prod` ainda sinaliza `node-forge@1.4.0` e `zod@3.25.76` pelo
  número da versão; ambos possuem patches ativos cobertos por
  `pnpm security:patches`.

## Pendências ou decisões bloqueantes

- A migração foi autorizada nesta execução. A sessão EAS local não está
  autenticada, por isso o build `preview` não pôde ser gerado.
- Após autenticar com `npx eas-cli@latest login`, execute
  `pnpm mobile:build:android`, instale o APK e valide-o em dispositivo real antes
  de marcar a tarefa como concluída.
