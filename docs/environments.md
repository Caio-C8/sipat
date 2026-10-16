# Ambientes

## Convenções

- `NODE_ENV` controla otimizações dos frameworks e deve ser `development`, `test` ou `production`.
- `APP_ENV` identifica o ambiente de negócio e pode ser `development`, `staging`, `production` ou `test`.
- Homologação usa `NODE_ENV=production` e `APP_ENV=staging`.
- Variáveis `NEXT_PUBLIC_*` são incorporadas ao bundle do navegador e nunca podem conter segredos.
- Variáveis `EXPO_PUBLIC_*` são incorporadas aos bundles Web e nativos e também
  nunca podem conter segredos.

## Arquivos locais

| Ambiente        | Exemplo versionado         | Arquivo ignorado   |
| --------------- | -------------------------- | ------------------ |
| Desenvolvimento | `.env.development.example` | `.env.development` |
| Homologação     | `.env.staging.example`     | `.env.staging`     |
| Produção        | `.env.production.example`  | `.env.production`  |

Os arquivos de exemplo são documentação e devem usar valores fictícios seguros.
Os arquivos sem `.example` nunca devem ser commitados. A identidade usa `sipat`
nos valores técnicos e `SIPAT` no nome público exibido pela Web e pelo mobile.

Builds remotos do mobile não recebem automaticamente os arquivos `.env` locais.
Os perfis de `apps/mobile/eas.json` selecionam os ambientes EAS `development`,
`preview` e `production`. Configure neles os valores públicos correspondentes e
use uma URL HTTPS da API alcançável pelo dispositivo. Consulte
[Execução, builds e distribuição mobile](./apps/mobile/builds-and-distribution.md).

## Portas

`WEB_PORT` e `API_PORT` são portas internas dos processos.
`WEB_PUBLISHED_PORT`, `API_PUBLISHED_PORT`, `MOBILE_WEB_PUBLISHED_PORT` e
`DATABASE_PUBLISHED_PORT` são portas publicadas pelo Docker no host. O servidor
estático do mobile-web usa a porta interna fixa `8080`. Manter essa distinção
evita quebrar comunicação interna quando uma porta externa muda.

Para executar os três ambientes localmente ao mesmo tempo, use portas internas
iguais e portas publicadas diferentes:

| Ambiente        | Web no host | API no host | Mobile-web no host | Web no container | API no container | Mobile-web no container |
| --------------- | ----------- | ----------- | ------------------ | ---------------- | ---------------- | ----------------------- |
| Desenvolvimento | `3000`      | `3001`      | Metro em `8081`    | `3000`           | `3001`           | não iniciado pelo stack |
| Homologação     | `3100`      | `3101`      | `3181`             | `3000`           | `3001`           | `8080`                  |
| Produção        | `3200`      | `3201`      | `3281`             | `3000`           | `3001`           | `8080`                  |

Em staging e produção, `API_INTERNAL_URL=http://api:3001`: `api` é o nome DNS
do serviço dentro da rede do Compose. Já `WEB_URL`, `MOBILE_WEB_URL` e
`CORS_ORIGINS` usam URLs vistas pelo navegador no host, como
`http://localhost:3100` e `http://localhost:3181`. O
`COMPOSE_PROJECT_NAME` precisa ser único por ambiente; assim, redes, containers
e o volume nomeado do PostgreSQL permanecem isolados mesmo com as mesmas portas
internas.

O mobile-web é um export estático. `EXPO_PUBLIC_API_URL` é resolvida no build e
deve apontar para uma origem que o navegador consiga alcançar; o nome interno
`api` não serve para código executado no navegador. Os exemplos usam a porta
publicada local (`localhost:3101` ou `localhost:3201`). Em deploy real, use a
URL HTTPS pública e reconstrua a imagem após qualquer mudança desse valor.

O serviço `mobile-web` pertence ao profile homônimo do Compose. Os scripts
`stack:staging:*` e `stack:production:*` já habilitam esse profile; o stack de
desenvolvimento não o habilita porque usa o Metro para hot reload.

Para uso somente local, prefira `BIND_ADDRESS=127.0.0.1`. Em um deploy real,
substitua `WEB_URL`, `MOBILE_WEB_URL`, `EXPO_PUBLIC_API_URL` e `CORS_ORIGINS`
pelos domínios HTTPS públicos e mantenha as portas dos containers protegidas
por proxy reverso, ingress ou pela plataforma.

## Segredos em deploy real

Em uma plataforma gerenciada, prefira o cofre de segredos da plataforma em vez de copiar arquivos `.env`. O Compose aceita as mesmas variáveis injetadas pelo processo de deploy.

Senhas usadas em `DATABASE_URL` precisam estar codificadas como URL quando contêm caracteres reservados. O valor de `POSTGRES_PASSWORD` continua sendo a senha original.
