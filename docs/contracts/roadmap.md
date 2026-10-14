# Roadmap do `@repo/contracts`

Este arquivo registra:

1. o baseline entregue por esta estrutura padrão;
2. objetivos concretos adicionados pelo projeto que reutilizar a estrutura.

Ele não antecipa entidades, features ou regras de um domínio inexistente. Um
projeto novo começa somente com o baseline concluído e registra seus próprios
objetivos quando surgir uma necessidade real.

## Baseline da estrutura padrão

- [x] Package compartilhado localizado em `packages/contracts`.
- [x] Nome de workspace definido como `@repo/contracts`.
- [x] Package privado com entrypoint e export público em `src/index.ts`.
- [x] Zod 4 disponível para contratos runtime.
- [x] Configurações compartilhadas de TypeScript e ESLint.
- [x] Scripts de lint, typecheck e testes disponíveis no package.
- [x] Dependências `workspace:*` configuradas nos apps Web e API.
- [x] Transpilação de `@repo/contracts` configurada no Next.js.
- [x] Package independente de `@repo/database` e de código server-only.
- [x] Contratos genéricos de resposta, erro e paginação implementados e
      testados.
- [x] Tipos neutros do health check compartilhados entre Web e API.
- [x] Teste que protege a API pública genérica do package.
- [x] Documentação de arquitetura, convenções, erros, integrações e testes.
- [x] Instruções para agentes apontando para a documentação de contratos.

O baseline contém somente o que qualquer projeto criado a partir desta base
recebe funcionando. Uma capacidade documentada, mas ainda não implementada e
verificada, não deve ser marcada como concluída.

## Objetivos específicos do projeto

Nenhum objetivo de domínio está ativo na estrutura padrão. Adicione um objetivo
antes de criar uma capacidade relevante ou alterar o comportamento externo de
um contrato.

Cada objetivo deve registrar:

- contexto e problema concreto;
- escopo e itens explicitamente excluídos;
- consumidores afetados;
- critérios de aceite verificáveis;
- decisões semânticas que não podem ser inferidas apenas do tipo.

## Histórico do baseline

### CONTRACTS-BASELINE-001 — Consolidar contratos genéricos após o exemplo

**Status:** concluído

**Contexto**

O fluxo didático preservado em `exemplo-produto-v1.0.0` validou contratos
runtime compartilhados entre banco, API e Web. Depois dessa validação, a branch
`main` voltou a representar somente a estrutura reutilizável entregue a novos
projetos.

**Escopo**

- remover da API pública os schemas e tipos exclusivos do domínio didático;
- preservar contratos, helpers e testes comprovadamente genéricos;
- atualizar API, Web, banco e documentação para não consumirem os contratos
  removidos;
- manter o package em Zod 4, independente de `@repo/database` e pronto para
  receber contratos de um domínio real;
- validar o package e todos os consumidores afetados.

**Consumidores afetados**

- `apps/api`, que voltou a expor somente o health check;
- `apps/web`, que voltou a expor somente a página inicial e a infraestrutura;
- `packages/database`, cujo schema voltou a não possuir models de domínio.

**Critérios de aceite**

- [x] somente contratos genéricos permanecem exportados;
- [x] contratos removidos não possuem consumidores na `main`;
- [x] lint, typecheck e testes de `@repo/contracts` passam;
- [x] API, Web e banco passam nas verificações aplicáveis;
- [x] documentação diferencia o baseline atual do exemplo preservado na tag.
