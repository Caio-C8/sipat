# `WEB-UI-001` — Consolidar a fundação visual e de formulários

**Status:** `implementada e validada em 15/11/2026`

## Objetivo

Criar um kit Web pequeno e consistente para campos, feedback, filtros,
paginação, tabelas e valores, reduzindo duplicação sem produzir componentes
genéricos que conheçam regras de domínio.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Padrões: [componentes e design system](../apps/web/components-and-design-system.md),
  [formulários](../apps/web/forms-and-validation.md) e
  [UX e acessibilidade](../apps/web/responsive-ux-and-accessibility.md).
- Contratos: [convenções](../contracts/conventions.md) e
  [erros](../contracts/errors.md).

## Escopo

- confirmar e completar somente as primitives shadcn realmente consumidas:
  Button, Input, Checkbox, Select, Combobox, Card, Table, Pagination, Dialog,
  Drawer, Field, Alert e Toaster;
- padronizar `Field`, `SelectField` e `ComboboxField` com label, descrição,
  obrigatório, erro, `aria-invalid`, foco e estados de carregamento/vazio;
- usar Select em conjuntos pequenos/fixos e Combobox pesquisável em catálogos
  extensos ou remotos;
- adotar React Hook Form com resolver Zod, se ainda ausente, para os formulários
  migrados; requests continuam fora dos componentes;
- criar resumo de erro geral acima do formulário, persistente e focável; erro
  de campo permanece abaixo do input e move o foco ao primeiro inválido;
- usar toast para sucesso e falha geral não bloqueante; conflito ou erro que
  exija ação também permanece próximo do formulário/diálogo;
- padronizar filtro declarativo somente para filtros simples, tabela por
  composição/colunas da feature, paginação e link/ação de consulta;
- implementar input monetário BRL com até sete casas durante digitação e
  transporte decimal por string; toda exibição monetária usa exatamente sete
  casas;
- implementar input inteiro por texto com `inputMode="numeric"`, sem expoente,
  sinal ou alteração por scroll;
- migrar uma tela cadastral simples como vertical de prova antes de replicar o
  padrão nos objetivos seguintes.

## Fora do escopo

- reescrever todas as telas nesta tarefa;
- criar um `DataTable` ou `DynamicForm` com regras de todos os domínios;
- introduzir cache remoto, estado global ou tema novo;
- alterar contratos de negócio para facilitar a UI.

## Decisões aprovadas

- primitives ficam em `components/ui`, composições em `components/shared` e
  comportamento em `features/<dominio>`;
- páginas de criação usam `Limpar`; modais usam `Cancelar`; edição em página
  usa `Restaurar alterações`;
- sucesso não aparece em caixa verde fixa; erros técnicos nunca chegam ao texto
  do usuário;
- exibição monetária, inclusive relatórios/PDFs, usa `R$ 1.234,5000000`; o
  input manual aceita até sete casas, conforme decisão revisada em 24/11/2026.

## Critérios de aceite

- [x] vertical de prova usa o kit sem perder comportamento ou acessibilidade.
- [x] erro geral recebe scroll/foco e erro de campo foca o primeiro inválido.
- [x] Select e Combobox compartilham aparência, mas preservam semântica distinta.
- [x] teclado, leitores de tela, zoom e viewport estreita permanecem utilizáveis.
- [x] valores não passam por `number` JavaScript e mantêm precisão decimal.
- [x] componentes compartilhados não importam API ou vocabulário de domínio.

## Implementação e evidências

- o kit compartilhado passou a incluir campos, resumo de erros, filtros simples,
  paginação, inputs monetário e inteiro, além das primitives `Card`, `Combobox`
  e `Pagination`;
- o cadastro de naturezas é a vertical de prova com React Hook Form, resolver
  Zod, foco no primeiro erro e operações HTTP mantidas na feature;
- valores decimais são formatados e calculados por strings e `bigint`, sem
  conversão monetária para `number`, inclusive nas telas patrimoniais afetadas;
- `pnpm --filter @repo/web lint`, `typecheck` e a suíte Vitest passaram; a suíte
  contém 32 arquivos e 132 testes;
- o percurso Playwright de cadastros passou com sete cenários em Chromium e
  exercitou o build de produção, axe, movimento reduzido, zoom de 200% e
  viewports de 390, 768 e 1440 pixels;
- a validação E2E usa respostas HTTP simuladas. Não substitui integração com API
  e PostgreSQL reais, homologação manual com leitor de tela nem a CI completa.

## Arquivos ou módulos potencialmente afetados

- `apps/web/components/ui/` e `apps/web/components/shared/`;
- `apps/web/app/globals.css` e tokens existentes;
- `apps/web/lib/format/`, validação e foco de formulário;
- `apps/web/package.json`, lockfile e `components.json`;
- uma feature cadastral simples e seus testes.

## Verificações esperadas

- lint, tipos, testes e build de `@repo/web`;
- testes de componentes para teclado, foco, erro e formatação decimal;
- axe, zoom de 200% e viewports estreita/intermediária/ampla na vertical de prova;
- `git diff --check` e revisão do diff de qualquer primitive gerada.

## Pendências ou decisões bloqueantes

- Nenhuma.
