# Instruções para agentes — API

Estas regras complementam o `AGENTS.md` da raiz para qualquer alteração em
`apps/api`.

## Leitura obrigatória

Antes de implementar, leia [a documentação da API](../../docs/apps/api/README.md)
e somente os capítulos relacionados à tarefa.

Para rotas, autenticação, autorização, dados externos ou componentes
transversais, leia também:

- [Segurança](../../docs/apps/api/security/README.md);
- [Performance](../../docs/apps/api/performance.md);
- [Ciclo da requisição](../../docs/apps/api/request-lifecycle/README.md).

## Pré-condições

- Confirme primeiro os contratos de request e response em `@repo/contracts`.
- Se um contrato estiver ausente ou ambíguo, pare e avise o usuário antes de
  desenvolver o módulo.
- Confirme o model Prisma, o client gerado, o provider singleton de banco e a
  configuração do `nestjs-zod`.
- Não invente políticas de autenticação, erros, paginação ou transações.
- Antes de criar ou alterar uma rota, defina se ela é pública, como autentica,
  quais permissões exige, quais regras de recurso aplica, quais campos pode
  expor e se precisa de limite especial.
- Defina limites de paginação, body, arrays, upload, concorrência e payload
  conforme o custo da operação.
- Se uma política de segurança necessária não estiver definida, apresente o
  risco e solicite a decisão do usuário antes de escolher um comportamento.

## Arquitetura obrigatória

- Organize cada domínio em `src/modules/<dominio>`.
- Use `dtos`, `mappers` e `types`, além de controller, service, repository e
  module do domínio.
- Crie DTOs como classes que estendem `createZodDto(schema)`; não use o padrão
  de constante mais alias de tipo com o mesmo nome.
- Mantenha repository limitado a operações Prisma mínimas. Não coloque nele
  regras, formatação, mappers ou exceções de domínio.
- Injete um único client Prisma por meio do provider de infraestrutura. Não
  instancie `PrismaClient` no repository.
- Coloque regras e orquestração no service. Um service usa o repository do
  próprio domínio e services, nunca repositories, de outros domínios.
- Mantenha controllers como pontes: recebem DTOs, chamam o service e mapeiam o
  retorno para tipos de `@repo/contracts`.
- Antes de criar um decorator customizado, explique a necessidade e peça
  autorização ao usuário.
- Não crie Guard, Interceptor, Filter, Middleware, Pipe ou Strategy apenas para
  completar uma estrutura. Primeiro identifique a responsabilidade, o escopo e
  a posição correta no ciclo da requisição.
- Não trate validação Zod, CORS ou autenticação como substitutos de autorização.
- Aplique autorização por recurso no service ou policy apropriado quando a
  decisão depender de dados carregados do banco.
- Use contratos e mappers como allowlist de campos de saída; não retorne models
  Prisma diretamente.
- Em cada module, registre controllers e providers, exporte somente services e
  importe os módulos dos services externos.
- Reavalie os limites antes de usar `forwardRef()` para uma dependência circular.
- Ao concluir um domínio, registre seu module no `AppModule`.
- Evite N+1, over-fetching e listagens sem limite; confirme queries e índices
  com evidência proporcional ao risco.
- Paralelize somente operações independentes e limite fan-out conforme pool e
  dependências.
- Preserve métricas por rota normalizada para duração, volume, falhas,
  saturação e dependências, sem labels sensíveis ou de alta cardinalidade.

## Utilitários

- Uso de um domínio da API: `src/common/utils/<dominio>`.
- Uso de vários módulos, somente na API: `src/common/utils`.
- Uso real por mais de um app e sem dependência de servidor: `packages/utils`.

## Verificação

Execute os checks relevantes descritos em
[workflow e testes](../../docs/apps/api/workflow-and-testing.md). Não encerre a
tarefa com falhas conhecidas sem relatá-las claramente.

Ao explicar uma implementação, relacione-a à documentação da API e diferencie
o padrão planejado do estado realmente implementado. Questione propostas que
contrariem o ciclo do NestJS, os limites das camadas ou controles de segurança,
apresentando evidências e uma alternativa concreta.
