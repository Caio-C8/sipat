# `BAIXAS-002` — Permitir consulta individual de baixa pelo Administrador

**Status:** `concluída`

## Objetivo

Permitir que `ADMINISTRADOR` consulte os dados estruturados de uma baixa pela
rota `GET` já existente, preservando exclusivamente para
`DIRETOR_PATRIMONIO` o registro da baixa, as opções necessárias à mutação e o
download do PDF comprobatório.

## Contexto e referências

- Requisitos: [RF17, UC17 e RNF05](../requisitos-SIPAT.md) e a definição do
  [Administrador](../requisitos-SIPAT.md#administrador-do-sistema).
- Entregas existentes:
  [CONTRACTS-010](./CONTRACTS-010-contratos-baixas-patrimoniais.md),
  [BAIXAS-001](./BAIXAS-001-registrar-consultar-baixas.md) e
  [RELATORIOS-001](./RELATORIOS-001-consultas-tabulares.md).
- Segurança: [política de baixas](../security-and-access.md#baixas-patrimoniais--política-aprovada-para-a-interface-web).
- Consumidor planejado:
  [WEB-BAIXAS-001](./WEB-BAIXAS-001-interface-baixas.md).
- API: [índice](../apps/api/README.md),
  [controllers](../apps/api/controllers.md) e
  [workflow e testes](../apps/api/workflow-and-testing.md).

## Escopo

- autorizar `ADMINISTRADOR` e `DIRETOR_PATRIMONIO` somente em
  `GET /api/patrimonios/:patrimonioId/baixa`;
- manter o mesmo schema, allowlist, status HTTP, erro de baixa inexistente e
  semântica da consulta entregue por `BAIXAS-001`;
- preservar somente `DIRETOR_PATRIMONIO` em:
  - `GET /api/patrimonios/:patrimonioId/baixa/opcoes/comissoes`;
  - `POST /api/patrimonios/:patrimonioId/baixa`;
  - `GET /api/patrimonios/:patrimonioId/baixa/anexo`;
- provar com os Guards reais que o Administrador lê o registro, mas recebe
  `403` antes do service nos três boundaries exclusivos do Diretor;
- atualizar a documentação de estado da API somente depois da verificação.

## Fora do escopo

- migration, schema Prisma, seed ou alteração de dados existentes;
- novo endpoint de listagem: `GET /api/relatorios/baixas` já fornece consulta
  paginada aos dois perfis;
- alteração de contratos, responses, filtros, regras de domínio ou códigos de
  erro;
- download do anexo pelo Administrador;
- edição, exclusão, reativação, estorno ou baixa em lote;
- implementação da interface Web.

## Decisões aprovadas

- Administrador e Diretor consultam dados estruturados da baixa; somente o
  Diretor executa a operação.
- A autorização é declarada por método. Compartilhar o prefixo de rota não
  concede ao Administrador acesso às opções, à mutation ou ao PDF.
- O relatório tabular existente é a fonte de listagem; não será duplicado por
  conveniência da Web.
- Nenhum contrato ou dado persistido precisa mudar para corrigir o
  desalinhamento de autorização.

## Critérios de aceite

- [x] sessão válida de Administrador e Diretor recebe `200` na consulta
      individual existente;
- [x] sessão anônima recebe `401`;
- [x] Administrador recebe `403` em opções, criação e anexo, sem chamada ao
      service correspondente;
- [x] Diretor preserva criação, consulta, opções e anexo sem regressão;
- [x] payload, allowlist e erros da consulta permanecem compatíveis;
- [x] nenhum endpoint, contrato, migration ou acesso ao anexo é ampliado.

Concluída em 13 de novembro de 2026. A autorização por método passou a aceitar
Administrador e Diretor somente na consulta individual. Os boundaries de
opções, criação e anexo permanecem exclusivos do Diretor e retornam `403` ao
Administrador antes de chamar seus services. O teste E2E focado, lint,
typecheck, 427 testes da API e build passaram.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/baixas/baixas.controller.ts`;
- `apps/api/test/baixas.e2e-spec.ts`;
- testes unitários do controller/Guard, se existirem no corte vivo;
- `docs/apps/api/README.md`, `docs/security-and-access.md`, `docs/roadmap.md` e
  esta tarefa somente após as verificações correspondentes.

`apps/api/src/modules/baixas/baixas.service.ts`, o repository, contratos e
Prisma são referências de regressão, não alvos previstos.

## Verificações esperadas

- `pnpm --filter @repo/api lint`;
- `pnpm --filter @repo/api typecheck`;
- testes focados de baixas e autorização com Guards reais;
- `pnpm --filter @repo/api test`;
- `pnpm --filter @repo/api build`;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Se a implementação exigir mudar response, persistência ou acesso ao
  PDF, deve retornar ao planejador antes de ampliar o escopo.
