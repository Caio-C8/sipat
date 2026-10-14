# Services

## Responsabilidade

O service implementa casos de uso, regras de negócio e a orquestração do
domínio. É nele que ficam validações que dependem do banco, de permissões, do
estado atual do sistema ou de outros domínios.

Um service pode:

- chamar vários métodos do próprio repository;
- chamar services exportados por outros módulos;
- verificar existência, unicidade, transições e permissões;
- lançar exceções de aplicação conforme a política de erros do projeto;
- coordenar operações que precisem ser atômicas, depois que a estratégia de
  transações estiver definida;
- compor um resultado de aplicação, como itens e metadados de paginação.

## Dependências

A classe recebe por injeção:

- o repository do próprio domínio;
- services de outros domínios, apenas quando o caso de uso precisar deles.

```ts
@Injectable()
export class RecursoService {
  constructor(
    private readonly recursoRepository: RecursoRepository,
    private readonly categoriaService: CategoriaService,
  ) {}
}
```

Não injete o repository de outro domínio. Isso contornaria as regras públicas
daquele domínio.

## Parâmetros

Escolha parâmetros que permitam ao controller apenas repassar o que recebeu:

- identificadores no tipo adotado pelo banco;
- outputs validados dos schemas de `@repo/contracts`;
- tipos locais específicos do caso de uso;
- `Express.Multer.File` ou equivalente quando a rota realmente tratar upload.

Os valores devem chegar semanticamente brutos para o caso de uso. O controller
não deve montar objetos complexos, consultar banco ou aplicar regras antes da
chamada. Ao mesmo tempo, dados externos já devem ter passado pela validação do
boundary.

## Retorno

Na maioria dos casos, retorne:

- um model gerado pelo Prisma;
- um payload Prisma definido em `types`;
- um resultado de aplicação explicitamente tipado.

Exemplo de resultado paginado:

```ts
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
```

O service não deve produzir a representação HTTP final. O controller passa os
models ou payloads pelo mapper correspondente.

## Orquestração versus transformação mecânica

O tamanho da classe, isoladamente, não determina se uma função deve sair do
service. Preserve no service o que expressa o caso de uso:

- ordem e composição das operações;
- decisões dependentes de estado, permissão ou banco;
- significado de ausência, conflito e demais falhas do domínio;
- cálculo e composição do resultado do caso de uso.

Conversões puras entre representações podem ficar em um mapper direcional do
próprio domínio. Por exemplo, um `RecursoPersistenceMapper` pode converter
`CreateRecursoData` e `UpdateRecursoData` em inputs Prisma, ou transformar uma
query validada em `Prisma.RecursoWhereInput`. Esse mapper não consulta o banco,
não injeta dependências, não lança exceptions e não decide o fluxo do caso de
uso.

Não extraia cada função privada somente para reduzir a quantidade de linhas. A
extração deve produzir uma responsabilidade nomeável e testável, sem esconder a
regra que o service precisa orquestrar.

## Limites

Não acesse diretamente `Request`, `Response` ou decorators HTTP no service.
Quando dois services dependerem um do outro, reavalie a divisão do caso de uso
antes de introduzir uma dependência circular. Um módulo de orquestração pode ser
mais claro do que `forwardRef()`.

Quando a autorização depender do recurso carregado, ownership, tenant ou estado,
o service deve aplicá-la diretamente ou delegar a um policy service. Não confie
somente em uma permissão genérica verificada no controller ou Guard. Veja
[Autorização](./security/authorization.md).
