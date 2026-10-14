# Workflow e testes

## Verificação antes de implementar

Antes de criar um módulo, confirme:

- schemas de request e response em `@repo/contracts`;
- tipos derivados e semântica de input/output;
- model, relações e identificadores no Prisma;
- Prisma Client gerado;
- provider singleton do banco disponível para injeção;
- `nestjs-zod` e `ZodValidationPipe` configurados;
- política aplicável de autenticação, autorização, erros e paginação;
- matriz de segurança das novas rotas;
- controles globais dos quais o módulo depende.
- limites de entrada, paginação, payload e concorrência;
- métricas e cenário de performance proporcionais ao risco da rota.

Se os contratos necessários não existirem, um agente deve parar e avisar o
usuário. A criação dos contratos é uma etapa anterior e deve seguir
[docs/contracts](../../contracts/README.md).

## Ordem recomendada

1. confirmar os contratos e o schema Prisma;
2. gerar o Prisma Client quando o schema tiver mudado;
3. criar a estrutura do módulo;
4. definir tipos de payload Prisma;
5. implementar repository;
6. implementar service;
7. implementar mappers;
8. criar DTOs a partir dos schemas existentes;
9. definir acesso, autorização por recurso, exposição e limites de cada rota;
10. definir queries, concorrência, timeout e métricas dos caminhos críticos;
11. implementar controller e aplicar os componentes existentes;
12. criar um Guard, Interceptor, Filter, Pipe ou decorator somente se uma
    responsabilidade ainda não estiver atendida;
13. configurar o módulo e registrá-lo no `AppModule`;
14. adicionar testes funcionais, de segurança e de performance aplicáveis;
15. executar as verificações.

A ordem pode variar quando testes forem escritos antes da implementação, mas as
responsabilidades das camadas não mudam.

## Estratégia de testes

| Alvo         | Verificação principal                                      |
| ------------ | ---------------------------------------------------------- |
| Mapper       | conversão exata para o contrato de response                |
| Service      | regras e orquestração com repositories/services simulados  |
| Controller   | encaminhamento de parâmetros e escolha do mapper           |
| Repository   | query e payload reais em banco de teste controlado         |
| Module       | resolução de providers, imports e exports                  |
| E2E          | validação do boundary, autorização, status e response HTTP |
| Guard/policy | permissão, negação padrão e escopo do recurso              |
| Interceptor  | ordem, efeito transversal e redaction                      |
| Filter       | contrato público sem detalhes internos                     |

Casos importantes incluem sucesso, ausência de registro, conflitos de regra,
paginação, relações opcionais e valores que exigem serialização.

Adicione também os casos aplicáveis de
[Testes de segurança](./security/testing.md), principalmente credenciais
ausentes ou inválidas, acesso a recurso de outra identidade, propriedades
proibidas, limites de entrada e vazamento de informações em erros e responses.

Para caminhos com listagem, upload, integração externa ou processamento caro,
adicione evidência conforme [Performance da API](./performance.md). Teste com
volume representativo quando o comportamento depender da quantidade de dados.

## Comandos de verificação

Use os scripts disponíveis no estado atual do monorepo:

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/api lint
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api test
pnpm --filter @repo/api build
pnpm format:check
```

Execute `db:generate` apenas quando o schema ou a geração do client exigir. Para
uma mudança localizada, comece pelos comandos do package afetado; antes de
entregar uma mudança transversal, amplie a validação aos consumidores.

Não declare a implementação concluída se os testes relevantes falharem ou se o
grafo de injeção de dependências não inicializar.
