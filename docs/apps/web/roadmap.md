# Roadmap da aplicação Web

## Baseline concluído

- [x] Next.js com App Router, TypeScript, ESLint e Vitest configurados.
- [x] Layout raiz, metadata e página inicial neutra.
- [x] Health check próprio e rewrite para a API.
- [x] Clientes HTTP separados para navegador e servidor.
- [x] Erros, timeout, cancelamento e validação de responses padronizados.
- [x] CSP e headers de segurança configurados.
- [x] Instrumentação segura de Web Vitals e operações HTTP.
- [x] Primitives visuais genéricas disponíveis.
- [x] Playwright configurado para o build de produção.
- [x] Testes de home, acessibilidade automatizável e headers de segurança.

## Próximos objetivos

### WEB-AUTH-001 — Integrar login, primeiro acesso e sessão

**Status:** aprovado; depende de `CONTRACTS-009` e `AUTH-004`.

As telas `/login`, `/redefinir-senha` e `/senha-atualizada` já possuem
interface visual baseada no Figma, mas ainda não chamam a API. A entrega deve:

1. criar operações tipadas de login, `/auth/me`, conclusão do primeiro acesso
   e logout;
2. aplicar a matriz de redirects a partir da sessão validada e de
   `trocaSenhaObrigatoria`;
3. concluir a troca com rotação da sessão e continuar por
   `/senha-atualizada` até `/dashboard`;
4. criar `/dashboard` mínima e protegida para os dois perfis;
5. manter `/` pública e transformá-la no catálogo das rotas Web disponíveis e
   suas permissões;
6. verificar o protótipo desktop e mobile, acessibilidade, segurança e E2E.

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

Cada objetivo registra contexto, escopo, estados da interface, contratos e
endpoints afetados, critérios de acessibilidade, segurança, performance e testes.
