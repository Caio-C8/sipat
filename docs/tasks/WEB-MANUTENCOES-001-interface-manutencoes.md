# WEB-MANUTENCOES-001 — Interface simples de manutenção

**Status:** implementada e verificada com API e PostgreSQL isolados em 29/10/2026.

## Objetivo

Permitir que Administrador e Diretor usem o ciclo aprovado de manutenção pela Web autenticada, com dados da API real.

## Contexto e referências

- [Roadmap Web](../apps/web/roadmap.md)
- [RF18 e UC18](../requisitos-SIPAT.md)
- [Integração Web–API](../integrations/web-api/README.md)
- [CONTRACTS-013](./CONTRACTS-013-contratos-manutencoes.md)
- [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md)

## Escopo

- Lista paginada com filtros, formulário de criação e detalhe com itens, orçamento, retorno, histórico e documentos.
- Operações HTTP tipadas e suporte a `FormData` no cliente central.
- Estados de carregamento, vazio, sucesso, erro e falta de acesso; preenchimento preservado em erro corrigível.

## Fora do escopo

- Reprodução visual do Figma, gráficos, dashboard, wizard, mocks como entrega e novas dependências visuais.

## Decisões aprovadas

- Usar `/manutencoes`, `/manutencoes/nova` e `/manutencoes/[manutencaoId]` no shell existente.
- Todas as ações chamam a API real e atualizam os dados exibidos após sucesso; nenhuma mutação recebe retry automático.
- Upload falho informa se pedido ou retorno principal já foi confirmado.
- A API continua responsável por regras e autorização; a Web mantém acesso por teclado e tela estreita.

## Critérios de aceite

- [x] A interface usa as operações aprovadas e o shell permite os dois perfis; a API confirma as permissões de ambos.
- [x] Listagem, criação, orçamento, retorno, upload e download refletem a API.
- [x] Erros preservam dados corrigíveis e não mostram stack traces ou caminhos internos.
- [x] Controles nativos têm rótulos e estilos de foco; o percurso em Chromium passou em tela estreita e sem violações no axe.

## Arquivos ou módulos potencialmente afetados

- `apps/web/features/manutencoes/`, `apps/web/app/(sistema)/manutencoes/`, cliente HTTP e navegação.

## Verificações esperadas

- Lint, tipos, testes, build, Playwright e percurso Web → API → PostgreSQL isolado; inspeção no navegador.

## Resultado verificado

- `@repo/web`: após a atualização da branch, 48 testes, typecheck, lint e build aprovados.
- Playwright/Chromium com Web `3100`, API `3201` e PostgreSQL descartável `5434`: pedido com dois bens, orçamento, PDF autenticado, retorno parcial e busca na lista. Captura em `apps/web/test-results/manutencoes-real-mobile.png` com largura de 390 px; axe sem violações nesse percurso.
- A inspeção no navegador revelou formulários duplicados após atualização do detalhe; as chaves de renderização foram corrigidas e o mesmo percurso passou novamente.
- O percurso Playwright foi repetido após a atualização da branch e passou com a Web compilada para a API isolada `3201`. O primeiro ensaio usou um build apontado à API local `3001` e recebeu `401` por estar com a sessão do banco isolado; a configuração do build de teste foi corrigida antes da repetição, sem alterar portas no código.
- A Web local `3000` foi reiniciada na porta original. Sem sessão, `/manutencoes` redireciona para `/login`. A aba autenticada do Chrome do usuário foi recarregada e exibiu `Pedidos (1)`, `DEMO-MAN-001` e `0 retornados / 2 pendentes`, sem o alerta de recurso não encontrado. O detalhe abriu com `SP-2` e `SP-3`, ambos em manutenção, e os formulários de orçamento, retorno e PDF disponíveis.

## Limites da verificação

- O percurso visual automatizado usou Diretor de Patrimônio. As permissões do Administrador foram exercitadas por HTTP real, e a tela usa os mesmos componentes para ambos.
- Percurso completo só com teclado, leitor de tela e navegadores além do Chromium não foram testados manualmente.

## Pendências ou decisões bloqueantes

- Nenhuma identificada no planejamento aprovado.
