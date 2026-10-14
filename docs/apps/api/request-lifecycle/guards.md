# Guards

## Quando usar

Um Guard implementa `CanActivate` e decide se a requisição pode alcançar o
handler. Ele é adequado para autenticação, permissões baseadas em metadados e
outros critérios de acesso disponíveis no `ExecutionContext`.

Consulte [Guards no NestJS](https://docs.nestjs.com/guards).

## Responsabilidade

Um Guard pode:

- ler metadados de decorators;
- acessar a identidade já autenticada;
- delegar uma decisão a um policy service;
- retornar `true`, `false` ou lançar a exceção de acesso apropriada.

Ele não deve:

- mapear responses;
- alterar modelos do domínio;
- substituir validações de DTO;
- executar o caso de uso;
- conter regras extensas de negócio;
- registrar credenciais ou o request completo.

## Autorização por recurso

Quando a decisão depende de carregar um registro, avalie um policy service ou o
service do caso de uso. Buscar o mesmo recurso no Guard e no service pode gerar
duplicação, condições de corrida e regras divergentes.

A proteção precisa ocorrer antes de expor ou alterar o recurso, mesmo que não
esteja fisicamente dentro do Guard.

## Decorators e metadados

Um decorator como `@Public()` ou `@Permissions()` não aplica segurança sozinho.
Para cada decorator, documente:

- qual metadata key é definida;
- qual Guard a lê;
- comportamento quando a metadata está ausente;
- precedência entre rota e controller;
- testes que comprovam o vínculo.

Antes de criar um decorator ou Guard customizado, um agente deve verificar se o
NestJS ou uma implementação existente já resolve a necessidade e explicar a
decisão ao usuário.
