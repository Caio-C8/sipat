# Manutenção da base e versionamento do exemplo

## Objetivo

Este repositório possui duas responsabilidades que não devem ser confundidas:

1. a branch `main` fornece uma base limpa para novos projetos;
2. tags `exemplo-produto-vX.Y.Z` preservam snapshots completos do exemplo
   didático de Produto e Avaliação.

Um projeto criado a partir da base não deve receber o domínio de exemplo. A
consulta ao exemplo ocorre no repositório de origem, escolhendo a tag desejada.

Uma tag é um snapshot imutável por convenção, não uma linha de desenvolvimento.
Para atualizar um exemplo já publicado, crie uma branch temporária a partir da
última tag e publique outra tag ao concluir.

## Estado atual da `main`

Depois da primeira separação, a `main` contém:

- workspaces pnpm, Turborepo, lint, TypeScript, testes, formatação e CI;
- versões fixadas de Node.js, pnpm e dependências de infraestrutura;
- Dockerfiles, Compose e configuração dos ambientes;
- PostgreSQL, etapa de migrations e geração do Prisma Client;
- fábrica do Prisma Client e `DatabaseModule`, prontos para conexão e
  encerramento no ciclo de vida dos módulos de domínio que usam persistência;
- configuração global da API, health check, filtro de erros, validação,
  serialização, CORS e correlation ID;
- contrato compartilhado do health check e primitives comprovadamente
  genéricas;
- rewrite `/api/backend/:path*` da Web para a API;
- clientes HTTP compartilhados de navegador e servidor, suas proteções e seus
  testes de infraestrutura;
- health check da Web, configurações, observabilidade e baseline visual que não
  dependam de Produto;
- documentação arquitetural genérica.

A `main` não contém models, migrations, contratos, módulos, rotas, páginas,
operações, testes, seeds, objetivos de roadmap nem documentação específicos de
Produto ou Avaliação.

## Primeira separação do exemplo

### 1. Preparar e validar o snapshot

Comece com a `main` no commit exato que representa o exemplo completo. Não crie
a tag com arquivos ainda não commitados.

```bash
git status --short --branch
pnpm check
pnpm format:check
```

Se o build e os testes E2E fizerem parte da entrega que será preservada, execute
também:

```bash
pnpm build
pnpm --filter @repo/web test:e2e
```

### 2. Criar e publicar a tag anotada

Para o primeiro snapshot:

```bash
git tag -a exemplo-produto-v1.0.0 -m "Exemplo completo de Produto e Avaliação"
git push origin exemplo-produto-v1.0.0
```

Confirme localmente o objeto e o commit apontado:

```bash
git show exemplo-produto-v1.0.0 --no-patch
```

Não mova nem reutilize uma tag já publicada. Uma correção posterior recebe uma
nova versão, por exemplo `exemplo-produto-v1.0.1`.

### 3. Limpar a `main` sem reescrever o histórico

Faça a remoção em commits normais depois de criar e publicar a tag. Não use
rebase destrutivo, force push ou reinicialização do repositório: o histórico
existente explica a evolução da base e a tag fornece um ponto de acesso estável
ao exemplo.

A limpeza deve revisar todas as camadas:

| Área         | Remover do exemplo                                                                 | Preservar na base                                                                                            |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Banco        | models, migrations e exports de tipos de Produto e Avaliação                       | datasource, generator, fábrica do client, `DatabaseClient`, configuração Prisma e seed vazio                 |
| Contratos    | schemas, fixtures, testes e exports do domínio                                     | health, erro, paginação e primitives genéricas já justificadas                                               |
| API          | `ProdutoModule` e seus controllers, DTOs, services, repositories, mappers e testes | bootstrap, ambiente, `DatabaseModule`, health, CORS, middleware, pipe, interceptor e filtro                  |
| Web          | rotas, feature, formulários, hooks, componentes e testes de Produto                | home neutra, health, rewrite, clientes HTTP, configuração, observabilidade e componentes realmente genéricos |
| Documentação | estado e roadmaps específicos do exemplo na `main` limpa                           | arquitetura, padrões, integrações e este guia                                                                |

Arquivos de barrel, imports, scripts e dependências precisam ser revisados junto
com as exclusões. Remova uma dependência somente depois de confirmar que nenhum
código genérico ainda a utiliza.

### 4. Manter a integração API e banco pronta

Na tag `exemplo-produto-v1.0.0`, `ProdutoModule` importa `DatabaseModule`. A
dependência está no sentido correto: o domínio depende da infraestrutura de
persistência; `DatabaseModule` não conhece nem depende de Produto.

Ao remover o exemplo, remova `ProdutoModule` de `AppModule`, mas não coloque
`DatabaseModule` em seu lugar. A base vazia preserva toda a configuração do
banco sem abrir uma conexão que ainda não possui consumidor. Isso mantém o
health check básico da API independente do PostgreSQL e deixa explícito quais
domínios realmente usam persistência.

Quando o primeiro domínio persistente for criado, seu próprio módulo importa
`DatabaseModule`:

```ts
@Module({
  imports: [DatabaseModule],
  controllers: [RecursoController],
  providers: [RecursoService, RecursoRepository],
})
export class RecursoModule {}
```

Depois, somente `RecursoModule` é registrado em `AppModule`:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    RecursoModule,
  ],
})
export class AppModule {}
```

Módulos são compartilhados e singleton por padrão no NestJS. Vários módulos de
domínio podem importar o mesmo `DatabaseModule` e reutilizar o provider que ele
exporta; não registre `createDatabaseClient()` novamente em cada domínio.

Não marque `DatabaseModule` como global somente para evitar imports. Imports
explícitos documentam a dependência, limitam o acesso ao client e simplificam
testes isolados. Importá-lo apenas em `AppModule` também não torna o provider
automaticamente visível aos módulos irmãos, pois providers são encapsulados no
módulo que os declara.

O endpoint `/api/health` atual é um liveness check e não executa query. Quando
um módulo de domínio importa `DatabaseModule`, a conexão inicial passa a ser
exercitada por `DatabaseModule.onModuleInit()`: se o banco não estiver
acessível, a inicialização da aplicação falha. Caso um projeto precise separar
liveness de readiness durante a operação, deve criar um endpoint de readiness
próprio e definir sua política antes de consultar o banco a cada requisição.

### 5. Manter Web e API conectadas

A limpeza deve preservar o rewrite do Next.js:

```text
/api/backend/:path* -> ${API_INTERNAL_URL}/api/:path*
```

Assim, estes caminhos continuam verificáveis sem depender de Produto:

```text
GET http://localhost:3000/api/health
GET http://localhost:3000/api/backend/health
GET http://localhost:3001/api/health
```

O primeiro verifica a Web, o segundo percorre Web → rewrite → API e o terceiro
acessa a API diretamente. Na base vazia esses checks não consultam o banco. A
conexão API → PostgreSQL passa a fazer parte da inicialização assim que um
módulo de domínio persistente importa `DatabaseModule`.

### 6. Tratar o banco local depois da limpeza

As migrations do exemplo devem desaparecer da `main` limpa, pois um projeto
derivado criará sua própria migration inicial. Um banco no qual essas migrations
já foram aplicadas não passa automaticamente a representar a nova base.

Use um banco de desenvolvimento novo ou recrie deliberadamente somente o volume
local descartável. Nunca apague volume ou histórico de migrations de staging ou
produção como parte desta limpeza. Antes de remover qualquer volume, confirme o
nome resolvido do projeto Compose e que ele não contém dados necessários.

### 7. Verificar a base limpa

Depois da remoção:

```bash
pnpm check
pnpm format:check
pnpm build
```

Valide também a configuração Compose de cada ambiente e execute o fluxo local.
Com `.env.development` preparado:

```bash
docker compose --env-file .env.development -f compose.yaml -f compose.development.yaml config
pnpm stack:development:up
```

No PowerShell, confirme os três health checks:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/backend/health
Invoke-RestMethod http://localhost:3001/api/health
```

A limpeza está concluída somente quando:

- não existe implementação do domínio de exemplo na árvore da `main`; menções
  restantes servem apenas para apontar suas tags e explicar este processo;
- Web, API e banco sobem na ordem definida pelo Compose;
- a Web alcança o health check da API pelo rewrite;
- `DatabaseModule` e a fábrica do Prisma Client permanecem disponíveis, sem
  import direto no `AppModule` vazio;
- lint, tipos, testes, formatação e build passam;
- a tag do exemplo permanece acessível no remoto.

## Criar projetos a partir da base

Marque o repositório como **Template repository** nas configurações do GitHub.
Ao iniciar um produto, use **Use this template → Create a new repository** e
deixe **Include all branches** desmarcado.

O GitHub cria um repositório independente com os arquivos da branch padrão e um
novo commit inicial. O histórico e as tags do repositório de origem não são
copiados. Isso é intencional: o novo produto recebe somente a base limpa e
consulta o exemplo no repositório original.

Não use fork para produtos derivados comuns. Fork é adequado quando o novo
repositório precisa permanecer ligado ao upstream para contribuir de volta. Se
um produto precisar receber futuras melhorias da base automaticamente, essa é
outra política de distribuição e deve ser definida antes de criar o projeto.

## Publicar uma nova versão do exemplo

Atualizações de Node.js, pnpm, frameworks e infraestrutura são feitas
normalmente na `main`, de preferência em commits pequenos e isolados. Para
adaptar o exemplo sem recolocá-lo na `main`:

1. crie uma branch temporária a partir da última tag;
2. aplique somente os commits de infraestrutura relevantes da `main`;
3. adapte o código do exemplo;
4. valide o exemplo completo;
5. publique uma nova tag anotada;
6. remova a branch temporária depois de confirmar a tag remota.

Exemplo para uma versão incompatível com a anterior:

```bash
git switch -c atualizar-exemplo-v2 exemplo-produto-v1.0.0
git cherry-pick COMMIT_ATUALIZACAO_NODE_PNPM
git cherry-pick COMMIT_ATUALIZACAO_FRAMEWORKS
pnpm check
pnpm format:check
pnpm build
pnpm --filter @repo/web test:e2e
git tag -a exemplo-produto-v2.0.0 -m "Exemplo atualizado para o novo baseline"
git push origin exemplo-produto-v2.0.0
git switch main
git branch -d atualizar-exemplo-v2
```

Use `cherry-pick` apenas para commits autocontidos. Se uma atualização da
`main` misturar manutenção de infraestrutura com a remoção do exemplo, separe-a
antes ou reaplique a mudança manualmente na branch temporária. Não faça merge
indiscriminado da `main` na branch do exemplo, pois o commit de limpeza foi
criado justamente para remover esse domínio.

Convenção sugerida:

- patch (`v1.0.1`): correção sem mudança relevante de ferramentas ou contrato;
- minor (`v1.1.0`): melhoria compatível no exemplo;
- major (`v2.0.0`): novo baseline de runtime, framework ou mudança incompatível.

Se também for necessário identificar releases da base limpa, use outro prefixo,
como `starter-v1.0.0`, evitando a ambiguidade de tags chamadas apenas `v1` ou
`v2`.

## Consultar ou recuperar conteúdo do exemplo

Inspecione a tag sem alterar a branch atual:

```bash
git show exemplo-produto-v1.0.0 --no-patch
git ls-tree -r --name-only exemplo-produto-v1.0.0
git show exemplo-produto-v1.0.0:caminho/do/arquivo
```

Para explorar ou executar o snapshot:

```bash
git switch --detach exemplo-produto-v1.0.0
```

Para recuperar um arquivo específico na branch atual:

```bash
git restore --source=exemplo-produto-v1.0.0 -- caminho/do/arquivo
```

Revise o arquivo restaurado antes de commitá-lo: o exemplo pode usar contratos,
dependências e decisões que não pertencem ao novo produto.

## Referências oficiais

- [GitHub: criar um repositório a partir de um template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
- [GitHub: criar um template repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [Git: tags anotadas](https://git-scm.com/book/en/v2/Git-Basics-Tagging.html)
- [NestJS: módulos compartilhados e globais](https://docs.nestjs.com/modules)
- [NestJS: liveness, readiness e health checks](https://docs.nestjs.com/reliability/terminus)
