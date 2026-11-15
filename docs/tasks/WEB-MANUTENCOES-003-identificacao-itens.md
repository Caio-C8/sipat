# `WEB-MANUTENCOES-003` — Identificar pedidos e simplificar itens

**Status:** `aprovada`

## Objetivo

Dar identificação humana aos pedidos de manutenção e simplificar seleção e
preenchimento por item, preservando o ciclo funcional já validado para os dois
perfis.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF18](../requisitos-SIPAT.md#rf18-gestão-de-manutenções).
- Estado: [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md),
  [WEB-MANUTENCOES-001](./WEB-MANUTENCOES-001-interface-manutencoes.md) e
  [WEB-MANUTENCOES-002](./WEB-MANUTENCOES-002-paridade-visual-figma.md).
- Fundação: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Escopo

- adicionar `numeroPedido BIGINT`, único, imutável e gerado por sequence;
- retropreencher pedidos existentes em ordem determinística de criação/id;
- transportar o número como string decimal nos contratos JSON e exibir
  `Pedido #n`; não reutilizar `numeroRequisicao` nem UUID;
- cobrir geração concorrente e busca por número do pedido;
- aplicar filtros, tabela, paginação, feedback e sete casas monetárias do kit;
- melhorar a busca e seleção de patrimônios disponíveis;
- mostrar dados de cada item abaixo do bem selecionado em seção recolhível,
  com erros próprios, resumo, remoção segura e preservação dos dados digitados;
- pausar confirmação enquanto houver item incompleto e focar o primeiro erro;
- preservar orçamento, retorno, documentos, idempotência e permissões iguais
  para Administrador e Diretor.

## Fora do escopo

- alterar significado de `numeroRequisicao`/`numeroEmpenho`;
- reiniciar numeração por ano;
- excluir pedidos ou itens já confirmados;
- mudar regra de orçamento, retorno, garantia ou anexos.

## Decisões aprovadas

- sequência é global e gaps são aceitáveis;
- o banco usa `BIGINT`, enquanto API/Web usam string decimal;
- itens ficam inline e recolhíveis; não usam modal de configuração;
- ambos os perfis mantêm acesso total às operações existentes.

## Critérios de aceite

- [ ] migration aplica desde banco vazio e sobre histórico com backfill estável.
- [ ] pedidos concorrentes recebem números distintos e crescentes.
- [ ] lista, detalhe, busca e dashboard usam `Pedido #n`.
- [ ] UUID deixa de ser identificação visível, mas continua chave técnica da URL.
- [ ] seleção e seções de itens funcionam por teclado e em viewport estreita.
- [ ] erro de um item abre a seção correta e move o foco.
- [ ] orçamento, retorno, upload/download e idempotência não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/contracts/src/manutencao/`;
- `apps/api/src/modules/manutencoes/`;
- `apps/web/app/(sistema)/manutencoes/` e `apps/web/features/manutencoes/`;
- dashboard, relatórios de manutenção, seed e fixtures;
- testes de migration, API, Web e integração real.

## Verificações esperadas

- histórico completo de migrations e `prisma migrate diff --exit-code` em
  PostgreSQL descartável;
- contratos, API e Web: lint, tipos, testes e build;
- concorrência real e backfill com dados legados fictícios;
- Web E2E nos dois perfis, incluindo documentos e retorno parcial;
- axe, teclado, reflow, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.
