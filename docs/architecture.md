# Arquitetura da base

## Limites

`apps` contém unidades executáveis e implantáveis. `packages` contém código compartilhado que não sobe sozinho. Essa separação permite acrescentar mais sites, painéis administrativos, workers, CLIs ou aplicativos móveis sem misturar seus ciclos de deploy.

Uma aplicação pode depender de um pacote. Uma aplicação não deve importar diretamente outra aplicação. Se dois apps precisam do mesmo contrato ou função, mova apenas essa parte para um pacote pequeno e explícito.

## Pacotes atuais

- `@repo/config`: configurações compartilhadas de ESLint e TypeScript;
- `@repo/database`: schema, migrations e fábrica do Prisma Client;
- `@repo/contracts`: contratos que atravessam processos ou camadas;
- `@repo/utils`: funções puras e independentes de plataforma.

Não existe um pacote `ui` inicialmente porque componentes React para web e componentes React Native não são intercambiáveis. Crie `packages/ui-web` ou `packages/ui-native` apenas quando houver reutilização real.

## Banco de dados

O schema começa sem modelos. Adicione somente entidades do novo domínio. A
aplicação da API também começa desacoplada do banco para que o health check
continue útil durante falhas de infraestrutura.

Em aplicações NestJS, o módulo de persistência instancia
`createDatabaseClient()` e encerra a conexão no shutdown. Cada módulo de domínio
que usa persistência importa esse módulo explicitamente; a base vazia não o
importa em `AppModule` apenas para manter uma conexão ociosa. Evite um singleton
global escondido em importações, pois isso atrapalha testes, scripts e builds.

## Deploy

`compose.yaml` define a topologia comum. Os arquivos `compose.<ambiente>.yaml` contêm apenas diferenças operacionais. TLS e roteamento público ficam fora da aplicação; isso permite usar a mesma imagem com proxy reverso próprio, Kubernetes ou plataformas gerenciadas.

O serviço `migrate` termina antes de a API iniciar. Se uma migration falhar, a nova versão não sobe parcialmente.
