# WEB-MOVIMENTACOES-000 — Placeholder de movimentações

**Status:** concluída como entrega histórica; substituída por WEB-MOVIMENTACOES-001 em 28/10/2026.

## Objetivo

Disponibilizar /movimentacoes como exemplo de página no shell existente,
explicitando que as operações patrimoniais ainda não foram implementadas.

## Contexto e referências

- [Roadmap Web](../apps/web/roadmap.md).
- [RF13 e papéis](../requisitos-SIPAT.md).
- [Fluxo entre agentes](../agents/workflow.md).
- [Guia de prompts](../../PROMPTS-MOVIMENTACOES.md).
- [Integração futura](./WEB-MOVIMENTACOES-001-integrar-movimentacoes.md).

## Escopo

Página Server, link no menu do diretor e catálogo público, breadcrumb,
aviso de desenvolvimento, ação/filtros desabilitados, tabela sem dados e
verificações de proteção por perfil, acessibilidade e responsividade.

## Fora do escopo

Contratos, endpoints de movimentação, gravações, migrations e consulta de dados
patrimoniais pela página. A tela não é uma reprodução confirmada do Figma.

## Decisões aprovadas

A solicitação atual autoriza um placeholder e a preparação dos prompts para
API e Web. Reutilizar DIRETOR_PATRIMONIO conforme o catálogo existente.
Administrador vai ao dashboard; anônimo e primeiro acesso seguem o layout.
O link existe porque a página existe; implementado permanece false porque a
capacidade de negócio não existe.

## Critérios de aceite

- [x] Página e link de diretor disponíveis com rótulo de desenvolvimento.
- [x] Sem campos de criação ativos, chamadas de movimentação ou registros fictícios.
- [x] Shell, metadata, breadcrumb e sessão preservados.
- [x] Perfis e redirects cobertos pelo E2E.
- [x] Verificações executadas documentadas abaixo.

## Arquivos ou módulos potencialmente afetados

- apps/web/app/(sistema)/movimentacoes/page.tsx;
- apps/web/app/page.tsx;
- apps/web/components/shared/system-sidebar.tsx;
- apps/web/lib/navigation/system-navigation.ts;
- apps/web/lib/navigation/tests/system-navigation.test.ts;
- apps/web/e2e/movimentacoes.e2e.ts;
- documentação de estado da Web e PROMPTS-MOVIMENTACOES.md.

## Verificações esperadas

Lint, typecheck, suíte Web, build e E2E de movimentações e autenticação.
Responsividade e axe automatizado não comprovam conformidade integral.

## Pendências ou decisões bloqueantes

Nenhuma para o placeholder. A funcionalidade real continua nos rascunhos
CONTRACTS-012, MOVIMENTACOES-001 e WEB-MOVIMENTACOES-001.

## Evidências

- Lint da Web e typecheck aprovados; a alteração final da sidebar também passou
  no lint e no TypeScript do build de produção.
- Vitest: 10 arquivos e 40 testes aprovados.
- Build de produção aprovado, incluindo a rota dinâmica /movimentacoes.
- Playwright: 19 testes aprovados na execução final, incluindo os quatro
  cenários de movimentações, autenticação, catálogo e headers de segurança.
- O cenário do diretor verificou controles desabilitados, ausência de chamadas
  do navegador a /api/backend, axe sem violações e ausência de overflow global
  nas larguras 390, 768 e 1440. Autenticação usou o backend simulado de testes.
- Captura da tela em 1440 px inspecionada; o rótulo da sidebar foi ajustado para
  caber sem truncamento. Não foi feita comparação visual com o Figma, cuja URL
  não pôde ser acessada pela ferramenta Web.
- Links relativos, formatação e git diff --check verificados. A suíte exigiu
  instalar o Chromium do Playwright, ausente na primeira tentativa; a nova
  execução passou. Não foram implementados nem testados contratos ou endpoints
  futuros de movimentações.
