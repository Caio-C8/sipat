# Roadmap da aplicação Web

## Baseline concluído

- [x] Next.js com App Router, TypeScript, ESLint e Vitest configurados.
- [x] Layout raiz e metadata.
- [x] Health check próprio e rewrite para a API.
- [x] Clientes HTTP separados para navegador e servidor.
- [x] Erros, timeout, cancelamento e validação de responses padronizados.
- [x] CSP e headers de segurança configurados.
- [x] Instrumentação segura de Web Vitals e operações HTTP.
- [x] Primitives visuais genéricas disponíveis.
- [x] Playwright configurado para o build de produção.
- [x] Testes de home, acessibilidade automatizável e headers de segurança.
- [x] Interface visual da home com dados ilustrativos, sem integração Web–API.

## Próximos objetivos

### WEB-AUTH-001 — Integrar login, primeiro acesso e sessão

**Status:** implementado; comparação visual no Figma e E2E com stack real
permanecem pendentes.

As telas `/login`, `/redefinir-senha` e `/senha-atualizada` usam operações
tipadas e aplicam a matriz de sessão. A entrega implementou:

1. operações tipadas de login, `/auth/me`, conclusão do primeiro acesso
   e logout;
2. a matriz de redirects a partir da sessão validada e de
   `trocaSenhaObrigatoria`;
3. a troca com rotação da sessão e continuação por
   `/senha-atualizada` até `/dashboard`;
4. `/dashboard` protegida para os dois perfis, usando a visão geral ilustrativa
   que antes ocupava `/`;
5. `/` pública como catálogo das rotas Web disponíveis e
   suas permissões;
6. testes unitários e Playwright do fluxo, redirects, acessibilidade e
   segurança.

Especificação aprovada:
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md).

### WEB-USERS-001 — Gestão de usuários

**Status:** planejado; depende de `WEB-AUTH-001`.

Página `/usuarios` exclusiva do administrador, com listagem, filtros, criação,
edição, ativação e inativação. Os contratos e endpoints do backend já estão
implementados, mas ainda não existe consumidor Web.

A Web não substitui a autorização da API. Antes de `WEB-AUTH-001`, a gestão de
usuários poderá ser validada com mocks estritos e testes controlados, mas não
deve ser apresentada como fluxo operacional concluído.

### WEB-SHELL-001 — Padronizar o shell autenticado por perfil

**Status:** implementado em 26 de outubro de 2026.

O grupo `(sistema)` valida a sessão no layout e compartilha sidebar, topbar,
breadcrumb, notificações e menu do usuário. O catálogo tipado filtra a
navegação pelos dois perfis, expõe somente `/dashboard` como link e identifica
as demais opções como não implementadas. Busca, notificações e logout seguem os
estados aprovados sem antecipar endpoints ou páginas.

Especificação aprovada:
[WEB-SHELL-001](../../tasks/WEB-SHELL-001-padronizar-shell-autenticado.md).

### WEB-DASHBOARD-001 — Integrar a visão geral

**Status:** aprovado; depende de `WEB-SHELL-001`.

Consumir a listagem patrimonial existente para os totais gerais e por status,
remover dados ilustrativos e deixar explícitos os blocos que ainda não possuem
endpoint ou rota Web. As ações rápidas permanecem desabilitadas nesta etapa.

Especificação aprovada:
[WEB-DASHBOARD-001](../../tasks/WEB-DASHBOARD-001-integrar-visao-geral.md).

Cada objetivo registra contexto, escopo, estados da interface, contratos e
endpoints afetados, critérios de acessibilidade, segurança, performance e testes.
