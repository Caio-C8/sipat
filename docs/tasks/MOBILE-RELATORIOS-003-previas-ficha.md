# MOBILE-RELATORIOS-003 — Prévias, ficha e paginação

**Status:** implementada e validada localmente em 14/11/2026; homologação
visual em runtime pendente

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
  metadados úteis dos eventos, avisos e exclusões retornadas, sem expor na
  interface identificadores, referências ou critérios internos da consulta;
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

- [x] os nove tabulares apresentam `dados`, `resumo`, `meta` e `consulta`
      validados pelo schema específico; ficha apresenta cadastro e 14 tipos de
      evento paginados;
- [x] zero registros é sucesso vazio e preserva filtros, avisos e possibilidade
      de gerar PDF vazio;
- [x] paginação usa metadados reais e impede offset além do limite público;
- [x] valores decimais permanecem strings no transporte e são formatados no
      cliente sem perda das sete casas ou soma local indevida;
- [x] `401`, `403`, `422`, `429`, `503`, timeout, offline e response inválida
      possuem mensagens distintas e ação segura;
- [x] ambos os perfis recebem a mesma prévia e a mesma capacidade de avançar;
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

## Handoff da implementação

- O mesmo fluxo `/relatorios/[tipo]` alterna entre filtros e prévia sem criar
  persistência. A confirmação monta uma query key com tipo, filtros validados,
  página e patrimônio da ficha; o `AbortSignal` cancela a chamada quando a key
  muda e o cache operacional permanece em memória por 30 segundos.
- As nove prévias tabulares validam o schema específico. A ficha consulta
  cadastro e eventos em paralelo, apresenta as 14 seções públicas e pagina os
  eventos com os metadados retornados pela API.
- Filtros, resumo, avisos, exclusões, cadastro e campos informativos dos
  registros são exibidos a partir da response. A prévia humaniza enums, datas,
  competências e objetos aninhados, seleciona os mesmos dados funcionais das
  seções do PDF e omite UUIDs, campos terminados em `Id`, referências e
  critérios internos da consulta. Decimais continuam strings e são formatados
  preservando as sete casas; nenhuma soma ou ordenação é refeita no cliente.
- Loading inicial, atualização, vazio válido, limite público, sessão expirada,
  permissão, validação, rate limit, indisponibilidade, timeout, offline e
  response inválida têm estados distintos. `Ajustar filtros`, cabeçalho e botão
  físico voltam ao rascunho; `Abrir documento` permanece desabilitado.
- O frame `07-previa-individual 1` foi reinspecionado em modo somente leitura
  pelo navegador integrado após o conector oficial atingir o limite Starter.
  A composição implementada segue a gramática 390×844 observada, mas ainda não
  foi comparada lado a lado em emulador ou aparelho.
- Validações aprovadas: typecheck; 50 arquivos/248 testes Vitest; ESLint direto
  sem erros (um warning preexistente gerado em `.expo/types/router.d.ts`);
  exports Android, iOS e Web, com 53 rotas estáticas.
- A suíte PostgreSQL isolada de relatórios aprovou 8 de 9 cenários. O cenário
  restante, fora do fluxo mobile, esperava `403` ao consultar uma baixa, mas a
  API tentou serializar a descrição de estresse acima do contrato de 1.000
  caracteres e respondeu `500`. O banco descartável foi removido; o banco de
  desenvolvimento não foi usado.
- O script `expo lint` não concluiu porque o Corepack tentou acessar
  `registry.npmjs.org` e recebeu `ENOTFOUND`; o mesmo ESLint instalado foi
  executado diretamente. CI completa, EAS, emulador, aparelhos físicos,
  tablet, rotação, fonte ampliada, TalkBack e VoiceOver não foram executados.
