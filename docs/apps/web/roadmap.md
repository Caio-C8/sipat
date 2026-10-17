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

Nenhuma entrega de domínio do SIPAT está implementada na Web. As primeiras
entregas seguem o [roadmap inicial](../../roadmap.md):

- **WEB-USERS-001 — Gestão de usuários (planejado):** página `/usuarios`
  exclusiva do administrador, com listagem, filtros, criação, edição, ativação
  e inativação; será construída depois dos contratos e endpoints de
  `USERS-001`;
- **WEB-AUTH-001 — Login, sessão e logout (planejado):** página `/login`,
  consulta da identidade atual, shell protegido, redirects sem loop e ação de
  logout; será construída em `AUTH-001` e tornará a gestão de usuários
  acessível em um ambiente real.

A Web não substitui a autorização da API. Antes de `WEB-AUTH-001`, a gestão de
usuários pode ser validada com mocks estritos e testes controlados, mas não deve
ser apresentada como fluxo operacional concluído.

Cada objetivo registra contexto, escopo, estados da interface, contratos e
endpoints afetados, critérios de acessibilidade, segurança, performance e testes.
