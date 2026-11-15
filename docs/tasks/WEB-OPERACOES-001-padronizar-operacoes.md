# `WEB-OPERACOES-001` — Padronizar operações patrimoniais

**Status:** `aprovada`

## Objetivo

Aplicar a fundação visual e a matriz de leitura às telas de reavaliações,
depreciações, movimentações, empréstimos e baixas sem alterar seus domínios já
validados.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisitos: RF13–RF17 e RF20 em [requisitos](../requisitos-SIPAT.md).
- Tarefas existentes: [movimentações](./WEB-MOVIMENTACOES-002-paridade-visual-figma.md),
  [reavaliações](./WEB-REAVALIACOES-002-paridade-visual-figma.md),
  [depreciações](./WEB-DEPRECIACOES-002-disponibilidade-competencias-pendencias.md),
  [empréstimos](./WEB-EMPRESTIMOS-002-evolucao-visual-figma.md) e
  [baixas](./WEB-BAIXAS-001-interface-baixas.md).
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md) e
  [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Escopo

Executar de forma incremental, com regressão ao fim de cada domínio:

1. movimentações: reorganizar filtros e migrar lista/detalhe ao kit comum;
2. reavaliações: padronizar filtros, lista, detalhe, prévia e formulários;
3. depreciações: oferecer leitura ao Administrador e esconder processamento;
4. empréstimos: padronizar lista, seleção, confirmação, detalhe e devolução;
5. baixas: padronizar lista, detalhe e registro somente para o Diretor;
6. em todos, aplicar erros, toasts, sete casas monetárias, ações de consulta,
   estados vazios/loading e linguagem não técnica.

## Fora do escopo

- mudar URLs ou criar `/acoes/*`;
- criar edição, exclusão, estorno ou reprocessamento;
- alterar idempotência, datas, comissões, atomicidade ou regras históricas;
- liberar ao Administrador documento comprobatório original de baixa.

## Decisões aprovadas

- Administrador consulta; Diretor executa as mutações patrimoniais;
- relatório e PDF gerado de baixas ficam disponíveis aos dois perfis;
- ações da ficha patrimonial continuam nos drawers definidos em
  `WEB-PATRIMONIOS-002`;
- contratos e API só mudam diante de gap comprovado da matriz aprovada.

## Critérios de aceite

- [ ] cada domínio preserva integralmente seu fluxo funcional e URLs atuais.
- [ ] Administrador acessa leitura de depreciações sem poder processar.
- [ ] filtros são previsíveis, compartilháveis e não perdem paginação.
- [ ] mensagens não expõem API, servidor, stack, tabela ou código interno.
- [ ] idempotência e preservação de formulário continuam cobertas.
- [ ] valores monetários exibem sete casas em todas as cinco áreas.
- [ ] cada etapa possui validação real antes de avançar ao domínio seguinte.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(sistema)/{movimentacoes,reavaliacoes,depreciacao,emprestimos,baixas}/`;
- `apps/web/features/{movimentacoes,reavaliacoes,depreciacoes,emprestimos,baixas}/`;
- operações/contratos somente quando exigidos por `SEC-002`;
- testes unitários, E2E padrão e E2E reais de cada domínio.

## Verificações esperadas

- por domínio: lint, tipos, testes direcionados e E2E real aplicável;
- ao final: suíte Web, build e consumidores de contratos;
- ambos os perfis, idempotência, concorrência e PostgreSQL descartável;
- axe, teclado, zoom e viewports previstos;
- comparação com os frames vivos já usados nas tarefas anteriores quando
  continuarem válidos.

## Pendências ou decisões bloqueantes

- Nenhuma.
