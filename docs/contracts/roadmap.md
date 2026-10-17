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

O contrato de identidade e perfis do `CONTRACTS-001` está implementado. Os
demais objetivos abaixo acompanham o [roadmap inicial](../roadmap.md). Um
objetivo planejado não representa um export já disponível.

Cada objetivo deve registrar:

- contexto e problema concreto;
- escopo e itens explicitamente excluídos;
- consumidores afetados;
- critérios de aceite verificáveis;
- decisões semânticas que não podem ser inferidas apenas do tipo.

### CONTRACTS-001 — Identidade e perfis para controle de acesso

**Status:** concluído

**Contexto**

`SEC-001` precisa compartilhar os dois perfis confirmados pelos requisitos e a
representação segura da identidade autenticada sem importar enums do Prisma.

**Escopo**

- schema e tipo de `ADMINISTRADOR | DIRETOR_PATRIMONIO`;
- schema e tipo da identidade segura com `id`, `nome`, `email` e `perfil`;
- constantes públicas `X-SIPAT-CSRF` e `1`, que não contêm segredo;
- testes de valores válidos, inválidos, propriedades inesperadas e API pública;
- exports independentes de `@repo/database`.

**Consumidores afetados**

- API, nos Guards e no contexto autenticado;
- Web, ao consultar a identidade atual em `AUTH-001`.

**Critérios de aceite**

- [x] schema é a fonte de verdade e os tipos são derivados;
- [x] somente os dois perfis dos requisitos são aceitos;
- [x] identidade não contém senha, hash, sessão ou campos internos;
- [x] lint, typecheck e testes do package passam;
- [x] consumidores afetados passam nas verificações aplicáveis.

### CONTRACTS-002 — Operações de usuários e autenticação

**Status:** planejado

**Contexto**

`USERS-001` e `AUTH-001` exigem contratos distintos para CRUD administrativo,
login e identidade atual. Formulário, body, response e model Prisma não são o
mesmo contrato.

**Escopo**

- params, query, criação, atualização e situação do usuário;
- response segura resumida/detalhada e resposta paginada;
- body de login e response de identidade atual;
- testes de limites, e-mail, senha, PATCH, enums e ausência de campos sensíveis.

**Consumidores afetados**

- módulos `usuarios` e `auth` da API;
- features de usuários e autenticação da Web.

**Critérios de aceite**

- [ ] criação, atualização, situação, login e responses possuem schemas
      próprios quando suas semânticas diferem;
- [ ] senha existe somente nos inputs que realmente a recebem;
- [ ] responses nunca aceitam ou expõem senha, hash ou token;
- [ ] paginação reutiliza o contrato comum sem remover seu limite finito;
- [ ] contratos possuem testes antes do consumo pelos apps;
- [ ] lint, typecheck, testes e consumidores afetados passam.

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
