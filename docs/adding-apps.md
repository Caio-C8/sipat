# Adicionando aplicações e pacotes

## Outro app web

Crie o app diretamente em `apps`, dê a ele um nome de pacote único como `@repo/admin` e forneça, quando aplicável, os scripts `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck` e `test`.

Exemplo com Next.js:

```bash
pnpm create next-app apps/admin --ts --eslint --app --use-pnpm
```

Depois alinhe o `tsconfig` e o ESLint com `@repo/config`. O Turborepo o descobre automaticamente. Para implantá-lo, acrescente um Dockerfile e um serviço Compose próprio; não sobrecarregue o serviço `web` existente.

## App mobile

Expo/React Native pode conviver no mesmo workspace:

```bash
pnpm dlx create-expo-app@latest apps/mobile
```

Renomeie o pacote para `@repo/mobile` e adicione scripts de lint e tipos. Reutilize `@repo/contracts` e funções realmente agnósticas de plataforma de `@repo/utils`. Não importe `@repo/database` no cliente mobile e não compartilhe componentes DOM com React Native.

Se o Metro não resolver pacotes do workspace automaticamente, configure o workspace root conforme a versão do Expo usada no novo projeto.

## Worker ou serviço adicional

Um worker deve ser outro app, por exemplo `apps/worker`, com processo e imagem próprios. Ele pode depender dos mesmos contratos e banco, mas deve ter health check, variáveis e deploy independentes.

## Novo pacote

Crie `packages/<nome>/package.json` com nome `@repo/<nome>`, marque-o como `private` e use `workspace:*` nos consumidores. Só crie um pacote quando houver um limite claro ou reutilização por mais de um app.

Para executar uma unidade específica:

```bash
pnpm turbo run dev --filter=@repo/mobile
pnpm turbo run build --filter=@repo/admin
```
