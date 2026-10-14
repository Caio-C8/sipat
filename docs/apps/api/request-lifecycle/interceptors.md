# Interceptors

## Quando usar

Interceptors executam lógica antes e depois do handler e podem observar ou
transformar o fluxo baseado em `Observable`.

Usos apropriados incluem:

- consumo do contexto de correlação em métricas e tracing;
- timeout;
- cache quando semanticamente seguro;
- transformação transversal de response já definida pelo contrato;
- auditoria sem conteúdo sensível.

Consulte [Interceptors no NestJS](https://docs.nestjs.com/interceptors).

## Limites

Não use Interceptor como principal mecanismo de autenticação ou autorização;
Guards executam antes e representam essa decisão. Também não esconda nele regras
específicas de um domínio.

Um Interceptor não deve:

- registrar body, headers ou response completos indiscriminadamente;
- alterar silenciosamente o contrato de todas as rotas;
- converter qualquer erro sem respeitar a política de Exception Filters;
- manter estado mutável compartilhado entre requisições;
- aplicar cache a respostas dependentes de identidade sem chave e isolamento
  corretos.

## Ordem

Na entrada, Interceptors seguem a ordem global, controller e rota. Na saída, o
encadeamento é resolvido em ordem inversa. Ao combinar logging, timeout, cache e
transformação, documente e teste a ordem esperada.

Para componentes globais que usam injeção de dependência, prefira registro por
`APP_INTERCEPTOR` no módulo correspondente.

## Estado atual da serialização

O `ZodSerializerInterceptor` está registrado globalmente e valida a resposta
final indicada por `@ZodSerializerDto`. Ele funciona como proteção contra
response incompatível e exposição acidental de propriedades que o schema não
permite.

O baseline atual não possui `@nestjs/swagger`. No `nestjs-zod` 5.5,
`@ZodResponse` depende desse package em runtime porque também registra a
response OpenAPI. Enquanto Swagger não for uma capacidade adotada pelo projeto,
o controller combina `@ZodSerializerDto` e `@HttpCode`.

Não existe um segundo interceptor para criar envelopes de sucesso. Cada
controller monta explicitamente o envelope previsto pelo contrato da operação;
o interceptor de serialização recebe essa estrutura pronta e a valida. Um novo
interceptor só deve ser criado quando surgir uma responsabilidade transversal
que ainda não esteja atendida, como métricas ou tracing, com ordem e testes
definidos.
