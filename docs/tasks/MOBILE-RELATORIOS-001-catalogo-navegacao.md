# MOBILE-RELATORIOS-001 — Catálogo e navegação de relatórios

**Status:** concluída e homologada no emulador em 14/11/2026

## Objetivo

Habilitar a entrada autenticada de Relatórios no mobile para
`ADMINISTRADOR` e `DIRETOR_PATRIMONIO`, com catálogo real das dez opções
publicadas pela API e composição visual fiel ao frame mobile principal.

## Contexto e referências

- [Roadmap mobile](../apps/mobile/roadmap.md#relatorios-patrimoniais-no-mobile).
- [RF20/RF21 e UC20/UC21](../requisitos-SIPAT.md).
- [Semântica, rotas e limites já implementados](../apps/api/relatorios-patrimoniais.md).
- [Integração mobile–API](../integrations/mobile-api/README.md).
- Figma somente leitura, página `Telas Mobile`, frame
  [`01-relatorios 1` (`278:1022`)](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1022&p=f).

## Escopo

- adicionar `/relatorios` ao catálogo tipado e ao grupo autenticado `(app)`;
- habilitar `Relatórios` na bottom bar para os dois perfis e preservar seu
  estado ativo em toda a árvore `/relatorios/*`;
- tornar a ação de relatórios da Home navegável para os dois perfis;
- consultar `GET /api/relatorios` pelo cliente mobile autenticado, validar a
  resposta com `CatalogoRelatoriosResponseSchema` e apresentar loading, erro,
  indisponibilidade e nova tentativa;
- renderizar somente opções recebidas no catálogo, respeitando `disponivel`,
  `motivo`, `previa` e `pdf`, sem inventar capacidade local;
- criar a base visual da feature com tokens semânticos próprios apenas quando
  não houver token compartilhado equivalente.

## Fora do escopo

- filtros, opções paginadas, prévias, ficha e download de PDF, entregues nos
  objetivos seguintes;
- alteração de contratos, controllers, services, repository, Prisma,
  migrations ou seed;
- rota exclusiva para um perfil, mock, catálogo duplicado ou lista fixa que
  esconda uma rota publicada.

## Decisões aprovadas

- Administrador e Diretor possuem exatamente a mesma capacidade de consultar
  e gerar relatórios; a interface não cria variação por perfil.
- O Figma é autoridade visual; os contratos e a API são autoridade de dados e
  comportamento. O texto `9 modelos` do frame está defasado: o schema exige dez
  opções, nove tabulares e `ficha-bem`. A tela deve exibir a contagem real do
  catálogo e um card para cada opção disponível, preservando composição,
  hierarquia, cores, tipografia, espaçamento e navegação do protótipo.
- O catálogo é dado de referência com `staleTime` de cinco minutos, cache
  somente em memória e isolamento por sessão. Não há persistência ou offline.
- A API continua sendo a barreira definitiva de autorização; a navegação não
  substitui `@PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")`.

## Critérios de aceite

- [x] ambos os perfis autenticados abrem `/relatorios`; anônimo segue o gate
      existente e nenhum perfil recebe controles exclusivos;
- [x] bottom bar, Home e catálogo de rotas apontam para a rota real, sem estado
      disabled ou placeholder;
- [x] a tela deriva título, disponibilidade e quantidade das dez entradas
      validadas do catálogo da API;
- [x] loading, erro recuperável, `401`, `403` e opção indisponível possuem
      feedback acessível e não desmontam a navegação;
- [x] em 390×844 a tela é visualmente equivalente ao frame `01-relatorios 1`,
      exceto pela contagem e pelo card adicionais exigidos pelo catálogo atual;
- [x] telefone, tablet, retrato, paisagem e Web reorganizam o conteúdo sem
      simular uma viewport fixa de telefone.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/app/(app)/relatorios/index.tsx`;
- `apps/mobile/src/features/relatorios/`;
- `apps/mobile/src/components/shared/app-bottom-bar.tsx` e testes;
- `apps/mobile/src/features/home/home-screen.tsx` e testes;
- `apps/mobile/src/lib/navigation/routes.ts` e testes;
- `apps/mobile/src/lib/api/api-client.ts`;
- `apps/mobile/src/theme/tokens.ts`;
- `apps/mobile/src/app/(app)/_layout.tsx`, somente se a árvore da rota exigir
  composição adicional sem alterar o shell comum.

## Verificações esperadas

- testes unitários da operação de catálogo, query key, estados da tela, Home,
  bottom bar e completude das rotas;
- lint, typecheck, testes e export Android/iOS/Web do package mobile;
- comparação visual direta com o frame 390×844 e inspeção responsiva nas
  larguras previstas na documentação mobile;
- integração real com `GET /api/relatorios` nos dois perfis, comprovando `401`
  sem sessão e sucesso equivalente para Administrador e Diretor.

## Pendências ou decisões bloqueantes

- Nenhuma. Divergência futura no catálogo, autorização ou disponibilidade deve
  retornar ao planejamento antes de qualquer mudança na API ou no banco.

## Handoff da implementação

- A rota, operação HTTP, query key, cache de referência, estados da tela, Home,
  bottom bar e catálogo tipado foram implementados sem alterar contratos, API
  ou persistência.
- Testes do package mobile: 45 arquivos e 202 testes aprovados; lint e
  typecheck aprovados. Exports Android e iOS concluídos. O bundle e as 31 rotas
  estáticas Web foram gerados, mas a persistência final falhou com `EPERM` do
  Windows ao criar diretórios de rotas; tentativas em três diretórios e com um
  worker reproduziram a falha.
- O frame `01-relatorios 1` foi reinspecionado no conector oficial somente
  leitura.
- A homologação manual no emulador foi concluída pelo responsável em
  14/11/2026, com evidências visuais do início e do fim do catálogo: os dez
  modelos foram apresentados, a rolagem preservou o shell e a bottom bar, e os
  cards permaneceram informativos, sem antecipar filtros, prévias ou PDF das
  tarefas seguintes.
- Com a homologação no emulador e as verificações automatizadas registradas
  acima, `MOBILE-RELATORIOS-001` está completamente finalizada. Validações
  futuras de leitores de tela, fonte ampliada ou aparelhos físicos pertencem à
  validação geral do aplicativo e não bloqueiam esta entrega.
