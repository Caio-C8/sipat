# Clientes e operações HTTP

## Estado e expansão prevista

Hoje `src/lib/api-health.ts` contém somente a operação técnica do health check.
Quando o primeiro endpoint de domínio existir, a estrutura pode evoluir para:

```text
apps/mobile/src/
├── lib/api/
│   ├── core/
│   │   ├── api-error.ts
│   │   ├── create-api-client.ts
│   │   └── types.ts
│   └── mobile-api-client.ts
└── features/<dominio>/api/
    ├── get-recursos.ts
    ├── create-recurso.ts
    └── use-*.ts
```

Crie somente as peças exigidas pela entrega. Não copie toda a infraestrutura da
Web sem adaptar autenticação, lifecycle e conectividade.

## Configuração da base URL

`public-app-config.ts`:

- remove espaços e barras finais;
- valida `EXPO_PUBLIC_APP_ENV`;
- compõe `/api/health` uma única vez;
- usa o host do Metro apenas em development e quando a URL está ausente;
- valida `EXPO_PUBLIC_API_PORT` como porta TCP.

Staging, preview e produção falham como não configurados quando não há URL
explícita. Um build não deve escolher silenciosamente `localhost`.

## Cliente comum

Uma futura abstração deve concentrar somente comportamento transversal:

- composição de base URL, path e query;
- JSON e headers comuns não sensíveis;
- credencial fornecida no escopo da request;
- timeout, cancelamento e lifecycle;
- parsing e validação da response;
- normalização de erro;
- observabilidade permitida.

Ela não abre toast, navega, conhece controle de formulário, decide permissão ou
transforma falha em lista vazia.

## Operação por endpoint e método

```text
GET    /patrimonios       → getPatrimonios
GET    /patrimonios/:id   → getPatrimonio
POST   /patrimonios       → createPatrimonio
PATCH  /patrimonios/:id   → updatePatrimonio
```

Cada operação recebe parâmetros tipados, monta request, valida input quando
necessário, valida response, retorna output do contrato, propaga erro
normalizado e aceita `AbortSignal` quando aplicável.

## Contratos

- Body, query, params e response podem ter schemas diferentes.
- Use `z.input` antes e `z.output` depois de transformação.
- Não faça cast de JSON para esconder incompatibilidade.
- Formulário pode ter schema local e mapper.
- Erro público não é a exception interna da API.
- Resposta `204` não deve ser analisada como JSON.

## Query, arquivos e concorrência

Use `URLSearchParams` ou composição equivalente e preserve a diferença entre
ausente, `undefined`, `null` e string vazia. Para `FormData`, não defina o
boundary de `Content-Type` manualmente.

Limite uploads, paginação, requests paralelas e trabalho controlado pelo
usuário. Cancele busca obsoleta. Não use `Promise.all` sobre coleção de tamanho
indefinido.

## Hooks e estado remoto

Quando uma biblioteca for adotada, um hook representa método + endpoint +
intenção, por exemplo `usePatrimonios` e `useCreatePatrimonio`. O hook conhece
pending, cache, cancelamento e invalidação; a operação conhece HTTP e contratos.
Toast e navegação pertencem ao fluxo consumidor.

Não implemente cache/deduplicação complexos com vários `useEffect` apenas para
evitar escolher uma biblioteca quando o requisito realmente exigir essas
capacidades.

## Operações de autenticação implementadas

`MOBILE-AUTH-001` definiu contratos públicos específicos para o transporte
nativo, mantendo os endpoints Web existentes sem alteração silenciosa:

| Operação                 | Método e endpoint                            | Credencial     |
| ------------------------ | -------------------------------------------- | -------------- |
| Login nativo             | `POST /auth/mobile/login`                    | nenhuma        |
| Renovar sessão           | `POST /auth/mobile/refresh`                  | refresh Bearer |
| Consultar identidade     | `GET /auth/mobile/me`                        | access Bearer  |
| Concluir primeiro acesso | `POST /auth/mobile/concluir-primeiro-acesso` | access Bearer  |
| Logout nativo            | `POST /auth/mobile/logout`                   | refresh Bearer |

Login devolve identidade segura, access token, refresh token e expirações
necessárias ao cliente. Refresh rotaciona obrigatoriamente as duas credenciais.
Conclusão do primeiro acesso troca a senha, revoga a família restrita e devolve
um novo par comum. Logout é idempotente quanto ao resultado público e revoga a
família identificada.

O cliente comum injeta access token apenas no escopo da request. A operação de
refresh é coordenada em uma única promessa para impedir renovações concorrentes;
uma request pode ser repetida no máximo uma vez depois de `401` e somente quando
for segura para repetição. Mutation de domínio não recebe retry automático.

Responses com tokens usam `Cache-Control: no-store`; headers e bodies sensíveis
ficam fora da observabilidade. Os paths acima são os contratos implementados;
consumidores devem validar responses com os schemas de `@repo/contracts`.
