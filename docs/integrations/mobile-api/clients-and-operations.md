# Clientes e operações HTTP

## Estado e expansão prevista

O health check continua isolado em `src/lib/api-health.ts`. O cliente comum em
`src/lib/api/api-client.ts` atende autenticação e as primeiras leituras de
domínio, organizadas por feature:

```text
apps/mobile/src/
├── lib/api/
│   ├── api-client.ts
│   └── api-error.ts
└── features/home/
    ├── api/home-operations.ts
    └── use-home-dashboard.ts
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

O cliente comum concentra somente comportamento transversal:

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

A adoção de TanStack Query v5 foi aprovada em
[`MOBILE-QUERY-001/002/003`](../../apps/mobile/roadmap.md#cache-de-dados-com-tanstack-query).
As operações HTTP existentes permanecem inalteradas; as tarefas introduzem o
provider, factories de keys, hooks de query/mutation e invalidações em etapas.
Consulte a
[política central](./errors-cache-testing.md#política-aprovada-para-o-cache-em-memória)
em vez de definir tempos ou retries dentro de cada componente.

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

## Leituras da Home implementadas

| Operação            | Método e endpoint  | Perfis                                |
| ------------------- | ------------------ | ------------------------------------- |
| Contar setores      | `GET /setores`     | `ADMINISTRADOR`                       |
| Contar patrimônios  | `GET /patrimonios` | `ADMINISTRADOR`, `DIRETOR_PATRIMONIO` |
| Resumir inventários | `GET /inventarios` | `ADMINISTRADOR`, `DIRETOR_PATRIMONIO` |

As contagens usam `pagina=1&limite=1` e `meta.total`. Inventários reutilizam o
filtro público `status`; a conferência finalizada mais recente percorre
sequencialmente páginas de até 50 itens e compara `dataFim`, pois a listagem é
ordenada por criação. Cada bloco aceita `AbortSignal`, usa o retry seguro da
sessão para uma única recuperação de `401` e mantém `403`, timeout, rede e
contrato inválido como estados distintos na interface.

## Consulta de patrimônios implementada

`MOBILE-PATRIMONIOS-001` adicionou operações para `GET /patrimonios` e
`GET /patrimonios/:patrimonioId`. A listagem valida e serializa somente busca,
status, setor, espécie, natureza, tipo de numeração, página e limite aprovados;
o detalhe valida o UUID antes da rede. Ambas validam a response integral,
recebem access token somente no escopo da request, aceitam `AbortSignal` e usam
uma única recuperação segura de `401` coordenada pela sessão.

Os filtros carregam setores ativos e espécies pelas rotas gerais em páginas de
até 50 itens. Naturezas são deduplicadas da relação pública presente nas
espécies, evitando chamar uma rota que não pertence à matriz de leitura do
Diretor. Esse catálogo vive somente em memória durante a tela; não foi criado
cache persistente ou armazenamento offline; `MOBILE-QUERY-002` adicionou o
cache em memória de cinco minutos.

## Cadastro patrimonial implementado

`MOBILE-PATRIMONIOS-002` adicionou operações paginadas para setores ativos,
espécies e processos de compra, consulta do processo selecionado e
`POST /patrimonios`. Input e response da mutação passam pelos schemas públicos;
o access token existe somente no escopo da request. Leituras podem recuperar
uma única vez um `401` pela sessão, mas a mutation nunca recebe retry
automático. A UI bloqueia ativação duplicada enquanto a confirmação está
pendente.

## Conferência inicial de inventário implementada

`MOBILE-INVENTARIOS-001` reutiliza `GET /inventarios`,
`GET /inventarios/:inventarioId`,
`GET /inventarios/:inventarioId/setores` e
`POST /inventarios/:inventarioId/setores/:setorInventarioId/iniciar`.
Listagens preservam busca, status e paginação explícitos; parâmetros e
responses são validados integralmente pelos schemas públicos. Leituras podem
recuperar uma única vez um `401`, enquanto iniciar setor nunca recebe retry
automático e usa trava local contra ativação duplicada.
