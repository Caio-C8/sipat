# `INVENTARIOS-003` — Permitir consulta administrativa de inventários

**Status:** `concluída`

## Objetivo

Permitir que o perfil `ADMINISTRADOR` consulte inventários e seu progresso pelas
rotas `GET` já existentes, preservando exclusivamente para
`DIRETOR_PATRIMONIO` todas as operações que criam ou alteram o ciclo do
inventário.

## Contexto e referências

- Requisitos: [RF11, RF19, RF20, RF21 e RNF05](../requisitos-SIPAT.md).
- Entregas existentes:
  [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md) e
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md).
- Segurança: [identidade e controle de acesso](../security-and-access.md).
- API: [índice](../apps/api/README.md),
  [controllers](../apps/api/controllers.md) e
  [testes](../apps/api/workflow-and-testing.md).
- Contratos: [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md).

## Escopo

- autorizar `ADMINISTRADOR` e `DIRETOR_PATRIMONIO` em:
  - `GET /api/inventarios`;
  - `GET /api/inventarios/:inventarioId`;
  - `GET /api/inventarios/:inventarioId/setores`;
  - `GET /api/inventarios/:inventarioId/itens`;
- manter os mesmos schemas, filtros, paginação, allowlists de response e
  semântica das consultas existentes;
- manter somente `DIRETOR_PATRIMONIO` em todos os `POST` do módulo;
- provar por testes de autorização que o Administrador consulta, mas recebe
  `403` ao tentar criar, iniciar, verificar, corrigir, concluir ou finalizar;
- atualizar a matriz documental de acesso depois da verificação.

## Fora do escopo

- criar endpoints específicos para mobile, dashboard ou agregação;
- alterar contratos públicos ou persistência quando a autorização dos quatro
  `GET` for suficiente;
- conceder ao Administrador qualquer mutação de inventário ou patrimônio;
- implementar histórico agregado ou relatórios ainda inexistentes;
- alterar regras de concorrência, auditoria ou transição de estado.

## Decisões aprovadas

- o Administrador pode visualizar todos os dados patrimoniais necessários para
  consulta, acompanhamento e relatórios, mas não executa operações sobre o
  patrimônio;
- a autorização é declarada por método: compartilhar o prefixo
  `/inventarios` não concede acesso aos `POST`;
- o cliente não é controle de acesso; ações omitidas ou desabilitadas no mobile
  continuam protegidas pela API;
- a Home mobile reutiliza esses `GET`; não será criada rota de dashboard mobile.

## Critérios de aceite

- [x] os quatro `GET` aceitam sessão válida de ambos os perfis;
- [x] paginação, filtros, respostas e status HTTP permanecem compatíveis;
- [x] todos os `POST` de inventários continuam restritos ao Diretor;
- [x] anônimo recebe `401`, Administrador recebe `403` nas mutações e Diretor
      preserva o comportamento atual;
- [x] testes E2E usam os Guards reais e cobrem pelo menos um caso por grupo de
      leitura e cada boundary mutável;
- [x] nenhuma rota específica para mobile ou agregação duplicada é criada.

Concluída em 28 de outubro de 2026. Os quatro handlers `GET` passaram a declarar
explicitamente os perfis `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`, sem alterar
schemas, filtros, paginação, responses ou persistência. Os seis handlers
mutáveis preservaram a autorização exclusiva do Diretor de Patrimônio. A suíte
E2E do módulo usa os Guards globais reais para comprovar `401` sem sessão,
sucesso das quatro consultas nos dois perfis e `403` do Administrador antes de
qualquer chamada ao service em cada mutação.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/inventarios/inventarios.controller.ts`;
- testes E2E de autorização e consultas do módulo de inventários;
- `docs/security-and-access.md`;
- `docs/roadmap.md` e esta tarefa após a verificação.

Os contratos em `packages/contracts/src/inventario/` devem ser consultados e
reutilizados, não alterados sem necessidade comprovada.

## Verificações esperadas

- lint, typecheck, testes e build de `@repo/api`;
- testes E2E com sessão anônima, Administrador e Diretor de Patrimônio;
- testes existentes de `@repo/contracts`, caso algum boundary seja tocado;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
