# Ciclo da requisição NestJS

## Ordem geral

O ciclo HTTP do NestJS ocorre, de forma simplificada, nesta ordem:

```text
requisição
  ↓
middleware
  ↓
guards
  ↓
interceptors (entrada)
  ↓
pipes
  ↓
controller → service → repository
  ↓
interceptors (saída, em ordem inversa)
  ↓
response

exceção não tratada → exception filter
```

Componentes globais, de controller e de rota também possuem ordem própria. A
referência definitiva é o
[Request lifecycle do NestJS](https://docs.nestjs.com/faq/request-lifecycle).

## Documentos

| Componente                              | Documento                                       |
| --------------------------------------- | ----------------------------------------------- |
| Permissão para continuar a requisição   | [Guards](./guards.md)                           |
| Comportamento antes e depois do handler | [Interceptors](./interceptors.md)               |
| Conversão de exceções não tratadas      | [Exception Filters](./exception-filters.md)     |
| Trabalho anterior à rota e validação    | [Middleware e Pipes](./middleware-and-pipes.md) |

Strategies de autenticação estão em
[Segurança: autenticação](../security/authentication.md).

## Escopo de registro

Um componente pode ser aplicado:

- globalmente;
- a um controller;
- a uma rota;
- como provider de um módulo.

Use o menor escopo que represente a política real. Controles que formam um
baseline global devem ser registrados de modo que possam usar injeção de
dependência e sejam exercitados nos testes E2E.

## Organização do código

```text
apps/api/src/common/
├── decorators/
├── filters/
├── guards/
├── interceptors/
├── middleware/
└── pipes/
```

Um componente exclusivo de um domínio pode ficar dentro do próprio módulo. Não
crie uma versão local de um controle global apenas para evitar importar o módulo
que o fornece.
