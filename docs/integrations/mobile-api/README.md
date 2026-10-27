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
    ↓ GET /api/health
apps/api
    ↓ JSON HealthResponse
validação no boundary mobile
    ↓
estado apresentado na tela
```

- o mobile chama a API diretamente, sem proxy equivalente ao Next.js;
- `EXPO_PUBLIC_API_URL` precisa ser alcançável pelo dispositivo;
- em development, o host do Metro pode fornecer o hostname da API local;
- a response do health check é validada em runtime;
- a consulta possui timeout de oito segundos e cancelamento;
- a request anterior é abortada antes de outra verificação;
- não existem cliente geral, operação de domínio, autenticação, cache ou offline;
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

- biblioteca de estado remoto e query keys;
- persistência, criptografia e operação offline;
- retry e idempotência por operação;
- correlation ID e provedor de observabilidade;
- limites de request/response e metas de latência;
- comportamento no background e retomada.

O mecanismo de sessão nativa, as durações, a rotação e o SecureStore foram
aprovados em [Autenticação e armazenamento](./auth-storage.md), mas ainda não
estão implementados.

Não escolha essas políticas silenciosamente apenas para completar estrutura.
