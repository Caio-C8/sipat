# Roadmap do `@repo/contracts`

Este arquivo registra:

1. o baseline técnico já entregue;
2. objetivos concretos dos contratos do SIPAT.

Ele não antecipa entidades ou semânticas além do que está confirmado nos
[requisitos do SIPAT](../requisitos-SIPAT.md). Cada capacidade é registrada
quando entrar em uma entrega concreta.

## Baseline técnico

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

O baseline contém somente a infraestrutura que já funciona no SIPAT. Uma
capacidade documentada, mas ainda não implementada e verificada, não deve ser
marcada como concluída.

## Objetivos específicos do projeto

Nenhum contrato de domínio do SIPAT está implementado. Adicione um objetivo
antes de criar uma capacidade relevante ou alterar o comportamento externo de
um contrato.

Cada objetivo deve registrar:

- contexto e problema concreto;
- escopo e itens explicitamente excluídos;
- consumidores afetados;
- critérios de aceite verificáveis;
- decisões semânticas que não podem ser inferidas apenas do tipo.

## Histórico do baseline

### CONTRACTS-BASELINE-001 — Consolidar contratos genéricos antes do domínio SIPAT

**Status:** concluído

**Contexto**

O repositório consolidou contratos runtime genéricos compartilhados entre API e
Web antes da implementação do domínio SIPAT. O baseline permanece pequeno para
que cada novo contrato patrimonial tenha semântica e consumidores concretos.

**Escopo**

- remover da API pública os schemas e tipos exclusivos do domínio didático;
- preservar contratos, helpers e testes comprovadamente genéricos;
- atualizar API, Web, banco e documentação para não consumirem os contratos
  removidos;
- manter o package em Zod 4, independente de `@repo/database` e pronto para
  receber contratos do SIPAT;
- validar o package e todos os consumidores afetados.

**Consumidores afetados**

- `apps/api`, que voltou a expor somente o health check;
- `apps/web`, que voltou a expor somente a página inicial e a infraestrutura;
- `packages/database`, cujo schema não possuía models de domínio ao concluir
  esta limpeza; os models do SIPAT foram adicionados em uma entrega posterior.

**Critérios de aceite**

- [x] somente contratos genéricos permanecem exportados;
- [x] contratos removidos não possuem consumidores na `main`;
- [x] lint, typecheck e testes de `@repo/contracts` passam;
- [x] API, Web e banco passam nas verificações aplicáveis;
- [x] documentação diferencia o baseline atual das capacidades previstas para o
      SIPAT.
