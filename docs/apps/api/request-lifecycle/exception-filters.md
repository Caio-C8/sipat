# Exception Filters

## Quando usar

Exception Filters recebem exceções não tratadas pelo restante do ciclo e as
convertem em uma resposta apropriada ao transporte.

Consulte [Exception filters no NestJS](https://docs.nestjs.com/exception-filters).

## Responsabilidade

Um Filter pode:

- reconhecer exceções conhecidas;
- escolher status e código público;
- montar o contrato estável de erro;
- registrar a falha interna com redaction;
- adicionar um identificador de correlação.

Ele não deve:

- expor stack, SQL, detalhes do Prisma ou configuração;
- transformar todo erro em sucesso;
- implementar recuperação complexa;
- duplicar formatação em vários Filters concorrentes;
- registrar a mesma exceção repetidamente em cada camada.

## Escopo e ordem

Filters são procurados do escopo mais específico para o global. Quando um Filter
captura uma exceção, ela não continua automaticamente para o próximo. Evite
Filters locais sem necessidade, pois eles podem contornar a política global.

## Contrato de erro

O Filter da API implementa, mas não inventa, o formato definido em
[Erros de contratos](../../../contracts/errors.md). Separe:

- detalhes internos usados em logs;
- código público estável;
- mensagem segura;
- erros de campos que o consumidor consegue corrigir.

Use `try/catch` no controller ou service somente quando houver recuperação,
compensação ou tradução deliberada. Exceções não tratadas precisam alcançar o
Filter central.
