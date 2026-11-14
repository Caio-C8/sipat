# MOBILE-RELATORIOS-003 — Prévias, ficha e paginação

**Status:** aprovada em 14/11/2026

## Objetivo

Consultar e apresentar no mobile a prévia real de todos os relatórios e a ficha
individual, com resumos, avisos, registros e paginação antes da emissão do PDF.

## Contexto e referências

- [Filtros e opções](./MOBILE-RELATORIOS-002-filtros-opcoes.md).
- [Semântica e limites dos relatórios](../apps/api/relatorios-patrimoniais.md).
- [Schemas das respostas](../../packages/contracts/src/relatorio-patrimonial/responses.ts).
- [Política de cache mobile](../apps/mobile/roadmap.md#cache-de-dados-com-tanstack-query).
- Figma somente leitura, página `Telas Mobile`, frame
  [`07-previa-individual 1` (`278:680`)](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-680&p=f).

## Escopo

- consultar explicitamente a prévia das nove rotas tabulares com página de 20
  itens e a ficha/eventos do patrimônio selecionado;
- apresentar filtros aplicados, resumo específico do tipo, registros,
  metadados, critério temporal, ordenação, avisos e exclusões retornadas;
- paginar sem perder filtros ou misturar respostas de consultas diferentes;
- representar loading inicial, atualização, vazio válido, erro recuperável,
  resposta inválida, limite, indisponibilidade e sessão expirada;
- permitir `Ajustar filtros`, voltar fisicamente e voltar pelo cabeçalho sem
  descartar o rascunho;
- manter a ação `Abrir documento` preparada e disabled enquanto o objetivo de
  PDF não estiver entregue, sem simular download.

## Fora do escopo

- geração, armazenamento ou abertura de PDF;
- ordenação ou agregação calculada no cliente, gráficos, BI, CSV/Excel, edição
  de dados ou mutações patrimoniais;
- cache persistente, prévia offline ou atualização automática de filtros.

## Decisões aprovadas

- A prévia só é executada após confirmação explícita dos filtros. Alterar o
  rascunho invalida visualmente a prévia anterior e exige nova consulta.
- Preview e PDF são consultas independentes; a tela informa que alterações
  posteriores à prévia podem aparecer no documento.
- TanStack Query mantém resultados somente em memória, por sessão, com
  `staleTime` operacional de 30 segundos e `retry: false`. A query key inclui
  tipo, filtros validados e página, nunca token ou rótulos pessoais de UI.
- Resposta anterior é cancelada ou ignorada ao trocar filtros, tipo ou página;
  dado obsoleto não sobrescreve a seleção atual.
- O frame `07-previa-individual 1` é a gramática visual para todas as prévias:
  retorno, etapa, filtros aplicados, cards de resumo, lista de registros e ação
  fixa acima da bottom bar. Conteúdo e quantidade de cards vêm da resposta
  específica de cada tipo.

## Critérios de aceite

- [ ] os nove tabulares apresentam `dados`, `resumo`, `meta` e `consulta`
      validados pelo schema específico; ficha apresenta cadastro e 14 tipos de
      evento paginados;
- [ ] zero registros é sucesso vazio e preserva filtros, avisos e possibilidade
      de gerar PDF vazio;
- [ ] paginação usa metadados reais e impede offset além do limite público;
- [ ] valores decimais permanecem strings no transporte e são formatados no
      cliente sem perda das sete casas ou soma local indevida;
- [ ] `401`, `403`, `422`, `429`, `503`, timeout, offline e response inválida
      possuem mensagens distintas e ação segura;
- [ ] ambos os perfis recebem a mesma prévia e a mesma capacidade de avançar;
- [ ] a composição corresponde ao frame em 390×844 e se adapta à matriz de
      telefone, tablet, orientação, fonte ampliada e Web.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/(app)/relatorios/[tipo].tsx`;
- `apps/mobile/src/features/relatorios/components/`;
- `apps/mobile/src/features/relatorios/api/relatorios-operations.ts`;
- `apps/mobile/src/features/relatorios/use-relatorio-previa.ts`;
- `apps/mobile/src/features/relatorios/relatorio-query-keys.ts`;
- `apps/mobile/src/features/relatorios/relatorio-presentation.ts`;
- `apps/mobile/src/lib/query/remote-query-state.ts`, somente se os estados
  existentes não representarem algum erro público já contratado;
- `apps/web/features/relatorios/{apresentacao.tsx,components/}`, apenas como
  referência de formatação e comportamento, sem importar código Web no mobile.

## Verificações esperadas

- testes parametrizados das nove responses tabulares, ficha e 14 eventos;
- testes de hook para consulta explícita, cancelamento, resposta obsoleta,
  troca de página, invalidação ao editar e isolamento de sessão;
- testes de componente para resumos, vazio, avisos, erros, paginação, voltar,
  foco e ação disabled;
- integração mobile–API–PostgreSQL com fixture de relatórios nos dois perfis,
  incluindo página seguinte, vazio e resposta de erro pública;
- lint, typecheck, testes, export Android/iOS/Web e comparação visual com o
  Figma.

## Pendências ou decisões bloqueantes

- Nenhuma.
