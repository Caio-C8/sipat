# `WEB-DEPRECIACOES-002` — Disponibilidade, competências e avisos na Web

**Status:** implementada em 8 de novembro de 2026

## Objetivo

Permitir confirmar disponibilidade nos detalhes do bem, selecionar competência
de depreciação em formato localizado e tornar pendências visíveis na tela de
depreciações, no detalhe, em relatório próprio e no menu de notificações.

## Contexto e referências

- Dependências implementadas: classificação patrimonial de
  [CONTRACTS-018](./CONTRACTS-018-disponibilidade-competencias-pendencias-depreciacao.md)
  e API/contratos de
  [DEPRECIACOES-002](./DEPRECIACOES-002-disponibilidade-competencias-integridade.md).
- Estado atual: [WEB-DEPRECIACOES-001](./WEB-DEPRECIACOES-001-interface-processamento.md),
  [WEB-PATRIMONIOS-001](./WEB-PATRIMONIOS-001-pesquisa-detalhe-acoes.md) e
  [WEB-RELATORIOS-001](./WEB-RELATORIOS-001-interface.md).
- Integração: [Web–API](../integrations/web-api/README.md).
- UX: [responsividade e acessibilidade](../apps/web/responsive-ux-and-accessibility.md).

## Ordem de execução

1. Confirmar contratos, endpoints, permissões e componentes existentes.
2. Confirmar que o detalhe já consome `Patrimonio.depreciavel` entregue por
   `CONTRACTS-018`.
3. Implementar confirmação de disponibilidade no detalhe do bem.
4. Substituir competência fixa por seletor de competências devidas.
5. Integrar avisos no detalhe, relatório e menu de notificações.
6. Cobrir estados, acessibilidade, erros, atualização de cache/Server Component
   e fluxo real com API.

## Escopo

### Detalhe e disponibilidade

- consumir a classificação do patrimônio, nunca da espécie nem da presença de
  parâmetros;
- no detalhe, exibir estado `Aguardando disponibilidade`, data/autor da
  confirmação ou `Não depreciável`, sem confundir com status patrimonial;
- Administrador e Diretor podem consultar o fato no detalhe, mas somente o
  Diretor recebe a ação `Confirmar disponibilidade para uso`;
- modal/drawer exige data civil, explica “no local e em condição de
  funcionamento”, limita a hoje em `America/Sao_Paulo` e mostra a primeira
  competência calculada antes da confirmação;
- gerar e preservar uma chave idempotente por tentativa; bloquear duplo envio e
  tratar os três conflitos públicos de idempotência;
- após sucesso, atualizar detalhe, histórico e indicadores sem presumir estado
  local que a response não confirmou.
- após concluir uma competência, consultar novamente o catálogo e abrir a
  próxima competência pendente, sem manter na URL uma competência indisponível.

### Competência e pendências

- consultar competências devidas da API e selecionar pela URL, mantendo
  `AAAA-MM` canônico no query param;
- apresentar rótulos localizados como `Abril de 2026`, sem analisar datas por
  timezone implícito do navegador;
- padrão: competência pendente mais antiga; na ausência de atrasos, competência
  corrente quando houver obrigação; estado vazio quando não houver pendência;
- mostrar quantidade pendente por opção e aviso quando outra competência deve
  ser processada antes;
- preservar execução individual e de todos os elegíveis, sem checkbox ou
  subconjunto arbitrário;
- distinguir vazio real, carregamento, falha da lista de competências, falha da
  lista de itens, conflito concorrente, ordem inválida e sucesso;
- no detalhe do patrimônio, mostrar primeira, última e próxima competência e
  link para `/depreciacao?competencia=AAAA-MM` quando houver pendência;
- adicionar relatório `Pendências de depreciação`, separado de `Depreciações`,
  com filtros, paginação, estado vazio e exportação PDF; Administrador e Diretor
  podem consultar o relatório, respeitando o catálogo e os limites da API;
- integrar no sino um alerta derivado com total, competência mais antiga e link
  para a tela; mostrar apenas ao Diretor de Patrimônio;
- substituir “Não implementado” somente na seção de pendências coberta. Últimas
  operações, lido/não lido e notificações de outros domínios permanecem como
  estados não implementados.

## Fora do escopo

- notificações persistentes, preferências, push, e-mail, polling agressivo ou
  badge em tempo real por websocket;
- execução automática, competência futura, fração diária ou seleção de bens em
  lote;
- edição/estorno da disponibilidade;
- redesenho geral do shell, relatórios ou detalhe patrimonial;
- ocultar autorização da API atrás da interface.

## Decisões aprovadas

- O seletor mostra nomes localizados, mas URL e API usam `AAAA-MM`.
- A competência pendente mais antiga é o padrão para reduzir lacunas.
- Relatório de pendências e histórico de depreciações são opções distintas.
- O sino consome resumo derivado e não promete uma central persistente.
- Falha de aviso não bloqueia detalhe ou navegação; falha da revalidação da API
  impede a mutação.

## Critérios de aceite

- [x] detalhe usa `Patrimonio.depreciavel` e não infere classificação;
- [x] Diretor registra disponibilidade uma vez e vê primeira competência;
- [x] Administrador consulta o fato, mas não recebe a ação;
- [x] datas futuras, conflito, sessão expirada, estado incerto e duplo clique
      possuem feedback seguro;
- [x] seletor exibe `Abril de 2026`, preserva `2026-04` na URL e nunca oferece
      mês futuro;
- [x] padrão seleciona a pendência mais antiga e mudança de competência atualiza
      lista, resumo e paginação;
- [x] detalhe, relatório e sino apontam para a mesma semântica de pendência;
- [x] indisponível, não depreciável, sem pendência e erro não são confundidos;
- [x] teclado, foco, axe e viewports estreita/ampla são verificados; a
      homologação manual com leitor de tela permanece fora da automação;
- [x] lint, typecheck, testes, build e o boundary Web–API com mocks estritos
      passam.

## Handoff de implementação

- a confirmação de disponibilidade usa data civil limitada ao dia atual em
  `America/Sao_Paulo`, mostra a primeira competência e revalida o detalhe;
- o seletor consulta o catálogo da API, mantém a competência na URL e comunica
  bloqueio por competência anterior sem criar seleção arbitrária de bens;
- o relatório `Pendências de depreciação` possui filtro mensal opcional,
  paginação, estado vazio e PDF próprios;
- o sino consulta o resumo somente ao abrir e mantém `Últimas operações` como
  não implementado;
- testes unitários cobrem apresentação sem timezone, operações HTTP e
  preservação da tentativa idempotente; Playwright cobre o fluxo principal,
  reflow em 390 px e axe;
- a CI padrão foi reproduzida integralmente; os cenários `*-real.e2e.ts`,
  condicionados a uma infraestrutura descartável própria, permaneceram
  ignorados como previsto. O fluxo desta interface contra API e PostgreSQL
  reais ainda requer execução opt-in.

## Arquivos ou módulos potencialmente afetados

- `apps/web/features/patrimonios/components/patrimonio-detalhe.tsx`;
- `apps/web/features/depreciacoes/` e `apps/web/app/(sistema)/depreciacao/`;
- `apps/web/features/relatorios/` e rota de relatórios;
- `apps/web/components/shared/notifications-menu.tsx`;
- operações, hooks e testes Web correspondentes;
- documentação Web e integração somente após verificação.

## Verificações esperadas

- lint, typecheck, testes e build de `@repo/web`;
- testes de apresentação de competência sem dependência do timezone local;
- testes de idempotência, estados de erro e atualização após mutação;
- fluxo Web–API real com PostgreSQL descartável;
- inspeção visual e de acessibilidade em viewports estreita e ampla;
- Prettier e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma pendência de implementação. Permanecem como homologação a execução
  opt-in Web–API–PostgreSQL real e a avaliação manual com leitor de tela.
