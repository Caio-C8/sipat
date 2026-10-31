# WEB-EMPRESTIMOS-001 — Interface simples de empréstimos

**Status:** implementada e validada em navegador com banco isolado (31/10/2026)

## Objetivo

Permitir consulta, saída e devolução parcial pela API real no shell autenticado.

## Contexto e referências

- [RF16/UC16 e decisões](../requisitos-SIPAT.md)
- [API](./EMPRESTIMOS-001-api-persistencia-emprestimos.md)
- [Roadmap Web](../apps/web/roadmap.md)
- [Integração Web–API](../integrations/web-api/README.md)

## Escopo

- Lista com filtros, criação com escolha explícita de modo, detalhe e seleção dos bens recebidos.
- Operações e hooks tipados, estados de carregamento/erro/vazio/sucesso/permissão, preservação de dados corrigíveis e prevenção de duplo envio.

## Fora do escopo

- Cópia visual do Figma, gráficos, wizard, mocks como entrega, renovação, estorno ou termos.

## Decisões aprovadas

- Ambos os perfis consultam; somente Diretor vê e usa escrita. A API aplica a permissão definitiva.
- Chave de idempotência é mantida no reenvio após falha incerta; não há retry automático.

## Critérios de aceite

- [x] Páginas `/emprestimos`, `/emprestimos/nova` e `/emprestimos/[emprestimoId]` consomem a API real.
- [x] Fluxo Web → API → PostgreSQL isolado cobre saída, devolução parcial e conclusão.
- [x] Rótulos/foco, navegação por Tab e viewport de 390 px verificados; axe sem violações no E2E real.

## Arquivos ou módulos potencialmente afetados

- `apps/web/features/emprestimos/`, `apps/web/app/(sistema)/emprestimos/`, navegação.

## Verificações esperadas

- Lint, tipos, testes Web, build, navegador e E2E integrado.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente identificada no plano aprovado.

## Evidências de execução

- Chromium no navegador: saída agrupada de dois bens sintéticos, detalhe com ambos pendentes, devolução parcial com um pendente, última devolução e detalhe concluído. Conferência SQL confirmou as duas devoluções e status `ATIVO`.
- Busca/paginação de bens e comissões, filtros e estados usam as seis rotas reais. Não há retry automático de mutação; a chave é mantida após falha corrigível.
- Web: 50 testes, lint, typecheck e build aprovados; as três rotas constam do build de produção. Inspeção em tela de 390 px concluiu sem corte horizontal no detalhe.
- Após acrescentar o link de Empréstimos à barra lateral, o E2E de autenticação passou a esperar cinco links e a conferir o destino `/emprestimos` para Diretor e Administrador. A suíte Web E2E padrão passou com 26 testes e 8 pulados; uma expectativa de consulta opcional no mock antigo de movimentações foi ajustada para eliminar uma falha intermitente observada nesta execução.
- No ambiente local, `pnpm security:patches`, `pnpm format:check`, `pnpm check`, `pnpm build`, a construção da imagem mobile Web de CI e seu health check passaram. Essas verificações locais não constituem execução no GitHub Actions.
- Playwright real (`playwright.emprestimos-real.config.ts`): 1 teste Chromium aprovado com Web → API → PostgreSQL; grupo de 2, devolução parcial, conclusão, recarga do histórico, axe e largura de 390 px. Consulta SQL posterior: 2 bens `ATIVO`, 2 devoluções e 1 grupo.
- Homologação manual com leitor de tela permanece pendente; a inspeção automatizada não a substitui.
- Em 31/10/2026, após autorização específica, as migrations de localizações posteriores ao inventário e RF16 foram aplicadas ao banco local de desenvolvimento `sipat` em `localhost:5433` com `prisma migrate deploy`: 22 → 24 migrations aplicadas. As imagens de migration, API e Web foram reconstruídas; API e Web responderam HTTP 200 nos health checks. Nenhum reset ou exclusão foi executado.
- No Chrome em `localhost:3000`, a conta Diretor abriu Empréstimos pela sidebar, registrou saída em grupo dos bens de demonstração SP-1 e SP-4 para destinatário fictício, devolveu SP-1, observou SP-4 pendente, devolveu SP-4 e recarregou o detalhe concluído. Os filtros mostraram zero em andamento e um concluído. Consulta SQL do grupo `222865e5-8398-4637-bdec-2d75e5600314` confirmou duas devoluções, ambos os bens `ATIVO` e setores cadastrais preservados. O histórico de teste permanece no banco de desenvolvimento.

Para reproduzir o E2E, iniciar PostgreSQL descartável em `127.0.0.1:55416/sipat_rf16`, aplicar as migrations nele, compilar API e Web com `API_INTERNAL_URL=http://127.0.0.1:3202`, definir `EMPRESTIMOS_INTEGRATION_DATABASE_URL` para esse banco e executar `pnpm --filter @repo/web exec playwright test --config playwright.emprestimos-real.config.ts`. O teste cria apenas dados sintéticos e recusa outros endereços de banco.

## Roteiro manual

1. Para repetir operações sem afetar o histórico local de demonstração, escolher um banco PostgreSQL **de teste** e confirmar o `DATABASE_URL` antes de aplicar `pnpm --filter @repo/database db:migrate:deploy`. O banco local de desenvolvimento já recebeu as duas migrations autorizadas.
2. Iniciar API e Web com as variáveis normais de desenvolvimento do repositório (`pnpm dev:api` e `pnpm dev:web` em terminais separados; `API_INTERNAL_URL` da Web deve apontar para a API escolhida). Usar conta de Diretor e bens sintéticos `ATIVO` no banco escolhido.
3. Abrir `/emprestimos/nova`, selecionar dois bens, comissão vigente e modo **Em grupo**; registrar saída. Consultar o resultado em `/emprestimos` e no detalhe.
4. No detalhe, devolver um bem e conferir **1 pendente**; devolver o outro e conferir **Concluído**. Recarregar a página e conferir o histórico. A busca por número/descrição, as comissões paginadas e os filtros da lista podem ser testados sem criar novas operações.
5. Repetir com **Separadamente**; cada bem deverá gerar sua própria linha. Verificar também que o Administrador consulta, mas não registra nem devolve.
