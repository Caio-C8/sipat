# Ambientes

## Convenções

- `NODE_ENV` controla otimizações dos frameworks e deve ser `development`, `test` ou `production`.
- `APP_ENV` identifica o ambiente de negócio e pode ser `development`, `staging`, `production` ou `test`.
- Homologação usa `NODE_ENV=production` e `APP_ENV=staging`.
- Variáveis `NEXT_PUBLIC_*` são incorporadas ao bundle do navegador e nunca podem conter segredos.

## Arquivos locais

| Ambiente        | Template versionado        | Arquivo ignorado   |
| --------------- | -------------------------- | ------------------ |
| Desenvolvimento | `.env.development.example` | `.env.development` |
| Homologação     | `.env.staging.example`     | `.env.staging`     |
| Produção        | `.env.production.example`  | `.env.production`  |

Os templates são documentação e devem usar valores fictícios seguros. Os arquivos sem `.example` nunca devem ser commitados.

## Portas

`WEB_PORT` e `API_PORT` são portas internas dos processos. `WEB_PUBLISHED_PORT`, `API_PUBLISHED_PORT` e `DATABASE_PUBLISHED_PORT` são portas publicadas pelo Docker no host. Manter essa distinção evita quebrar comunicação interna quando uma porta externa muda.

Para executar os três ambientes localmente ao mesmo tempo, use portas internas
iguais e portas publicadas diferentes:

| Ambiente        | Web no host | API no host | Web no container | API no container |
| --------------- | ----------- | ----------- | ---------------- | ---------------- |
| Desenvolvimento | `3000`      | `3001`      | `3000`           | `3001`           |
| Homologação     | `3100`      | `3101`      | `3000`           | `3001`           |
| Produção        | `3200`      | `3201`      | `3000`           | `3001`           |

Em staging e produção, `API_INTERNAL_URL=http://api:3001`: `api` é o nome DNS
do serviço dentro da rede do Compose. Já `WEB_URL` e `CORS_ORIGINS` usam a URL
vista pelo navegador no host, como `http://localhost:3100`. O
`COMPOSE_PROJECT_NAME` precisa ser único por ambiente; assim, redes, containers
e o volume nomeado do PostgreSQL permanecem isolados mesmo com as mesmas portas
internas.

Para uso somente local, prefira `BIND_ADDRESS=127.0.0.1`. Em um deploy real,
substitua `WEB_URL` e `CORS_ORIGINS` pelo domínio HTTPS público e mantenha as
portas dos containers protegidas por proxy reverso, ingress ou pela plataforma.

## Segredos em deploy real

Em uma plataforma gerenciada, prefira o cofre de segredos da plataforma em vez de copiar arquivos `.env`. O Compose aceita as mesmas variáveis injetadas pelo processo de deploy.

Senhas usadas em `DATABASE_URL` precisam estar codificadas como URL quando contêm caracteres reservados. O valor de `POSTGRES_PASSWORD` continua sendo a senha original.
