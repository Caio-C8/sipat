# Clientes e operações HTTP

## Estrutura atual e expansão prevista

```text
apps/web/
├── lib/
│   └── api/
│       ├── core/
│       │   ├── api-error.ts
│       │   ├── create-api-client.ts
│       │   └── types.ts
│       ├── browser-api-client.ts
│       └── server-api-client.ts
└── features/
    └── <dominio>/
        └── api/
            ├── get-recursos.ts
            ├── create-recurso.ts
            ├── recurso-query-keys.ts
            └── use-*.ts
```

Somente a infraestrutura HTTP comum está implementada. Os cinco endpoints e os
contratos de usuários existem no backend, mas crie operações e hooks Web apenas
quando houver consumidor concreto; não antecipe arquivos da entrega futura.

## Abstração comum

`createApiClient` concentra:

- composição segura de base URL e path;
- query params com ordem estável;
- serialização JSON;
- headers comuns não sensíveis;
- signal e timeout;
- parsing da response;
- normalização de resposta sem corpo;
- conversão de status não bem-sucedido em `ApiError`;
- validação opcional da response por schema;
- observabilidade permitida.

Toda resposta de sucesso com corpo exige `responseSchema`. `204 No Content` é
retornado como `undefined` e não aceita schema de response. Erros que seguem o
contrato público são validados com `RespostaErroSchema`.

## Instância do navegador

`browserApiClient` é a única instância importada por operações executadas no
cliente:

```text
base URL: /api/backend
segredos: proibidos
origem: mesma origem do Next.js
```

Não leia variável server-only nesse módulo. Defina `credentials`, cookie e o
envio do sinal público de CSRF em conjunto quando a autenticação Web e as
primeiras mutações forem introduzidas.

## Instância do servidor

`serverApiClient` é importado apenas por Server Components, Server Actions,
Route Handlers ou outro código server-only. Ele usa
`${API_INTERNAL_URL}/api`, não encaminha headers automaticamente e não mantém
credenciais em estado global mutável.

## Operação por endpoint e método

Exemplos de nomes:

```text
GET    /recursos       → getRecursos
GET    /recursos/:id   → getRecurso
POST   /recursos       → createRecurso
PATCH  /recursos/:id   → updateRecurso
DELETE /recursos/:id   → deleteRecurso
```

Uma operação deve:

- receber parâmetros tipados;
- montar path, query e body;
- escolher a instância correspondente ao runtime;
- validar input no boundary quando necessário;
- validar a response com o schema disponível;
- retornar o output do contrato;
- propagar `ApiError` normalizado;
- aceitar `AbortSignal` quando aplicável.

Ela não atualiza componente, abre toast, navega, armazena estado React ou
transforma falha em valor vazio.

## Contratos

- Body, query, params e response usam schemas próprios.
- Use `z.input` antes de transformações e `z.output` depois do parse.
- Não considere response confiável porque a API é interna.
- Formulário pode exigir schema local e mapper antes da operação.
- Erro HTTP usa o contrato público, não a exception interna da API.

## Query params

Use `URLSearchParams` ou abstração equivalente:

- omita somente valores cuja semântica seja ausência;
- preserve a diferença entre `null`, `undefined` e string vazia;
- arrays e datas seguem o contrato;
- não concatene input sem encoding;
- mantenha ordem estável quando cache ou assinatura dependerem da URL.

## Upload

Para `FormData`, não defina manualmente o boundary de `Content-Type`. Validação
no navegador melhora a UX, mas segurança, tamanho e tipo devem ser conferidos
novamente na API.

## Proibições

- `fetch` espalhado por componentes;
- nova instância de cliente por hook;
- base URL duplicada em features;
- segredo em `NEXT_PUBLIC_*`;
- cast de response sem validação quando houver schema;
- retry automático de mutação;
- captura silenciosa que transforma falha em coleção vazia.
