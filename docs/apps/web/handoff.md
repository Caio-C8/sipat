# Handoff da aplicação Web

## Estado operacional

A Web do SIPAT possui um catálogo público em `/`, a visão geral ilustrativa e
protegida em `/dashboard`, fluxo funcional de login e primeiro acesso, health
check, proxy para a API, clientes HTTP, configuração pública, segurança,
observabilidade, primitives visuais e testes de infraestrutura e autenticação.

Ainda não existem páginas funcionais de gestão de usuários nem rotas
operacionais do domínio patrimonial. Os contratos e endpoints administrativos
de usuários estão prontos no backend, mas não possuem consumidor Web. Login,
logout, `/auth/me` e conclusão do primeiro acesso são consumidos pela Web com
cookie `HttpOnly`, CSRF e redirects conforme a matriz de
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md). A comparação
visual direta com o Figma e o E2E adicional contra uma stack real provisionada
permanecem pendentes.

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
