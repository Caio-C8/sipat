# Hooks de API para Client Components

## Regra

Cada operação HTTP executada por Client Components deve possuir um hook
específico quando precisar integrar estado remoto ao ciclo do React.

“Um hook por rota” significa, com maior precisão:

```text
um hook por método + endpoint + intenção
```

Exemplos:

| Operação               | Hook               |
| ---------------------- | ------------------ |
| `GET /recursos`        | `useRecursos`      |
| `GET /recursos/:id`    | `useRecurso`       |
| `POST /recursos`       | `useCreateRecurso` |
| `PATCH /recursos/:id`  | `useUpdateRecurso` |
| `DELETE /recursos/:id` | `useDeleteRecurso` |

Não crie um `useApi(url, method)` genérico para as páginas. O nome do hook
deve comunicar a operação do domínio.

## Limite do React

Hooks:

- são chamados somente no topo de componentes React ou outros hooks;
- não são chamados condicionalmente;
- existem somente em Client Components;
- começam com `use`;
- encapsulam estado remoto e integração com React, não toda a operação HTTP.

Server Components não usam esses hooks. Eles chamam funções assíncronas de
operação e podem entregar dados ou promises a componentes clientes.

## Separação entre operação e hook

```text
useCreateRecurso
        ↓
createRecurso
        ↓
browserApiClient
```

A função `createRecurso` conhece HTTP e contratos. O hook conhece:

- loading ou pending;
- data e error;
- cancelamento;
- cache e chave;
- invalidação após mutação;
- callbacks permitidos pela biblioteca escolhida.

O hook não deve:

- criar cliente HTTP;
- duplicar URL;
- redefinir schema;
- abrir toast internamente como comportamento inevitável;
- navegar;
- converter qualquer erro em mensagem genérica;
- esconder falha como sucesso vazio.

Toast e navegação pertencem ao fluxo consumidor, exceto quando uma política
transversal explícita definir outro comportamento.

## Queries

Um hook de leitura deve receber parâmetros semanticamente relevantes:

```ts
useRecursos({ page, search, active });
```

Ele deve:

- construir chave de cache estável;
- incluir todo parâmetro que altera o resultado;
- permitir desabilitar execução quando faltarem pré-condições;
- não fazer polling sem necessidade;
- expor estados suficientes para a página;
- cancelar ou ignorar resposta obsoleta quando aplicável.

Não coloque objeto instável ou não serializável na chave de cache sem
normalização.

## Mutations

Hooks de mutação devem ser separados por intenção:

```text
useCreateRecurso
useUpdateRecurso
useDeleteRecurso
```

Eles devem:

- receber o input da operação;
- retornar output tipado;
- expor pending, erro e reset quando a biblioteca oferecer;
- invalidar ou atualizar somente chaves relacionadas;
- evitar retry automático de operação não idempotente;
- permitir que a tela escolha feedback e navegação.

Não use um único `useSaveRecurso` se create e update tiverem contratos,
permissões ou efeitos distintos.

## Biblioteca de estado remoto

A base limpa não escolhe uma biblioteca de estado remoto sem um domínio
consumidor. Quando a primeira feature interativa exigir cache, deduplicação,
retry e invalidação, compare as alternativas com os requisitos reais e
documente:

- query keys;
- política de retry;
- stale time;
- invalidação;
- hydration;
- tratamento de erro;
- ferramentas de desenvolvimento.

Não reimplemente essas capacidades com vários `useEffect` e `useState`, nem
instale uma biblioteca apenas para uniformidade.

## Nomes e arquivos

```text
features/recurso/api/get-recursos.ts
features/recurso/api/use-recursos.ts
features/recurso/api/create-recurso.ts
features/recurso/api/use-create-recurso.ts
```

Use nomes de domínio, não nomes técnicos vagos como `useRequest1`.

## Formulários

O formulário valida e transforma seu estado antes de chamar a mutation:

```text
estado do formulário
        ↓
validação local
        ↓
output ou mapper
        ↓
useCreateRecurso
        ↓
createRecurso
```

Não faça o hook conhecer controles, `FormData` visual ou mensagens de campo
além do contrato necessário à operação.

## Testes

Teste:

- parâmetros encaminhados;
- estados inicial, pending, sucesso e erro;
- operação desabilitada;
- cancelamento;
- query key;
- invalidação;
- mutation sem retry indevido;
- propagação do `ApiError`;
- ausência de chamada duplicada inesperada.
