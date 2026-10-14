# Project Starter

Base para iniciar produtos com múltiplas aplicações em um único monorepo. A
estrutura reúne aplicação web, API, PostgreSQL/Prisma e pacotes compartilhados.
A branch `main` contém somente a estrutura reutilizável; o exemplo didático de
Produto permanece preservado em uma tag versionada.

## Tecnologias incluídas

- pnpm workspaces e Turborepo para orquestrar o monorepo;
- Next.js em `apps/web`;
- NestJS em `apps/api`;
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
│   └── web/                 # aplicação Next.js
├── packages/
│   ├── config/              # ESLint e TypeScript compartilhados
│   ├── database/            # Prisma, migrations e cliente do banco
│   ├── contracts/           # contratos compartilhados
│   └── utils/               # funções sem dependência de framework
├── docker/                  # imagens de produção
├── docs/                    # decisões e guias de expansão
├── compose.yaml             # serviços comuns
├── compose.development.yaml # ajustes de desenvolvimento
├── compose.staging.yaml     # ajustes de homologação
└── compose.production.yaml  # ajustes de produção
```

Qualquer diretório adicionado diretamente em `apps/*` ou `packages/*` é descoberto automaticamente pelo workspace. Consulte [como adicionar apps](docs/adding-apps.md) antes de criar um novo web, worker ou mobile.

## Reutilização e exemplo versionado

A branch `main` destinada ao GitHub Template deve conter somente a base limpa.
O exemplo completo de Produto deve ser preservado em tags anotadas como
`exemplo-produto-v1.0.0`; essas tags permanecem no repositório de origem, mas
não entram no código nem no histórico dos projetos gerados pelo template.

Para consultar o procedimento da primeira separação ou publicar uma nova versão
do exemplo, siga o guia de
[manutenção da base e versionamento do exemplo](docs/template-and-example.md).
O guia também define o que deve permanecer configurado entre Web, API e banco
de dados depois da limpeza.

## Pré-requisitos

| Ferramenta                | Versão          | Uso no projeto                                                         | Instalação                                                                                                                         |
| ------------------------- | --------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Git                       | atual suportada | Clonar o repositório e versionar as alterações                         | [Downloads oficiais](https://git-scm.com/downloads/)                                                                               |
| NVM                       | atual suportada | Instalar e alternar a versão fixada do Node.js                         | [Windows](https://docs.nvm-windows.com/install/installers/) · [macOS/Linux](https://github.com/nvm-sh/nvm#installing-and-updating) |
| Node.js                   | 24.19.0         | Executar pnpm, scripts, API e aplicação web localmente                 | Instale pelo NVM ou use o [download oficial da versão 24.19.0](https://nodejs.org/download/release/v24.19.0/)                      |
| pnpm                      | 11.19.0         | Instalar dependências e executar o monorepo                            | Ativado pelo Corepack incluído no Node.js; consulte a [documentação do pnpm](https://pnpm.io/installation)                         |
| Docker com Docker Compose | atual suportada | Executar o PostgreSQL e, opcionalmente, toda a aplicação em containers | [Docker Desktop](https://docs.docker.com/desktop/) · [Docker Engine e Compose](https://docs.docker.com/compose/install/)           |

O NVM é recomendado, mas não obrigatório: use o gerenciador correspondente ao seu sistema operacional ou instale diretamente a versão exata do Node.js. No Windows, NVM for Windows e `nvm-sh` são ferramentas diferentes; use NVM for Windows fora do WSL e `nvm-sh` dentro do WSL, macOS ou Linux. Depois de instalar uma ferramenta que altera o `PATH`, feche e reabra o terminal ou o VS Code.

O Docker Desktop já inclui Docker Engine e Docker Compose. Não é necessário instalar PostgreSQL ou Prisma separadamente: o PostgreSQL 17 é iniciado pelo Docker Compose e o Prisma é instalado como dependência do workspace.

As versões são fixadas em `.nvmrc`, `package.json`, Docker e CI. Em uma máquina nova ou depois de trocar a versão do Node, prepare o ambiente com:

```powershell
nvm install 24.19.0
nvm use 24.19.0
corepack enable
corepack prepare pnpm@11.19.0 --activate
node --version
pnpm --version
docker --version
docker compose version
git --version
```

No Windows, se `pnpm --version` ainda mostrar uma instalação global antiga, localize todos os executáveis com `where.exe pnpm`, remova a instalação global com `npm uninstall --global pnpm`, reabra o terminal e execute novamente `corepack enable`. Enquanto o `PATH` não for corrigido, use `corepack pnpm <comando>` para garantir a versão declarada pelo projeto.

## Desenvolvimento local

1. Crie o arquivo local de ambiente:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

   Em Bash, use `cp .env.development.example .env.development`.

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Inicie somente o PostgreSQL:

   ```bash
   pnpm infra:development:up
   ```

4. Gere o Prisma Client e crie a primeira migration depois de adicionar seus modelos:

   ```bash
   pnpm db:generate
   pnpm db:migrate:development
   ```

5. Inicie web e API com hot reload:

   ```bash
   pnpm dev
   ```

- Web: <http://localhost:3000>
- API: <http://localhost:3001/api/health>
- Proxy web para API: <http://localhost:3000/api/backend/health>

Também é possível executar tudo em containers com `pnpm stack:development:up`.

## Homologação

`staging` é o nome técnico adotado para o ambiente de homologação.

```powershell
Copy-Item .env.staging.example .env.staging
```

Troque as credenciais no arquivo criado. O template usa `localhost:3100` para
permitir a execução simultânea com desenvolvimento. Depois execute:

```bash
pnpm stack:staging:up
```

Para encerrar:

```bash
pnpm stack:staging:down
```

## Produção

```powershell
Copy-Item .env.production.example .env.production
```

Para teste local simultâneo, o template usa `localhost:3200`. Preencha segredos
fortes e valide a configuração:

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml config
pnpm stack:production:up
```

Por padrão, as portas de produção são publicadas em `127.0.0.1`. Coloque Caddy, Nginx, Traefik, um ingress ou a plataforma de hospedagem na frente dos containers para TLS e domínio público.

Ao fazer um deploy real, substitua `WEB_URL` e `CORS_ORIGINS` pelo domínio HTTPS
público. Consulte a [lógica de portas e isolamento dos ambientes](docs/environments.md).

## Comandos principais

| Comando                         | Finalidade                                      |
| ------------------------------- | ----------------------------------------------- |
| `pnpm dev`                      | Executa todos os apps que têm script `dev`      |
| `pnpm dev:web` / `pnpm dev:api` | Executa apenas um app                           |
| `pnpm check`                    | Gera Prisma Client, roda lint, tipos e testes   |
| `pnpm build:staging`            | Build local com variáveis de homologação        |
| `pnpm build:production`         | Build local com variáveis de produção           |
| `pnpm db:migrate:development`   | Cria/aplica migrations durante desenvolvimento  |
| `pnpm db:migrate:staging`       | Aplica migrations já versionadas em homologação |
| `pnpm db:migrate:production`    | Aplica migrations já versionadas em produção    |
| `pnpm db:studio`                | Abre o Prisma Studio no ambiente local          |
| `pnpm format`                   | Formata arquivos suportados                     |

## Regras para manter a base reutilizável

- Não coloque regra de negócio em `packages/config`, `contracts` ou `utils`.
- Uma aplicação não deve importar arquivos internos de outra aplicação.
- Compartilhe contratos estáveis por pacotes, usando dependências `workspace:*`.
- Crie migrations somente em desenvolvimento; staging e produção usam `migrate deploy`.
- Não versione `.env.development`, `.env.staging` ou `.env.production`.
- Trate imagens Docker como artefatos imutáveis e use `IMAGE_TAG` por versão/commit.

Mais detalhes estão em [arquitetura](docs/architecture.md),
[contratos compartilhados](docs/contracts/README.md) e
[ambientes](docs/environments.md). Consulte também o
[índice completo da documentação](docs/README.md).
