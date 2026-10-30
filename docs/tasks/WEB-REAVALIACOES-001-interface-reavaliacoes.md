# WEB-REAVALIACOES-001 — interface de reavaliações

**Status:** implementado e verificado automaticamente em 29/10/2026

## Objetivo

Oferecer consulta, prévia, confirmação e detalhe reais de reavaliação no shell autenticado.

## Contexto e referências

- [RF14 e UC14](../requisitos-SIPAT.md); [REAVALIACOES-001](./REAVALIACOES-001-api-persistencia-reavaliacoes.md); [roadmap Web](../apps/web/roadmap.md).

## Escopo

- `/reavaliacoes` com filtros e paginação, `/reavaliacoes/nova` com seleção, data, comissão, parâmetros por bem e revisão, e `/reavaliacoes/[reavaliacaoId]` com comparação histórica.
- Chamadas à API real, estados de carregamento/erro/sucesso, prevenção de duplo envio, preservação de formulário corrigível, teclado e telas estreitas.

## Fora do escopo

- Reprodução visual do Figma, dashboard, gráficos, wizard complexo e dados simulados.

## Decisões aprovadas

- Somente Diretor cria; Diretor e Administrador consultam.
- A interface distingue bruto, acumulado, líquido, residual e vida útil; quota mensal é identificada como estimativa.
- Para bem sem parâmetro, a tela avisa que ele não deprecia e abre uma caixa de confirmação do primeiro parâmetro com os novos valores e a data de referência.

## Critérios de aceite

- [x] Ações usam operações reais; após sucesso, consulta o registro persistido.
- [x] Filtros, paginação, erros por item e conflito de estado possuem implementação e validação de contratos/API.
- [x] Tabela rolável recebe foco por teclado; viewport de 390 px e auditoria axe passaram no percurso real.

## Verificações esperadas

- Lint, tipos, 48 testes Web, build e um percurso Chromium Web–API–PostgreSQL descartável passaram.
- Zoom manual, leitor de tela e homologação visual em outros navegadores não foram executados.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente.
