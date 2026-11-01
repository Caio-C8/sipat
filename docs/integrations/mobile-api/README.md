# Integração entre Mobile e API

Este diretório documenta os acordos entre `apps/mobile` e `apps/api`.

## Escopo

Aqui ficam configuração de endpoint, clientes e operações HTTP, contratos,
timeout, cancelamento, erros, conectividade, cache/offline, autenticação,
armazenamento de credencial, observabilidade e testes da fronteira.

Construção visual fica em [Aplicativo mobile](../../apps/mobile/README.md).
Controllers, services e repositories ficam em [API](../../apps/api/README.md).

## Estado atual

```text
apps/mobile
    ↓ health público, /api/auth/mobile ou leituras de domínio autenticadas
apps/api
    ↓ response validada por schema compartilhado
sessão em memória + refresh no storage nativo
```

- o mobile chama a API diretamente, sem proxy equivalente ao Next.js;
- `EXPO_PUBLIC_API_URL` precisa ser alcançável pelo dispositivo;
- em development, o host do Metro pode fornecer o hostname da API local;
- a response do health check é validada em runtime;
- a consulta possui timeout de oito segundos e cancelamento;
- a request anterior é abortada antes de outra verificação;
- o cliente HTTP comum atende autenticação, leituras de domínio e o cadastro
  unitário de patrimônio com os catálogos gerais existentes; esse cadastro
  preserva sua chave de idempotência em resultados incertos;
- as leituras de domínio usam cache somente em memória e offline não existe;
- `MOBILE-QUERY-001` entregou TanStack Query v5, provider, foco nativo e limpeza
  do cache em memória por sessão; `MOBILE-QUERY-002` migrou as leituras e
  `MOBILE-QUERY-003` conectou as mutations às invalidações seletivas;
- o health check público não envia credencial.

## Diferença entre Web e nativo

No navegador, a interface mobile obedece CORS e a origem local precisa estar em
`CORS_ORIGINS`. Em Android/iOS nativos, CORS do navegador não se aplica, mas a
API ainda precisa estar acessível e todo controle de autenticação/autorização
continua obrigatório.

Não reutilize automaticamente o `browserApiClient` da Web. O mobile não possui
o proxy `/api/backend`, tem ciclo de vida próprio, conectividade variável e uma
política diferente para credenciais persistidas.

## Regras centrais

- Componentes não espalham `fetch` nem repetem base URL.
- Uma operação representa método, endpoint e intenção específicos.
- Input, parâmetro e response usam contratos próprios.
- Response é dado não confiável e deve ser validada.
- `EXPO_PUBLIC_*` nunca contém segredo.
- Produção e staging usam HTTPS.
- Mutation não recebe retry automático sem idempotência explícita.
- Cache e fila offline exigem escopo, validade, conflito e limpeza.
- Token não é armazenado em AsyncStorage.
- Métricas e logs não recebem token, payload pessoal, ID ou URL completa.

## Documentos

| Assunto                                  | Documento                                           |
| ---------------------------------------- | --------------------------------------------------- |
| Cliente, operações e configuração        | [Clientes e operações](./clients-and-operations.md) |
| Erros, conectividade, cache e testes     | [Erros, cache e testes](./errors-cache-testing.md)  |
| Autenticação e armazenamento no aparelho | [Autenticação e armazenamento](./auth-storage.md)   |
| Fontes oficiais                          | [Referências](./references.md)                      |

## Decisões pendentes

- persistência, criptografia e operação offline, que não fazem parte da política
  em memória aprovada;
- retry e idempotência das demais operações que ainda não possuem política;
- correlation ID e provedor de observabilidade;
- limites de request/response e metas de latência;
- comportamento no background e retomada.

O mecanismo de sessão nativa, a rotação e o SecureStore foram implementados em
[Autenticação e armazenamento](./auth-storage.md). Renovação periódica em
background, persistência do cache e fila offline continuam fora desta entrega.

Não escolha essas políticas silenciosamente apenas para completar estrutura.

## Recuperação de senha aprovada

`MOBILE-AUTH-004` adicionou uma operação pública para o endpoint existente
`POST /auth/esqueceu-senha`. Ela não envia Bearer, não usa refresh, não recebe
retry automático e valida a response neutra compartilhada. A API deve aceitar
o transporte nativo dessa solicitação sem exigir que o app forje uma origem
Web. A exceção de CSRF é metadata exclusiva desse handler público, que não lê
cookie ou sessão; login Web, redefinição, logout e demais mutations preservam
Origin e `X-SIPAT-CSRF`.

O app não recebe nem consome o token. O e-mail abre o consumidor Web de
`WEB-AUTH-002`; depois do sucesso, `sipat://login?origem=recuperacao-senha`
pode voltar ao login do app sem credencial ou identificação. Consulte a
[especificação](../../tasks/MOBILE-AUTH-004-solicitar-recuperacao-senha.md).
