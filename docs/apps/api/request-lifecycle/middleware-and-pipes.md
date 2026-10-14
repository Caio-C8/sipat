# Middleware e Pipes

## Middleware

Middleware executa antes de Guards e não conhece os metadados específicos do
handler da mesma forma que o `ExecutionContext`.

Usos apropriados:

- headers HTTP de segurança;
- correlation ID e contexto inicial;
- integração de middleware da plataforma;
- parsing ou limites fornecidos pelo adapter;
- logging mínimo de acesso com redaction.

Não use middleware para autorização específica de rota quando um Guard puder
expressar a política. A ordem de registro importa: Helmet, CORS e outros
middlewares precisam ser configurados antes das rotas que devem atingir.

Consulte [Middleware no NestJS](https://docs.nestjs.com/middleware).

### Estado atual da correlação

O middleware funcional em
`apps/api/src/common/middleware/requisicao-id.middleware.ts` gera um UUID por
requisição, armazena-o em `request.requisicaoId` e prepara o header
`X-Request-Id` da resposta. Ele ignora um identificador enviado pelo cliente e
está registrado no `AppModule` para todos os métodos e caminhos.

O header está exposto pela configuração de CORS. Testes E2E confirmam sua
presença em respostas de sucesso e confirmam que o filtro usa o mesmo
identificador no header e no corpo de erro. O filtro preserva a geração de um
UUID como fallback defensivo caso receba uma request sem o contexto esperado.

## Pipes

Pipes validam e transformam argumentos antes do controller. Na estrutura deste
repositório, schemas de `@repo/contracts` conectados por `nestjs-zod` formam o
boundary principal de body, query e params.

Um Pipe pode:

- rejeitar formato inválido;
- converter um valor conforme contrato explícito;
- produzir erro de validação estável por meio da política definida.

Ele não deve:

- consultar banco para aplicar regra de negócio;
- autorizar acesso;
- aceitar propriedades que o contrato não declara;
- normalizar um valor sem semântica acordada;
- substituir limites de body e upload configurados na plataforma.

Consulte [Pipes no NestJS](https://docs.nestjs.com/pipes) e
[DTOs desta API](../dtos.md).

## Escopo

Prefira validação global consistente e Pipes específicos somente quando o
boundary exigir. Teste a composição real para confirmar que transforms e erros
ocorrem antes do controller.
