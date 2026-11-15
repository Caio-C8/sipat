# `WEB-INVENTARIOS-002` — Evoluir consulta, edição e finalização

**Status:** `aprovada`

## Objetivo

Completar o ciclo Web de inventários com consulta padronizada, edição segura do
inventário pendente e finalização pelo Diretor usando a regra já existente.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Backend existente: [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md),
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md) e
  [INVENTARIOS-003](./INVENTARIOS-003-consulta-administrador.md).
- Fundações: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md) e
  [SEC-002](./SEC-002-matriz-leitura-compartilhada.md).

## Escopo

- listar por nome, comissão e situação, com Combobox, tabela e paginação comuns;
- remover o aviso azul instrucional;
- transformar criação e edição em modais roteáveis com página completa no
  acesso direto;
- criar contrato e `PATCH /inventarios/:inventarioId` para nome, descrição,
  observação e comissão, somente pelo Diretor e somente em `PENDENTE`;
- revalidar status e comissão sob transação/lock; após iniciar qualquer setor,
  os quatro campos ficam imutáveis;
- manter o detalhe operacional como página completa;
- adicionar ao detalhe botão Web de finalização somente para Diretor;
- bloquear ação enquanto houver setor não concluído e mostrar progresso;
- se houver correções pendentes, mostrar quantidade e exigir a confirmação
  explícita já prevista por `confirmarCorrecoesPendentes`;
- atualizar o detalhe para somente leitura após sucesso e preservar o destino
  `?visao=pendentes` usado pelo dashboard.

## Fora do escopo

- exigir correção de todas as divergências antes de finalizar;
- conferir bens/setores pela Web;
- reabrir inventário ou editar inventário iniciado/finalizado;
- alterar a população snapshot criada pelo inventário.

## Decisões aprovadas

- Administrador consulta; Diretor cria, edita enquanto pendente, corrige e
  finaliza;
- finalização é ação no detalhe, não nova página isolada;
- detalhe grande não abre em modal;
- mudança de comissão não reescreve fatos já iniciados porque é proibida depois
  da transição para `EM_ANDAMENTO`.

## Critérios de aceite

- [ ] filtros e paginação preservam URL e funcionam nos dois perfis.
- [ ] URL direta de criação/edição renderiza página e navegação interna usa modal.
- [ ] API recusa edição concorrente ou fora de `PENDENTE` com `409` público.
- [ ] Administrador recebe `403` em edição/finalização e não vê ações.
- [ ] finalização sem setores concluídos é impedida.
- [ ] correções pendentes exigem confirmação, mas não bloqueiam após confirmação.
- [ ] inventário finalizado fica integralmente somente leitura.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/inventario/`;
- `apps/api/src/modules/inventarios/` e testes;
- `apps/web/app/(sistema)/inventarios/` com rotas paralelas/interceptadas;
- `apps/web/features/inventarios/`;
- navegação, dashboard e E2E de inventários.

## Verificações esperadas

- contratos, API e Web: lint, tipos e testes;
- build Web;
- migrations não são esperadas; qualquer necessidade deve ser justificada;
- API E2E e Web E2E nos dois perfis com PostgreSQL descartável;
- concorrência de edição/início/finalização;
- teclado, foco, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.
