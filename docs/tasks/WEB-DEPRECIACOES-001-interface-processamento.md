# `WEB-DEPRECIACOES-001` — Processamento de depreciações na Web

**Status:** em execução.

## Objetivo

Disponibilizar ao Diretor de Patrimônio a consulta dos bens elegíveis na
competência corrente e a execução real da depreciação individual ou em lote.

## Contexto e referências

- API e regras de negócio: [DEPRECIACOES-001](./DEPRECIACOES-001-consultar-executar-depreciacoes.md).
- Estado Web: [roadmap](../apps/web/roadmap.md).
- Integração: [Web–API](../integrations/web-api/README.md).
- UX e acessibilidade: [responsividade e acessibilidade](../apps/web/responsive-ux-and-accessibility.md).

## Escopo

- rota autenticada `/depreciacao`, exclusiva ao perfil Diretor de Patrimônio;
- consulta paginada da competência civil corrente e exibição de quota prevista
  por patrimônio, total de elegíveis e quantidade já no valor residual;
- seleção obrigatória de comissão vigente;
- execução individual e em lote com confirmação explícita, CSRF, estados de
  pending, sucesso e erro;
- exibição dos agregados retornados após o processamento em lote e atualização
  da consulta após sucesso.

## Fora do escopo

- listagem individual dos patrimônios já no valor residual;
- histórico de processamentos e detalhes de cálculos históricos;
- alteração de parâmetros ou reavaliação; a tela apenas oferece acesso à rota
  de reavaliações existente;
- seleção de subconjunto no processamento em lote. A API revalida e processa
  todos os bens elegíveis no instante da confirmação.

## Decisões aprovadas

- A competência não é editável: a API aceita apenas o mês civil corrente do
  servidor.
- A API é a autoridade para elegibilidade, cálculo e autorização.
- Uma comissão vigente é obrigatória em cada execução.
- A consulta de pendentes não inclui bens já no residual; mostra somente sua
  contagem agregada.
- O contrato de pendências não fornece setor do patrimônio; a interface não
  apresenta setor sem uma fonte de dados aprovada.
- Ausência de uma consulta de histórico na API não será suprida com dados
  simulados.
- Em timeout ou falha de rede, a Web não repete a mutação automaticamente e
  orienta atualizar a consulta antes de tentar novamente.

## Critérios de aceite

- [ ] somente Diretor acessa a rota; autenticação e autorização da API seguem
      obrigatórias;
- [ ] competência corrente é formada no fuso institucional e enviada em
      `AAAA-MM`;
- [ ] tabela mostra estado contábil e quota retornados pela API sem recalcular
      regras no navegador;
- [ ] processamento individual envia patrimônio, competência, comissão e
      confirmação do valor residual;
- [ ] processamento em lote confirma que a API atuará sobre todos os elegíveis;
- [ ] resultados, erros de concorrência e estado incerto são comunicados;
- [ ] responsividade, teclado, foco e estados de carregamento são verificados.

## Verificações esperadas

- lint, typecheck e testes relevantes de `@repo/web`;
- teste do fluxo Web–API com backend controlado e inspeção visual em viewport
  estreita e ampla;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- As dependências Node/pnpm devem estar disponíveis para executar as
  verificações automatizadas.
