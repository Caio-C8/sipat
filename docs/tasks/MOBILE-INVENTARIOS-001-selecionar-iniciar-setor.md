# `MOBILE-INVENTARIOS-001` — Selecionar inventário e iniciar setor no mobile

**Status:** `implementada`; integração real com PostgreSQL, comparação da UI
autenticada em 390×844 e validação em dispositivos permanecem pendentes.

## Objetivo

Habilitar o destino `Inventário` do aplicativo para que o Diretor de
Patrimônio selecione um inventário aberto, consulte seus setores e inicie ou
retome a conferência de exatamente um setor, reutilizando os contratos e as
rotas gerais já existentes.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#conferência-de-inventário-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#conferência-de-inventário).
- Requisitos: [RF19 e UC19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Backend e contratos:
  [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md),
  [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md),
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md) e
  [INVENTARIOS-003](./INVENTARIOS-003-consulta-administrador.md).
- Mobile: [rotas](../apps/mobile/routing-and-navigation.md),
  [componentes](../apps/mobile/components-and-design-system.md),
  [responsividade](../apps/mobile/responsive-ux-accessibility.md) e
  [testes](../apps/mobile/testing-and-workflow.md).
- Integração: [mobile–API](../integrations/mobile-api/README.md).
- Figma somente leitura, página `Telas Mobile`:
  [página](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f),
  [Inventário](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-4&p=f)
  e
  [Consulta setor inventário](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-153&p=f).

## Pré-condição visual obrigatória

Antes de editar, o implementador deve abrir os três links do Figma no
navegador, conferir os estados e transições disponíveis e registrar no handoff
os frames comparados. O arquivo é somente leitura e não deve ser editado,
comentado ou reorganizado.

## Escopo

- adicionar rotas finas no grupo `(app)` para a lista de inventários, setores
  do inventário e detalhe do setor, com UUIDs validados antes de qualquer
  request;
- habilitar `Inventário` na bottom bar somente para
  `DIRETOR_PATRIMONIO`; para `ADMINISTRADOR`, manter o destino sem ação mutável
  e comunicar de forma acessível que a conferência é restrita ao Diretor;
- listar inventários com paginação explícita e consultas separadas pelos
  filtros `PENDENTE` e `EM_ANDAMENTO`, sem buscar todas as páginas, simular
  filtro composto ou criar agregado específico para mobile;
- tornar explícito qual inventário foi selecionado antes de listar seus
  setores, suprindo a etapa que não aparece no frame `Inventário`;
- reutilizar `GET /api/inventarios`, `GET /api/inventarios/:inventarioId` e
  `GET /api/inventarios/:inventarioId/setores`, validando integralmente as
  responses de `@repo/contracts`;
- apresentar busca submetida, paginação e estados `PENDENTE`, `EM_ANDAMENTO` e
  `CONCLUIDO`, com progresso derivado da response real;
- em setor `PENDENTE`, confirmar a intenção e chamar uma única vez
  `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/iniciar`;
- em setor `EM_ANDAMENTO`, oferecer `Retomar conferência` sem repetir a
  operação de início;
- em setor `CONCLUIDO`, apresentar resumo somente leitura e não montar controles
  de leitura;
- tratar loading, vazio, timeout, offline/rede, `401`, `403`, `404`, conflitos
  de início concorrente e response inválida; conflito deve refazer a consulta e
  mostrar o setor que permaneceu em andamento quando o contrato permitir;
- manter busca, página e seleção coerentes ao voltar e ao atualizar os dados.

## Fora do escopo

- criar, editar, excluir, cancelar ou finalizar um inventário no mobile;
- permitir ao Administrador iniciar, conferir, corrigir ou concluir setor;
- câmera, leitura de etiqueta, entrada manual e verificação de item;
- carregar todos os itens do setor no detalhe ou fabricar responsável/sala não
  presentes no contrato público;
- cache persistente, operação offline, fila ou sincronização em background;
- endpoint, BFF ou contrato específico para o aplicativo.

## Decisões aprovadas

- O mobile executa conferências, mas não cadastra inventários nem chama
  `POST /api/inventarios/:inventarioId/finalizar`.
- A seleção do inventário antecede a seleção do setor, mesmo que o protótipo
  mostre diretamente a lista de setores.
- Somente o Diretor recebe ações mutáveis. A API continua sendo a barreira de
  autorização e o cliente não simula sucesso para o Administrador.
- Iniciar e retomar são ações diferentes: setor em andamento nunca recebe novo
  `POST .../iniciar`.

## Critérios de aceite

- [x] o implementador registra a inspeção dos frames obrigatórios;
- [x] o Diretor seleciona um inventário aberto, busca/pagina setores e abre o
      detalhe do setor correto;
- [x] setor pendente é iniciado uma única vez e a response atualiza a tela para
      `EM_ANDAMENTO`;
- [x] setor já em andamento é retomado sem nova mutação;
- [x] setor concluído permanece somente leitura;
- [x] o Administrador não recebe controles mutáveis nem dispara requests de
      início, e tentativa forçada continua recebendo `403`;
- [x] concorrência, rede, vazio, paginação e responses inválidas possuem estados
      distinguíveis e acessíveis;
- [x] a bottom bar e o catálogo tipado refletem as novas rotas sem placeholders;
- [x] nenhuma rota de API específica para mobile é criada.

## Arquivos ou módulos potencialmente afetados

- novos arquivos em `apps/mobile/src/app/(app)/inventarios/` para lista,
  detalhe do inventário e detalhe do setor;
- novo `apps/mobile/src/features/inventarios/` com operações, hooks,
  apresentação, componentes e testes;
- `apps/mobile/src/lib/navigation/routes.ts` e testes de completude;
- `apps/mobile/src/components/shared/app-bottom-bar.tsx` e testes por perfil e
  rota;
- `apps/mobile/src/theme/tokens.ts` somente para tokens semânticos reutilizáveis;
- `packages/contracts/src/inventario/` como dependência, sem alteração
  presumida;
- `apps/api/src/modules/inventarios/` apenas como referência do comportamento
  já entregue.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes HTTP de filtros, paginação, params, token, timeout, cancelamento,
  `401`, `403`, `404`, conflito e response inválida;
- testes de navegação e tela para os três estados do setor e os dois perfis;
- integração real com API/PostgreSQL para início e conflito concorrente;
- comparação visual em 390×844 e validação em telefone/tablet, retrato/paisagem,
  fonte ampliada, TalkBack e VoiceOver quando disponíveis;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Handoff da implementação

Em 29 de outubro de 2026, a implementação abriu no navegador integrado a
página `Telas Mobile` (`257:2`), os frames `Inventário` (`280:4`) e
`Consulta setor inventário` (`280:153`) e o protótipo interativo iniciado no
frame `280:121` (etapa 11 de 25). O arquivo permaneceu somente leitura.

Foram entregues as rotas `/inventarios`, `/inventarios/[inventarioId]` e
`/inventarios/[inventarioId]/setores/[setorInventarioId]`; operações validadas
para listagem, detalhe, setores e início; busca submetida; paginação separada
para inventários pendentes e em andamento; filtros de status dos setores;
confirmação e trava contra início duplicado; atualização após conflito; e os
estados pendente, em andamento e concluído. O Administrador não recebe
controles mutáveis, e a bottom bar anuncia a restrição.

Verificações executadas:

- lint e typecheck de `@repo/mobile`;
- 26 suítes e 105 testes de `@repo/mobile`;
- duas suítes e 12 testes do serviço e da integração HTTP de inventários na
  API, incluindo a barreira `403` do Administrador;
- exports Android, iOS e Web com configuração sintética de API; o export Web
  gerou as três novas rotas;
- formatação dos arquivos afetados e `git diff --check`.

Permanecem como validação externa: integração app–API com PostgreSQL real,
comparação da UI autenticada em 390×844, telefone/tablet em retrato e paisagem,
fonte ampliada, TalkBack e VoiceOver. Os testes e exports locais não substituem
essas evidências.
