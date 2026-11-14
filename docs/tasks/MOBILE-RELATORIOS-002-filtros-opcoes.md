# MOBILE-RELATORIOS-002 — Filtros e opções de todos os relatórios

**Status:** aprovada em 14/11/2026

## Objetivo

Permitir que os dois perfis configurem filtros válidos para todas as rotas de
relatório existentes, inclusive a seleção do bem da ficha individual, sem
duplicar contratos ou criar endpoints mobile.

## Contexto e referências

- [Objetivo anterior](./MOBILE-RELATORIOS-001-catalogo-navegacao.md).
- [Roadmap mobile](../apps/mobile/roadmap.md#relatorios-patrimoniais-no-mobile).
- [Queries, opções e limites](../../packages/contracts/src/relatorio-patrimonial/queries.ts).
- [Contratos de resposta](../../packages/contracts/src/relatorio-patrimonial/responses.ts).
- [Operações Web existentes como referência de comportamento](../../apps/web/features/relatorios/api/operations.ts).
- Figma somente leitura, página `Telas Mobile`, frame
  [`06-ficha-individual 1` (`278:542`)](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-542&p=f).

## Escopo

- criar a rota autenticada `/relatorios/[tipo]` e validar o parâmetro com
  `TipoRelatorioSchema` antes de buscar dados;
- implementar operações GET para as nove rotas tabulares, ficha, eventos e
  `GET /api/relatorios/opcoes/:catalogo`, usando os schemas públicos atuais;
- compor formulários por tipo a partir de `filtrosRelatorios`,
  `opcoesPorRelatorio` e enums públicos, cobrindo campos obrigatórios e
  opcionais de todas as dez opções;
- implementar seletores paginados e pesquisáveis para patrimônios, setores,
  responsáveis, naturezas, espécies, comissões, fornecedores e inventários;
- tratar datas civis como `YYYY-MM-DD` no boundary, competências como
  `YYYY-MM`, períodos inclusivos e limites de 366 dias ou 12 competências;
- preservar o rascunho dos filtros ao voltar da prévia ou após erro de rede e
  limpar apenas por ação explícita do usuário ou troca do tipo de relatório.

## Fora do escopo

- prévia consolidada, paginação dos resultados e PDF;
- novos catálogos, busca livre fora dos campos aprovados, persistência de
  filtros, favoritos ou histórico de consultas;
- alterações em contratos, API, banco, Web ou regras de relatório.

## Decisões aprovadas

- Todas as dez opções do catálogo são implementadas: `patrimonios`,
  `ficha-bem`, `movimentacoes`, `manutencoes`, `depreciacoes`,
  `pendencias-depreciacao`, `reavaliacoes`, `inventarios`, `emprestimos` e
  `baixas`.
- O fluxo visual dos filtros segue `06-ficha-individual 1`: retorno ao catálogo,
  título/subtítulo, indicador `Filtros → Prévia → Documento`, campos e lista de
  seleção. Os demais tipos reutilizam essa gramática visual com seus campos
  reais; não se inventam dez desenhos independentes.
- Campos obrigatórios, pares de datas, defaults e mensagens vêm dos schemas.
  A UI pode melhorar rótulos e máscaras, mas envia apenas o formato canônico.
- Opções são catálogos remotos paginados com `staleTime` de cinco minutos; a
  consulta de opções cancela a anterior e não possui retry automático.
- IDs e filtros não são persistidos em storage nem incluídos em logs, métricas
  ou nomes de arquivo.

## Critérios de aceite

- [ ] cada tipo publicado abre um formulário correspondente e nenhum tipo cai
      em formulário genérico incompleto;
- [ ] os campos obrigatórios bloqueiam avanço com mensagem junto ao campo e os
      schemas compartilhados validam a query final;
- [ ] todos os oito catálogos de opções suportam loading, vazio, erro, busca,
      paginação e cancelamento sem seleção obsoleta;
- [ ] a ficha exige patrimônio válido e permite filtros opcionais de período,
      evento e busca de eventos;
- [ ] inventários exige `inventarioId`; movimentações, manutenções,
      depreciações, reavaliações e empréstimos respeitam seus períodos e bases;
- [ ] rascunho, seleção e posição de leitura são preservados ao voltar da etapa
      seguinte, sem gravar dados em storage;
- [ ] os dois perfis percorrem exatamente os mesmos formulários e operações.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/(app)/relatorios/[tipo].tsx`;
- `apps/mobile/src/features/relatorios/api/relatorios-operations.ts`;
- `apps/mobile/src/features/relatorios/components/`;
- `apps/mobile/src/features/relatorios/relatorio-form-config.ts`;
- `apps/mobile/src/features/relatorios/relatorio-query-keys.ts`;
- `apps/mobile/src/features/relatorios/use-relatorio-catalogos.ts`;
- `apps/mobile/src/lib/api/api-client.ts`;
- `apps/mobile/src/lib/query/query-policy.ts`, somente se faltar uma política
  já aprovada para dado de referência;
- `packages/contracts/src/relatorio-patrimonial/{queries,responses}.ts`, apenas
  como referência; qualquer edição exige divergência comprovada e nova decisão.

## Verificações esperadas

- testes parametrizados cobrindo as dez configurações e todos os campos
  obrigatórios, enums, datas, competências e queries finais;
- testes HTTP para método, path, query, token, cancelamento, paginação de opções
  e validação de response;
- testes de componente para seleção, erros por campo, preservação do rascunho,
  teclado e propriedades de acessibilidade;
- lint, typecheck, testes e export Android/iOS/Web do mobile;
- conferência visual 390×844 com o frame e matriz manual de teclado, fonte
  ampliada, rotação, tablet e leitores de tela.

## Pendências ou decisões bloqueantes

- Nenhuma. Se uma rota publicada exigir campo ausente nos contratos atuais, o
  implementador deve registrar a divergência e parar antes de alterar API ou
  banco.
