# Execução, builds e distribuição

## Quatro formas de executar

| Forma                  | Comando principal              | Precisa do Metro | Resultado                                  |
| ---------------------- | ------------------------------ | ---------------- | ------------------------------------------ |
| Web em desenvolvimento | `pnpm mobile:web`              | sim              | interface no navegador, normalmente `8081` |
| Web em Docker          | `pnpm stack:staging:up`        | não              | export estático servido por Nginx          |
| Expo Go                | `pnpm dev:mobile`              | sim              | bundle aberto no app Expo Go               |
| APK Android            | `pnpm mobile:build:android`    | não              | APK assinado para instalação direta        |
| TestFlight             | `pnpm mobile:build:testflight` | não              | build de loja enviado ao App Store Connect |

O comando `pnpm --filter @repo/mobile build` apenas exporta bundles para
Android, iOS e Web. Ele não gera um binário nativo instalável.

## Pré-requisitos locais

- Node.js 24.19.0 e pnpm 11.19.0, conforme a raiz do monorepo;
- dependências instaladas com `pnpm install`;
- `.env.development` criado a partir de `.env.development.example`;
- API e PostgreSQL preparados conforme o README principal;
- Expo Go compatível ou emulador/simulador para desenvolvimento;
- conta Expo para builds EAS;
- conta Apple Developer paga e app no App Store Connect para TestFlight.

Valide o ambiente mobile com:

```bash
pnpm mobile:doctor
```

## Desenvolvimento com API local

Em terminais separados:

```bash
pnpm infra:development:up
pnpm dev:api
pnpm dev:mobile
```

Também é possível iniciar todos os apps com `pnpm dev`. A API responde em
`http://localhost:3001/api/health` no host.

Quando `EXPO_PUBLIC_API_URL` está vazio em development, o app usa o hostname
anunciado pelo Metro e `EXPO_PUBLIC_API_PORT`. Isso funciona quando o aparelho
consegue alcançar o computador na mesma rede.

Em aparelho físico, `localhost` é o próprio aparelho. Se a descoberta
automática não funcionar, use uma destas opções:

1. configure `EXPO_PUBLIC_API_URL=http://<ip-do-computador>:3001`;
2. permita a porta no firewall e faça a API escutar na interface necessária;
3. mantenha computador e aparelho em uma rede que aceite comunicação entre
   clientes;
4. para teste fora da LAN, use um túnel HTTPS temporário.

Expor `BIND_ADDRESS=0.0.0.0` aumenta a superfície local e deve ser feito somente
em uma rede confiável. Redes corporativas, guest Wi-Fi, isolamento de clientes,
VPN e firewall podem impedir acesso mesmo com o IP correto.

### Túnel HTTPS temporário

Com a API ativa na porta 3001:

```bash
cloudflared tunnel --url http://localhost:3001
```

Use a URL HTTPS apresentada como `EXPO_PUBLIC_API_URL` e mantenha o processo do
túnel aberto. Quick Tunnels mudam de endereço quando recriados e não são uma
origem estável de produção. Um APK incorpora a URL no bundle: se o túnel parar
ou mudar, é preciso atualizar a configuração e gerar outro build.

## Executar no navegador

```bash
pnpm dev:api
pnpm mobile:web
```

Abra `http://localhost:8081`. Como esta execução está no navegador, a API deve
permitir essa origem:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

O aplicativo nativo não é limitado pelo CORS do navegador, mas continua sujeito
a conectividade, TLS, autenticação e autorização.

## Export Web de produção

Para gerar os artefatos do monorepo com `.env.production` local:

```bash
pnpm build:production
```

O export estático mobile fica em `apps/mobile/dist/web`. Gerar a pasta não a
publica sozinho. Para staging e produção, o repositório também constrói esse
export em `docker/mobile-web.Dockerfile` e o serve por Nginx em um container
separado da Web Next.js.

### Homologação em Docker

Crie `.env.staging` a partir do exemplo e execute:

```bash
pnpm stack:staging:up
```

A interface mobile-web fica em `http://localhost:3181` e a API em
`http://localhost:3101`. O script habilita o profile `mobile-web`, constrói o
bundle com as variáveis `EXPO_PUBLIC_*`, espera o health check da API e inicia o
servidor estático.

### Produção em Docker

Crie `.env.production` a partir do exemplo, revise os valores e execute:

```bash
pnpm stack:production:up
```

Para teste local, a interface fica em `http://localhost:3281` e a API em
`http://localhost:3201`. Em um deploy real, publique ambas por HTTPS e defina:

```env
MOBILE_WEB_URL=https://mobile.sipat.example.gov.br
EXPO_PUBLIC_API_URL=https://api.sipat.example.gov.br
CORS_ORIGINS=https://sipat.example.gov.br,https://mobile.sipat.example.gov.br
```

`EXPO_PUBLIC_API_URL` é incorporada ao JavaScript durante `docker build`; não é
uma configuração de runtime do Nginx. Depois de alterá-la, use `--build` (já
incluído nos scripts) para reconstruir a imagem. A URL precisa ser alcançável
pelo navegador: `http://api:3001` funciona apenas entre containers e não pode
ser usado pelo cliente.

O servidor estático não usa fallback de SPA. O Expo Router com
`web.output: "static"` gera HTML para cada rota conhecida, e rotas dinâmicas
futuras precisarão ser exportadas explicitamente. O endpoint `/health` verifica
o container Nginx; a tela continua verificando a API separadamente.

## Ambientes e variáveis

| Contexto                 | Fonte principal                                  |
| ------------------------ | ------------------------------------------------ |
| desenvolvimento local    | `.env.development`                               |
| export local de produção | `.env.production`                                |
| Docker mobile-web        | argumentos de build vindos do `.env` do ambiente |
| EAS development          | ambiente remoto `development`                    |
| APK `preview`            | ambiente remoto `preview`                        |
| loja/TestFlight          | ambiente remoto `production`                     |

Variáveis usadas no cliente:

| Variável               | Finalidade                                           |
| ---------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_APP_NAME` | nome público da aplicação                            |
| `EXPO_PUBLIC_APP_ENV`  | `development`, `staging`, `production` ou `test`     |
| `EXPO_PUBLIC_API_URL`  | origem alcançável da API, sem o sufixo `/api/health` |
| `EXPO_PUBLIC_API_PORT` | porta do fallback local usado apenas em development  |

Todas são públicas. O `.env.production` do computador não envia valores
automaticamente ao EAS. O perfil `preview` usa o ambiente remoto `preview`, e o
perfil `production` usa o ambiente remoto `production`.

Configure a partir de `apps/mobile` ou pelo dashboard do projeto:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_APP_ENV --value staging --visibility plaintext
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value https://api-staging.example.gov.br --visibility plaintext
npx eas-cli@latest env:list --environment preview
```

Repita para `production` com domínio estável e valores de produção. Não use URL
`trycloudflare.com` em um release duradouro.

## Gerar e baixar o APK Android

O perfil `preview` possui distribuição interna e `android.buildType: apk`:

```bash
npx eas-cli@latest login
pnpm mobile:build:android
```

O EAS instala Node.js 24.19.0 e pnpm 11.19.0, gera ou reutiliza a keystore
remota, compila e retorna uma página de build. Nessa página, abra o link no
Android ou baixe o APK e transfira-o ao aparelho. O Android pode pedir permissão
para instalar apps dessa fonte.

O APK executa sozinho: API e túnel precisam estar acessíveis, mas Metro e o
computador que iniciou o build não. Teste instalação limpa, atualização,
abertura offline e chamada da API antes de compartilhar.

Alterações de orientação em `app.json` são nativas. Um APK já instalado não
passa a aceitar paisagem ao receber apenas novo bundle JavaScript; gere outro
APK e reinstale/atualize o aplicativo para validar telefone e tablet.

### Android de loja

APK de `preview` é adequado para teste direto, não para publicação padrão na
Play Store. O perfil `production` gera por padrão um Android App Bundle (AAB):

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile production
```

O fluxo de envio à Play Store ainda não possui script nem configuração de
submit no repositório e deve ser implementado quando a publicação fizer parte
do escopo.

## iOS e TestFlight

Confirme que `br.leg.mg.patosdeminas.sipat` pertence à organização e que existe
um app correspondente no App Store Connect. Para criar e enviar em uma etapa:

```bash
pnpm mobile:build:testflight
```

Ou separe build e envio:

```bash
pnpm mobile:build:ios
pnpm mobile:submit:ios
```

O EAS solicita ou reutiliza certificado e provisioning profile. Depois do
processamento da Apple, adicione testadores internos/externos no TestFlight. O
auto-submit envia ao TestFlight; publicação pública na App Store ainda exige o
fluxo de revisão e liberação no App Store Connect.

`ITSAppUsesNonExemptEncryption` está como `false`. Revise esse valor se o app
passar a usar criptografia não isenta além dos usos comuns oferecidos pelo
sistema.

## Versão e assinatura

- `app.json` contém a versão pública do app;
- `cli.appVersionSource: remote` mantém build numbers/versionCode no EAS;
- `autoIncrement` está habilitado no perfil de produção;
- Android package e iOS bundle identifier devem permanecer estáveis depois da
  publicação;
- credenciais gerenciadas pelo EAS não são adicionadas ao Git;
- mudança nativa ou de config plugin exige novo binário.

## Problemas conhecidos e diagnóstico

### Versão do Node incompatível

O workspace usa `engineStrict`. Os perfis fixam Node.js 24.19.0 e pnpm 11.19.0
porque a imagem padrão do EAS pode possuir versões diferentes. Confirme o perfil:

```bash
cd apps/mobile
npx eas-cli@latest config --platform android --profile preview
```

### `EEXIST` ao instalar pnpm

Não habilite `corepack: true` junto de `pnpm` no mesmo perfil. O EAS deve
instalar a versão declarada diretamente; habilitar os dois pode criar o mesmo
executável duas vezes.

### API indisponível no APK

Confirme que a URL foi definida no ambiente EAS do perfil, começa com HTTPS,
não usa `localhost`, permanece ativa e responde no aparelho. Alterar o `.env`
depois do build não muda o APK já gerado.

### API indisponível no mobile-web em Docker

Confirme que a imagem foi reconstruída com a URL correta, que a URL usa a
porta ou o domínio vistos pelo navegador e que `CORS_ORIGINS` inclui
`MOBILE_WEB_URL` exatamente. Em uma página HTTPS, a API também deve usar HTTPS;
o navegador bloqueia conteúdo ativo HTTP misto.

## Checklist de distribuição

- lint, typecheck, export e Expo Doctor aprovados;
- ambiente EAS e URL pública conferidos;
- API HTTPS estável e health check acessível pelo aparelho;
- versão, package/bundle ID, nome, ícones e splash conferidos;
- telefone, tablet Android e iPad verificados em retrato e paisagem, sem
  letterboxing ou viewport de telefone centralizada;
- rotação e modos de janela suportados não perdem estado nem quebram o layout;
- nenhum segredo em `EXPO_PUBLIC_*` ou no bundle;
- artefato instalado do zero e sem Metro;
- fluxos críticos testados em build release;
- permissões e declarações de privacidade atualizadas;
- credenciais de assinatura protegidas;
- rollback/mitigação definidos para uma regressão crítica.
