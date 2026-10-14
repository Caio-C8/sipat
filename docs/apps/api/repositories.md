# Repositories

## Responsabilidade

O repository é a camada mínima de acesso ao banco. Ele traduz uma operação de
persistência para uma chamada Prisma e retorna o resultado sem transformá-lo em
resposta HTTP.

Um repository pode usar recursos nativos da consulta, como:

- `where`, `select` e `include`;
- `orderBy`;
- `skip`, `take` e cursores;
- `count`, agregações e transações, quando o padrão transacional do projeto já
  estiver definido.

Não deve:

- implementar regra de negócio;
- validar permissão ou estado do domínio;
- formatar strings, datas ou respostas;
- lançar exceções HTTP ou de domínio por um registro não encontrado;
- chamar mappers;
- acessar repositories pertencentes a outros domínios.

## Tipos de entrada e retorno

Use tipos gerados pelo Prisma quando eles expressarem corretamente a operação:

```ts
import type { Prisma, Recurso } from "@repo/database";

create(data: Prisma.RecursoCreateInput): Promise<Recurso>;

findUnique(
  where: Prisma.RecursoWhereUniqueInput,
): Promise<Recurso | null>;

count(args: Prisma.RecursoCountArgs): Promise<number>;
```

Para consultas que carregam relações, retorne o payload nomeado no diretório
`types` e reutilize os mesmos argumentos Prisma que originaram o tipo:

```ts
async findCompleteById(id: string): Promise<RecursoCompleto | null> {
  return this.prisma.recurso.findUnique({
    where: { id },
    ...recursoCompletoArgs,
  });
}
```

Tenha cuidado com argumentos amplos como `Prisma.RecursoFindManyArgs`: `select`
e `include` alteram o formato do resultado. Quando o método aceita essas opções,
preserve essa relação no tipo genérico ou restrinja os argumentos à consulta que
o método realmente suporta.

## Injeção do client

O Prisma Client deve ser criado uma vez pelo módulo de infraestrutura e
injetado nos repositories. Não execute `new PrismaClient()` dentro de cada
repository.

Exemplo conceitual:

```ts
@Injectable()
export class RecursoRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly prisma: DatabaseClient,
  ) {}
}
```

O token `DATABASE_CLIENT`, o provider e o ciclo de vida do client já são
definidos pelo `DatabaseModule` da API. O módulo de domínio importa esse módulo
e o repository injeta o mesmo token; não instancia outro Prisma Client.

## Granularidade dos métodos

Prefira métodos que expressem uma operação de persistência clara, por exemplo:

```text
create
findById
findCompleteById
findMany
count
update
delete
```

Não esconda um fluxo de negócio com várias decisões dentro de um único método
de repository. A composição de múltiplas operações pertence ao service.

## Performance

- selecione somente campos e relações exigidos pelo consumidor;
- evite N+1 e observe a quantidade de queries por operação;
- não ofereça listagem sem paginação e limite finito;
- mantenha ordenação determinística para paginação;
- proponha índice a partir de query real e confirme seu plano no banco;
- não aumente pool ou aplique cache dentro do repository para esconder query
  lenta.

Consulte [Performance do banco](../../performance/database.md).
