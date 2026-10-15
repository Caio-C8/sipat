# Módulos NestJS

## Composição do domínio

O arquivo `<dominio>.module.ts` registra os componentes daquele domínio:

```ts
@Module({
  imports: [CategoriaModule],
  controllers: [RecursoController],
  providers: [RecursoService, RecursoRepository],
  exports: [RecursoService],
})
export class RecursoModule {}
```

- `controllers`: todos os controllers pertencentes ao domínio;
- `providers`: o service e o repository do domínio, além de providers privados
  realmente necessários;
- `exports`: somente os services que outros módulos podem consumir;
- `imports`: módulos cujos services exportados serão usados.

Não exporte repositories. Não registre o mesmo service em vários módulos para
obter outra instância.

## Banco de dados

O módulo deve importar `DatabaseModule`, que disponibiliza o client Prisma
compartilhado por token de injeção. Esse módulo não é global; cada módulo de
domínio que usa banco declara o import explicitamente.

A direção da dependência é `ModuloDeDominio -> DatabaseModule`. O módulo de
banco não depende do domínio; ele apenas é alcançado e inicializado quando há
um consumidor no grafo da aplicação. Módulos são singleton por padrão no
NestJS, portanto vários módulos podem importar `DatabaseModule` e compartilhar
o mesmo provider exportado.

No estado atual do SIPAT, não importe `DatabaseModule` diretamente em
`AppModule` apenas para manter uma conexão ociosa. Essa importação não
disponibiliza o provider aos módulos irmãos e faria o processo depender do
PostgreSQL antes de existir um domínio persistente. Também não torne o módulo
global somente para eliminar
imports: a declaração explícita mantém dependências e testes compreensíveis.

Ao criar o primeiro domínio que use persistência:

1. importe `DatabaseModule` no módulo do domínio;
2. injete `DATABASE_CLIENT` somente nos repositories que precisam dele;
3. registre o módulo do domínio em `AppModule`;
4. valide a inicialização e o encerramento da conexão no fluxo integrado.

O health check básico não precisa consultar o banco. Se a operação exigir uma
distinção entre liveness e readiness, crie checks separados e defina quais
dependências tornam a instância pronta para receber tráfego.

## Dependências entre domínios

Para usar dados ou comportamento de outro domínio:

1. exporte o service no módulo proprietário;
2. importe esse módulo no módulo consumidor;
3. injete o service, não o repository, no consumidor.

Se surgir um ciclo, primeiro considere extrair a orquestração ou revisar os
limites. Use `forwardRef()` apenas quando o ciclo for realmente inevitável e
documente o motivo.

## Registro na aplicação

Ao terminar um módulo de domínio do SIPAT, adicione-o a `AppModule`:

```ts
@Module({
  imports: [RecursoModule],
})
export class AppModule {}
```

Depois, inicialize a aplicação ou compile o módulo para detectar providers não
resolvidos e imports ausentes.

## Componentes transversais

Guards, Interceptors, Filters e Pipes compartilhados podem ser registrados por
tokens como `APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER` e `APP_PIPE`. Esse
registro mantém injeção de dependência e aplica o componente globalmente.

Antes de registrar:

1. confirme que a política é realmente global;
2. documente exceções e precedência;
3. verifique a ordem no ciclo da requisição;
4. cubra a composição com teste E2E.

Strategies e componentes de autenticação devem ser providers do módulo de
autenticação quando essa solução existir. Consulte
[Ciclo da requisição](./request-lifecycle/README.md) e
[Baseline de segurança](./security/baseline.md).
