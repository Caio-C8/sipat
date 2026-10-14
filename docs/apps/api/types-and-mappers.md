# Tipos Prisma e mappers

## Tipos locais do domínio

O diretório `types` descreve tipos internos da API relacionados ao modelo do
domínio. Seu uso principal é nomear payloads Prisma com relações, `select` ou
`include` específicos.

Não use esse diretório para duplicar tipos de request ou response de
`@repo/contracts`.

## Manter query e payload alinhados

Defina a seleção Prisma uma vez e derive o tipo dela:

```ts
import { Prisma } from "@repo/database";

export const recursoCompletoArgs = {
  include: {
    categoria: true,
    itens: true,
  },
} satisfies Prisma.RecursoDefaultArgs;

export type RecursoCompleto = Prisma.RecursoGetPayload<
  typeof recursoCompletoArgs
>;
```

O repository deve reutilizar `recursoCompletoArgs`. Isso evita que o tipo diga
que uma relação existe enquanto a query deixa de carregá-la.

O namespace `Prisma` e o `PrismaClient` são exportados por `@repo/database`.
Quando models reais forem adicionados, exporte somente os tipos que os
consumidores realmente precisarem. A API não importa diretamente de
`@prisma/client`.

## Responsabilidade do mapper

Um mapper converte um model ou payload Prisma para um tipo de resposta definido
em `@repo/contracts`. Ele deve ser puro: não consulta o banco, não injeta
dependências, não aplica regra de negócio e não lança exceções de domínio.

Também é permitido criar um mapper direcional de persistência quando o caso de
uso precisar converter outputs validados dos contratos em inputs Prisma. Use um
nome que revele a direção, como `RecursoPersistenceMapper`, e não misture essa
responsabilidade com o `RecursoResponseMapper`.

Uma função auxiliar usada somente por esse mapper, como a conversão de uma data
de calendário `YYYY-MM-DD` para o `Date` esperado pela persistência, permanece
privada no mesmo arquivo. Ela não se torna um utilitário compartilhado apenas
por ser uma função pura.

Padrão inicial:

```ts
import type { RecursoCompletoResponse, RecursoResponse } from "@repo/contracts";
import type { Recurso } from "@repo/database";
import type { RecursoCompleto } from "../types/recurso.types";
import { CategoriaResponseMapper } from "../../categoria/mappers/categoria-response.mapper";
import { ItemResponseMapper } from "../../item/mappers/item-response.mapper";

export class RecursoResponseMapper {
  static toHttp(recurso: Recurso): RecursoResponse {
    return {
      id: recurso.id,
      nome: recurso.nome,
      categoriaId: recurso.categoriaId,
      criadoEm: recurso.criadoEm.toISOString(),
    };
  }

  static toHttpCompleto(recurso: RecursoCompleto): RecursoCompletoResponse {
    return {
      id: recurso.id,
      nome: recurso.nome,
      criadoEm: recurso.criadoEm.toISOString(),
      categoria: CategoriaResponseMapper.toHttp(recurso.categoria),
      itens: recurso.itens.map(ItemResponseMapper.toHttp),
    };
  }
}
```

Os nomes e campos são ilustrativos. O contrato real determina exatamente o que
deve sair na resposta.

## Resposta resumida e completa

- `toHttp` produz a representação básica do recurso;
- relações que não fazem parte do contrato básico não são incluídas;
- quando o contrato básico referencia outra entidade, prefira o identificador
  ou o campo explicitamente previsto pelo contrato;
- `toHttpCompleto` recebe um payload que realmente carregou as relações e usa os
  mappers dos respectivos domínios;
- métodos adicionais são permitidos quando representam outra resposta concreta,
  e não apenas uma variação hipotética.

Datas, `Decimal`, `BigInt`, enums e outros valores que não atravessam JSON da
mesma forma que existem no Prisma devem ser convertidos conforme o schema de
response. Não faça conversões implícitas fora do mapper.

## Organização

Mantenha nomes consistentes:

```text
types/recurso.types.ts
mappers/recurso-response.mapper.ts
```

Exporte pelo `index.ts` apenas os tipos e mappers que precisam ser usados fora
do próprio arquivo.
