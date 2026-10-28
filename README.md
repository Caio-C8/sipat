# SIPAT

Sistema de Gestão Patrimonial da Câmara Municipal de Patos de Minas. O SIPAT
tem como objetivo centralizar e dar rastreabilidade ao ciclo de vida dos bens,
incluindo cadastro, consulta, movimentação, inventário, manutenção,
reavaliação, depreciação, baixa e relatórios.

Este monorepo reúne a aplicação Web, a API, o aplicativo móvel,
PostgreSQL/Prisma e pacotes compartilhados.

## Tecnologias incluídas

- pnpm workspaces e Turborepo para orquestrar o monorepo;
- Next.js em `apps/web`;
- NestJS em `apps/api`;
- Expo e React Native em `apps/mobile`;
- PostgreSQL e Prisma em `packages/database`;
- configurações compartilhadas em `packages/config`;
- contratos TypeScript em `packages/contracts`;
- utilitários agnósticos em `packages/utils`;
- Docker Compose separado para desenvolvimento, homologação (`staging`) e produção;
- CI com lint, tipos, testes, formatação e build.

## Estrutura

```text
.
├── apps/
│   ├── api/                 # API NestJS
│   ├── mobile/              # aplicativo Expo/React Native
│   └── web/                 # aplicação Next.js
├── packages/
│   ├── config/              # ESLint e TypeScript compartilhados
│   ├── database/            # Prisma, migrations e cliente do banco
│   ├── contracts/           # contratos compartilhados
│   └── utils/               # funções sem dependência de framework
├── docker/                  # imagens de produção
├── docs/                    # requisitos, decisões e guias de desenvolvimento
├── compose.yaml             # serviços comuns
├── compose.development.yaml # ajustes de desenvolvimento
├── compose.staging.yaml     # ajustes de homologação
└── compose.production.yaml  # ajustes de produção
```

Qualquer diretório adicionado diretamente em `apps/*` ou `packages/*` é
descoberto automaticamente pelo workspace. Consulte
[como adicionar apps](docs/adding-apps.md) antes de criar outro processo
executável.

## Escopo do produto e estado atual

Os requisitos funcionais, não funcionais, regras de negócio, casos de uso,
rastreabilidade e papéis estão consolidados em
[Requisitos do SIPAT](docs/requisitos-SIPAT.md). A
[visão geral do produto](docs/sipat.md) resume o contexto, os módulos previstos
e as fontes de verdade usadas pelo projeto.

No estado atual, a infraestrutura técnica e o modelo de dados do SIPAT estão
configurados. O schema Prisma e a migration inicial representam as entidades e
relações patrimoniais, enquanto a API ainda expõe apenas o health check e a Web
e o Mobile mantêm telas de infraestrutura. As novas entregas devem partir dos
requisitos versionados e atualizar a documentação de estado conforme forem
concluídas.

## Pré-requisitos

| Ferramenta                | Versão          | Uso no projeto                                                         | Instalação                                                                                                                         |
| ------------------------- | --------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Git                       | atual suportada | Clonar o repositório e versionar as alterações                         | [Downloads oficiais](https://git-scm.com/downloads/)                                                                               |
| NVM                       | atual suportada | Instalar e alternar a versão fixada do Node.js                         | [Windows](https://docs.nvm-windows.com/install/installers/) · [macOS/Linux](https://github.com/nvm-sh/nvm#installing-and-updating) |
| Node.js                   | 24.22.1         | Executar pnpm, scripts, API, Web e Mobile localmente                   | Instale pelo NVM ou use o [download oficial da versão 24.22.1](https://nodejs.org/en/download/archive/v24.22.1)                    |
| pnpm                      | 11.28.8         | Instalar dependências e executar o monorepo                            | Ativado pelo [Corepack](https://github.com/nodejs/corepack#how-to-install) incluído no Node.js 24                                  |
| Docker com Docker Compose | atual suportada | Executar o PostgreSQL e, opcionalmente, toda a aplicação em containers | [Docker Desktop](https://docs.docker.com/desktop/) · [Docker Engine e Compose](https://docs.docker.com/compose/install/)           |

O NVM é recomendado, mas não obrigatório: use o gerenciador correspondente ao seu sistema operacional ou instale diretamente a versão exata do Node.js. No Windows, NVM for Windows e `nvm-sh` são ferramentas diferentes; use NVM for Windows fora do WSL e `nvm-sh` dentro do WSL, macOS ou Linux. Depois de instalar uma ferramenta que altera o `PATH`, feche e reabra o terminal ou o VS Code.

O Docker Desktop já inclui Docker Engine e Docker Compose. Não é necessário instalar PostgreSQL ou Prisma separadamente: o PostgreSQL 17 é iniciado pelo Docker Compose e o Prisma é instalado como dependência do workspace.

As versões são fixadas em `.nvmrc`, `package.json`, Docker e CI. Em uma máquina nova ou depois de trocar a versão do Node, prepare o ambiente com:

```powershell
nvm install 24.22.1
nvm use 24.22.1
corepack enable
corepack install --global pnpm@11.28.8
node --version
pnpm --version
docker --version
docker compose version
git --version
```

O resultado esperado é `v24.22.1` para o Node.js e `11.28.8` para o pnpm. O
campo `packageManager` do `package.json` também faz o Corepack selecionar essa
versão ao executar comandos dentro do repositório. O comando
`corepack install --global` substitui o antigo
`corepack prepare pnpm@... --activate` nesta documentação.

No Windows, se `pnpm --version` ainda mostrar uma instalação global antiga, localize todos os executáveis com `where.exe pnpm`, remova a instalação global com `npm uninstall --global pnpm`, reabra o terminal e execute novamente `corepack enable`. Enquanto o `PATH` não for corrigido, use `corepack pnpm <comando>` para garantir a versão declarada pelo projeto.

### Versões principais da aplicação

Esta visão resume o baseline atual e, quando o manifest usa uma faixa, informa
a versão resolvida pelo lockfile. Os manifests e o `pnpm-lock.yaml` continuam
sendo as fontes de verdade.

| Área            | Versões adotadas                                                            |
| --------------- | --------------------------------------------------------------------------- |
| Toolchain       | Node.js 24.22.1 · pnpm 11.28.8                                              |
| API e contratos | NestJS 11.2.7 · Prisma 7.10.1 · Zod 4.6.7 · Nodemailer 10.2.1               |
| Web             | Next.js 16.4.3 · React/React DOM 19.3.1 · Zod 4.6.7                         |
| Mobile          | Expo SDK 58.0.19 · Expo Router 58.0.26 · React Native 0.88.0 · React 19.3.0 |
| Testes com Vite | Vitest 5.0.5 · Vite 8.3.5 resolvido por override de segurança               |

As resoluções transitivas e os patches que ainda não possuem substituição
oficial compatível estão explicados em
[Segurança mobile](docs/apps/mobile/security.md#dependências-e-cadeia-de-build).

## Desenvolvimento local

1. Crie o arquivo local de ambiente:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

   Em Bash, use `cp .env.development.example .env.development`.
   Execute `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` para preencher a variável `AUTH_RATE_LIMIT_HMAC_SECRET`.

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Inicie somente o PostgreSQL:

   ```bash
   pnpm infra:development:up
   ```

4. Gere o Prisma Client e aplique as migrations existentes:

   ```bash
   pnpm db:generate
   pnpm db:migrate:development
   ```

5. Inicie Web, API e Metro com hot reload:

   ```bash
   pnpm dev
   ```

- Web: <http://localhost:3000>
- API: <http://localhost:3001/api/health>
- Proxy web para API: <http://localhost:3000/api/backend/health>
- Mobile: abra o QR code do Metro no Expo Go, use os comandos Android/iOS ou entre na interface web <http://localhost:8081>.

Também é possível executar tudo em containers com `pnpm stack:development:up`.

## Homologação

`staging` é o nome técnico adotado para o ambiente de homologação.

```powershell
Copy-Item .env.staging.example .env.staging
```

Troque as credenciais no arquivo criado. O exemplo usa `localhost:3100` para
permitir a execução simultânea com desenvolvimento. Depois execute:

```bash
pnpm stack:staging:up
```

- Web Next.js: <http://localhost:3100>
- API: <http://localhost:3101/api/health>
- interface Web do mobile: <http://localhost:3181>

Para encerrar:

```bash
pnpm stack:staging:down
```

## Produção

```powershell
Copy-Item .env.production.example .env.production
```

Para teste local simultâneo, o exemplo usa `localhost:3200`. Preencha segredos
fortes e valide a configuração:

```bash
docker compose --profile mobile-web --env-file .env.production -f compose.yaml -f compose.production.yaml config
pnpm stack:production:up
```

- Web Next.js: <http://localhost:3200>
- API: <http://localhost:3201/api/health>
- interface Web do mobile: <http://localhost:3281>

Por padrão, as portas de produção são publicadas em `127.0.0.1`. Coloque Caddy, Nginx, Traefik, um ingress ou a plataforma de hospedagem na frente dos containers para TLS e domínio público.

Ao fazer um deploy real, substitua `WEB_URL`, `MOBILE_WEB_URL`,
`EXPO_PUBLIC_API_URL` e `CORS_ORIGINS` pelos domínios HTTPS públicos. Como
`EXPO_PUBLIC_API_URL` é incorporada ao JavaScript do mobile-web durante o
build, alterá-la exige reconstruir a imagem. Consulte a
[lógica de portas e isolamento dos ambientes](docs/environments.md).

## Comandos principais

| Comando                                                                             | Finalidade                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `pnpm dev`                                                                          | Executa todos os apps que têm script `dev`       |
| `pnpm dev:web` / `pnpm dev:api`                                                     | Executa apenas Web ou API                        |
| `pnpm dev:mobile`                                                                   | Inicia o Metro do aplicativo mobile              |
| `pnpm mobile:android`                                                               | Abre o app no Android                            |
| `pnpm mobile:ios`                                                                   | Abre o app no iOS; simulador exige macOS         |
| `pnpm mobile:web`                                                                   | Abre a interface mobile no navegador             |
| `pnpm mobile:build:android`                                                         | Gera um APK instalável pelo EAS                  |
| `pnpm mobile:build:testflight`                                                      | Gera e envia o build iOS ao TestFlight           |
| `pnpm stack:staging:up`                                                             | Sobe API, Web, mobile-web e banco em homologação |
| `pnpm stack:production:up`                                                          | Sobe API, Web, mobile-web e banco em produção    |
| `pnpm check`                                                                        | Gera Prisma Client, roda lint, tipos e testes    |
| `pnpm build:staging`                                                                | Build local com variáveis de homologação         |
| `pnpm build:production`                                                             | Build local com variáveis de produção            |
| `pnpm db:migrate:development`                                                       | Cria/aplica migrations durante desenvolvimento   |
| `pnpm db:migrate:staging`                                                           | Aplica migrations já versionadas em homologação  |
| `pnpm db:migrate:production`                                                        | Aplica migrations já versionadas em produção     |
| `pnpm db:studio`                                                                    | Abre o Prisma Studio no ambiente local           |
| `pnpm format`                                                                       | Formata arquivos suportados                      |
| `pnpm exec dotenv -e .env.development -- pnpm --filter @repo/api provisionar:admin` | Criar usuário administrador através do terminal  |

O guia completo do aplicativo — Web, Expo Go, rede local, túnel HTTPS, APK e
TestFlight — está em
[Execução, builds e distribuição mobile](docs/apps/mobile/builds-and-distribution.md).

## Regras para evoluir o SIPAT

- Não coloque regra de negócio em `packages/config`, `contracts` ou `utils`.
- Uma aplicação não deve importar arquivos internos de outra aplicação.
- Compartilhe contratos estáveis por pacotes, usando dependências `workspace:*`.
- Implemente os módulos patrimoniais a partir de requisitos e regras de negócio
  versionados, sem inferir semânticas ausentes.
- Registre no roadmap correspondente cada nova capacidade relevante antes de
  alterar contratos externos.
- Crie migrations somente em desenvolvimento; staging e produção usam `migrate deploy`.
- Não versione `.env.development`, `.env.staging` ou `.env.production`.
- Trate imagens Docker como artefatos imutáveis e use `IMAGE_TAG` por versão/commit.

Mais detalhes estão em [arquitetura](docs/architecture.md),
[contratos compartilhados](docs/contracts/README.md) e
[ambientes](docs/environments.md). Consulte também o
[índice completo da documentação](docs/README.md). Para trabalhos com passagem
formal entre conversas de planejamento, implementação e versionamento, use o
[fluxo entre agentes](docs/agents/workflow.md).

Para preparar movimentações em ciclos de planejamento, implementação e
versionamento, consulte o [guia de prompts](PROMPTS-MOVIMENTACOES.md).

## Seed local de movimentações

O seed padrão não insere dados. Para adicionar um patrimônio fictício e seus
cadastros auxiliares ao banco local de desenvolvimento:

```powershell
$env:SIPAT_SEED_MOVIMENTACOES = 'true'
pnpm db:seed:development
Remove-Item Env:SIPAT_SEED_MOVIMENTACOES
```

Exige `APP_ENV=development` e banco `sipat` em servidor local. Cria um notebook
ativo com numeração temporária `SP-...`, situação contábil inicial, responsável,
natureza, espécie, dois setores e comissão de demonstração vigente de 2026 a 2036. Os nomes auxiliares usam o prefixo `DEMO -`.

A reexecução não duplica os registros nem redefine o setor/status de um bem já
movimentado. Não limpa dados, não cria transferências e não cria ou altera
usuários, senhas ou perfis.

Para registrar, entre com um usuário Diretor de Patrimônio, abra
`/movimentacoes` e use **Nova movimentação**, no canto superior direito.
Administrador possui somente consulta. O seed pode ser reexecutado para
localizar os dados disponíveis; ele não desfaz testes já realizados.
