# Testes dos contratos

## Estado atual

`@repo/contracts` usa o runner nativo do Node, executado por `tsx`, e agrupa os
testes TypeScript em diretórios `tests` dentro da respectiva feature. Os
comandos disponíveis são:

```bash
pnpm --filter @repo/contracts lint
pnpm --filter @repo/contracts typecheck
pnpm --filter @repo/contracts test
```

O script também deve continuar alcançável pelos comandos agregados da raiz.

## Organização dos arquivos

Prefira um arquivo `*.test.ts` por contrato ou por grupo pequeno de primitives
fortemente relacionadas. Mantenha fixtures e helpers de teste em arquivos que
não terminem em `*.test.ts`, para que o runner não os execute como suítes.

Exemplo:

```text
src/
  contract-assertions.ts
  public-api.test.ts
  common/
    paginacao-query.schema.ts
    resposta.schema.ts
    tests/
      paginacao-query.schema.test.ts
      resposta.schema.test.ts
```

Os testes unitários devem importar diretamente o módulo sob teste. Adicione um
teste pequeno pelo entrypoint público do package para detectar exports
esquecidos sem acoplar todas as suítes aos arquivos de barrel.

## Estratégia

Teste contratos como caixa-preta. O objetivo não é provar que o Zod funciona,
mas confirmar que o comportamento exposto é o contrato desejado.

Para cada caso, verifique:

- sucesso ou falha;
- output normalizado;
- path e código do erro quando relevantes;
- comportamento de propriedades inesperadas;
- diferença entre ausente, `undefined`, `null` e string vazia.

## Primitives e normalizers

Antes de reutilizar uma abstração em várias features, teste sua matriz de
comportamento.

### Texto obrigatório

| Input       | Resultado esperado |
| ----------- | ------------------ |
| `"abc"`     | `"abc"`            |
| `" abc "`   | `"abc"`            |
| `""`        | erro               |
| `"   "`     | erro               |
| `null`      | erro               |
| `undefined` | erro               |

### Boolean em query

| Input     | Resultado esperado |
| --------- | ------------------ |
| `"true"`  | `true`             |
| `"TRUE"`  | `true`             |
| `"1"`     | `true`             |
| `"false"` | `false`            |
| `"FALSE"` | `false`            |
| `"0"`     | `false`            |
| `"abc"`   | erro               |
| `true`    | erro               |
| `1`       | erro               |

### Inteiro em query

| Input    | Resultado esperado                                |
| -------- | ------------------------------------------------- |
| `"1"`    | `1`                                               |
| `"01"`   | decisão explícita do contrato                     |
| `"1.5"`  | erro                                              |
| `"1e2"`  | erro                                              |
| `"0x10"` | erro                                              |
| `""`     | erro, salvo quando houver um normalizer explícito |
| `true`   | erro                                              |
| `null`   | erro                                              |

Além dos limites da operação, teste inteiros maiores que o intervalo seguro do
JavaScript quando o output do contrato for `number`.

### String vazia opcional

| Input       | Resultado esperado            |
| ----------- | ----------------------------- |
| `undefined` | `undefined`                   |
| `""`        | `undefined`                   |
| `"   "`     | `undefined`                   |
| `"teste"`   | `"teste"`                     |
| `null`      | decisão explícita do contrato |

## Contratos de feature

Para um schema de criação, cubra no mínimo:

- payload mínimo válido;
- payload completo válido;
- campo obrigatório ausente;
- string vazia e somente espaços;
- tipo incorreto;
- enum inválido;
- boolean inválido;
- data inválida;
- item aninhado inválido;
- propriedade inesperada;
- defaults;
- `null` onde não é permitido.

Para update/PATCH, acrescente:

- objeto vazio, se permitido;
- campo ausente sem aplicação de default;
- limpeza explícita com `null`, se suportada;
- regras diferentes da criação.

Para responses, teste a representação serializada, principalmente datas e
campos internos que não podem vazar.

## Integrações

Além dos schemas isolados, teste:

- Pipe NestJS retornando output transformado;
- resposta HTTP 400 no formato padronizado;
- mapeamento de paths aninhados;
- formulário ou Server Action usando o contrato correto;
- backend rejeitando payload que tenha passado apenas pela validação do cliente.

## Tipos

O `typecheck` deve confirmar os tipos inferidos de input e output. Quando uma
transformação muda o tipo, inclua uma asserção de tipos ou fixture de compilação
que impeça a regressão.
