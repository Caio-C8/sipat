# `MOBILE-HOME-002` — Integrar a Home mobile por perfil

**Status:** `aprovada`

## Objetivo

Refazer a Home para corresponder exatamente ao frame `Home` da página `Telas
Mobile` e preenchê-la com dados reais das rotas existentes de setores,
patrimônios e inventários, apresentando conteúdo e ações coerentes com o perfil
autenticado.

## Contexto e referências

- Dependências:
  [MOBILE-UI-001](./MOBILE-UI-001-paridade-figma-shell.md) e
  [INVENTARIOS-003](./INVENTARIOS-003-consulta-administrador.md).
- Estado atual: [MOBILE-HOME-001](./MOBILE-HOME-001-home-check.md).
- Requisitos: [RF04, RF10, RF11, RF19, RF20, RF21 e RNF05](../requisitos-SIPAT.md).
- Integração: [mobile–API](../integrations/mobile-api/README.md).
- Contratos: `packages/contracts/src/patrimonio/`,
  `packages/contracts/src/inventario/` e contratos de setores exportados por
  `@repo/contracts`.
- Referência obrigatória, somente leitura:
  [Figma — frame Home na página Telas Mobile](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=280-882&p=f).

## Escopo

- manter `/` protegida para ambos os perfis e usar a identidade restaurada;
- criar operações mobile tipadas, sobre o cliente HTTP comum, para:
  - `GET /api/setores` quando o perfil for `ADMINISTRADOR`;
  - `GET /api/patrimonios` para ambos os perfis;
  - `GET /api/inventarios` para ambos os perfis após `INVENTARIOS-003`;
- reutilizar paginação e filtros existentes e validar todas as responses com os
  schemas públicos; não espalhar `fetch` pela tela;
- usar `meta.total` para contagens globais quando a listagem já o fornece e os
  agregados de `InventarioResumo.progresso` para estados do inventário;
- compor a Home do Administrador com informações de setores, número de
  patrimônios e acompanhamento somente leitura de inventários pendentes, em
  andamento e finalizados;
- compor a Home do Diretor de Patrimônio majoritariamente com resumo do
  inventário, progresso, última conferência disponível e acesso visual às
  futuras operações patrimoniais;
- modelar loading, refresh, vazio, erro parcial, `401`, `403`, timeout e offline
  sem trocar dado ausente por zero enganoso;
- preservar logout acessível em local compatível com o protótipo e o shell;
- exibir Bens, Inventários, cadastro de bens, relatórios, geração de relatórios
  e ações de conferência conforme o protótipo e o perfil, mas manter disabled
  toda ação cuja página mobile ainda não exista;
- não criar rotas placeholder nem endpoints de dashboard mobile.

## Fora do escopo

- implementar páginas de bens, inventários, cadastro ou relatórios;
- iniciar inventário, conferir setor, ler etiqueta, cadastrar patrimônio ou
  gerar PDF nesta tarefa;
- criar endpoint agregado específico para a Home enquanto as listagens atuais
  atenderem com custo aceitável;
- cache persistente, fila offline ou sincronização em background;
- expor ação patrimonial mutável ao Administrador;
- inventar relatório ou histórico ainda não disponível na API.

## Decisões aprovadas

- o Administrador consulta todos os dados do sistema necessários ao seu papel,
  inclusive bens e inventários, mas não executa operações patrimoniais;
- o Diretor consulta bens e inventários e recebe as ações patrimoniais de seu
  papel somente quando as páginas correspondentes forem implementadas;
- relatórios pertencem a ambos os perfis, mas os controles ficam disabled até
  existirem página, contratos e operação de geração reais;
- a composição visual deve permanecer fiel ao mesmo frame, variando conteúdo e
  ações por perfil sem renderizar cards falsos;
- falha parcial mantém os blocos válidos e oferece nova tentativa para o bloco
  afetado; `401` segue o fluxo de sessão e `403` não vira lista vazia;
- qualquer necessidade comprovada de nova agregação volta ao planejamento de
  API; não se cria rota com semântica “mobile”.

## Critérios de aceite

- [ ] Home dos dois perfis corresponde ao Figma em 390×844 e se adapta às
      demais dimensões;
- [ ] Administrador vê totais reais de setores e patrimônios e acompanha os
      três estados de inventário sem receber ação mutável;
- [ ] Diretor vê dados reais de patrimônios e inventários, com foco em progresso
      e conferência, sem depender da rota administrativa de setores;
- [ ] todas as responses são validadas com `@repo/contracts` antes de alterar a
      UI;
- [ ] nenhum estado de erro ou falta de permissão é apresentado como zero;
- [ ] ações futuras permanecem visíveis, disabled e sem rota placeholder;
- [ ] bottom bar vem do shell `(app)` e indica `Início` como destino atual;
- [ ] testes cobrem os dois perfis, dados, vazio, erro parcial, `401`, `403`,
      timeout, cancelamento e refresh;
- [ ] nenhuma nova rota de API específica para mobile é criada.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/features/home/home-screen.tsx` e seu teste;
- novos `apps/mobile/src/features/home/api/` e testes;
- novos componentes internos de `apps/mobile/src/features/home/`;
- `apps/mobile/src/lib/api/api-client.ts` somente se leitura de query exigir
  extensão genérica compatível, como suporte a query string;
- `apps/mobile/src/lib/navigation/routes.ts` apenas para refletir rotas reais,
  nunca placeholders;
- `apps/mobile/src/app/(app)/index.tsx` como composição fina;
- shell, tokens e bottom bar entregues por `MOBILE-UI-001`;
- contratos públicos de setores, patrimônios e inventários como dependências de
  leitura, não como alvo presumido de mudança.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes das operações HTTP para URL, query, token, response inválida, timeout e
  cancelamento;
- integração contra API real para Administrador e Diretor, incluindo `401` e
  `403` esperados;
- inspeção visual comparativa com o frame `Home` e estados de dados reais;
- telefone/tablet, retrato/paisagem, Web, fonte ampliada e leitores de tela;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- A página e a operação de relatórios ainda não existem; permanecem visíveis e
  disabled, sem simulação de geração.
