# `WEB-PATRIMONIOS-002` — Evoluir pesquisa, cadastro e ficha patrimonial

**Status:** `aprovada`

## Objetivo

Aplicar a experiência Web padronizada ao principal fluxo do SIPAT, tornando
pesquisa, cadastro e ações da ficha mais previsíveis sem mudar regras
patrimoniais existentes.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Estado: [WEB-PATRIMONIOS-001](./WEB-PATRIMONIOS-001-pesquisa-detalhe-acoes.md).
- Requisitos: RF10–RF12, RF20 e RNF02 em [requisitos](../requisitos-SIPAT.md).
- Fundações: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md),
  [WEB-SHELL-002](./WEB-SHELL-002-navegacao-estados-globais.md) e
  [SEC-002](./SEC-002-matriz-leitura-compartilhada.md).

## Escopo

1. Pesquisa:
   - expor setor, espécie e natureza como Combobox de seleção única, mantendo
     busca, status e tipo de número na URL;
   - remover aviso azul meramente instrucional;
   - usar paginação, tabela, filtros e ação de consulta compartilhados;
   - aceitar links do dashboard com `setorId` já selecionado.
2. Ficha:
   - abrir registrar baixa e substituir número em drawers equivalentes aos de
     movimentação e reavaliação;
   - preservar histórico, relatório, documentos e permissões existentes;
   - manter `?aba=historico` como destino compartilhável.
3. Cadastro:
   - reorganizar campos e grupos responsivos;
   - trocar espécie, setor e processo por Combobox quando o volume exigir;
   - mostrar natureza derivada da espécie e responsável derivado do setor como
     texto informativo, sem enviá-los no body;
   - obter e mostrar prévia não reservada dos próximos números oficial e `SP-`;
   - informar que o valor definitivo é atribuído na confirmação;
   - usar `Limpar`, com confirmação quando houver alterações;
   - aplicar máscaras, erros e feedback de `WEB-UI-001`.

## Fora do escopo

- permitir cadastro ao Administrador;
- permitir escolha manual de número, natureza ou responsável;
- reservar número durante o preenchimento;
- alterar cálculo, histórico ou regra das ações patrimoniais.

## Decisões aprovadas

- a prévia é informativa; a sequence e a transação continuam autoritativas;
- filtros ficam na URL e sobrevivem a refresh/compartilhamento;
- os quatro drawers pertencem à ficha, enquanto as páginas gerais continuam
  disponíveis;
- valores monetários exibem sete casas e inputs aceitam duas.

## Critérios de aceite

- [ ] filtros combinam, limpam e paginam sem perder estado da URL.
- [ ] Setor, espécie e natureza são pesquisáveis e acessíveis por teclado.
- [ ] Administrador consulta sem receber qualquer mutation patrimonial.
- [ ] drawers preservam foco, fechamento, erro, pending e refresh do detalhe.
- [ ] cadastro não envia campos derivados nem aceita número manual.
- [ ] concorrência pode mudar a prévia sem causar conflito ou número duplicado.
- [ ] histórico e relatório da ficha não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/patrimonio/`;
- `apps/api/src/modules/patrimonios/` para a prévia aditiva;
- `apps/web/app/(sistema)/patrimonios/`;
- `apps/web/features/patrimonios/`;
- componentes compartilhados de filtros, tabela, paginação, drawer e campos;
- testes unitários, Web E2E e API E2E patrimoniais.

## Verificações esperadas

- contratos, API e Web: lint, tipos e testes;
- build Web;
- E2E com ambos os perfis e PostgreSQL descartável;
- concorrência da prévia versus confirmação;
- axe, teclado, zoom e viewports 390/768/1440/1920.

## Pendências ou decisões bloqueantes

- Nenhuma.
