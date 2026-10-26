# Handoff da aplicação Web

## Estado operacional

A Web do SIPAT possui um catálogo público em `/`, a visão geral protegida e
integrada aos totais patrimoniais em `/dashboard`, shell autenticado
compartilhado e filtrado por perfil, fluxo funcional de login e primeiro
acesso, health check, proxy para a API, clientes HTTP, configuração pública,
segurança, observabilidade, primitives visuais e testes de infraestrutura,
autenticação e dashboard.

Ainda não existem páginas funcionais de gestão de usuários nem rotas
operacionais do domínio patrimonial. Os contratos e endpoints administrativos
de usuários estão prontos no backend, mas não possuem consumidor Web. Login,
logout, `/auth/me` e conclusão do primeiro acesso são consumidos pela Web com
cookie `HttpOnly`, CSRF e redirects conforme a matriz de
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md). A comparação
visual direta com o Figma e o E2E adicional contra uma stack real provisionada
permanecem pendentes.

`WEB-SHELL-001` está implementado no grupo `(sistema)`. As opções futuras da
sidebar permanecem visíveis somente para os perfis permitidos, mas não recebem
`href`; busca e feed de notificações continuam explicitamente não implementados.

`WEB-DASHBOARD-001` está implementado como Server Component. Cinco consultas
finitas e paralelas a `GET /patrimonios`, sempre com `pagina=1` e `limite=1`,
alimentam o total geral e os quatro status. Pendências, setores e atividades
permanecem explicitamente sem integração; ações rápidas continuam
desabilitadas.

## Antes da primeira feature

1. registre a entrega no [roadmap](./roadmap.md);
2. confirme contratos e endpoints reais;
3. defina acesso, estados, limites e comportamento de erro;
4. escolha bibliotecas adicionais somente quando o fluxo justificar;
5. implemente operação, UI e testes na mesma fronteira verificável;
6. atualize este handoff com o estado efetivamente entregue.

## Verificação da infraestrutura atual

```bash
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web test
pnpm --filter @repo/web build
pnpm --filter @repo/web test:e2e
pnpm format:check
```
