# Handoff da aplicação Web

## Estado operacional

A Web do SIPAT possui uma home visual com dados ilustrativos em `/`, três
interfaces visuais de autenticação, health check, proxy para a API, clientes
HTTP, configuração pública, segurança, observabilidade, primitives visuais e
testes de infraestrutura.

Ainda não existem páginas funcionais de gestão de usuários nem rotas
operacionais do domínio patrimonial. Os contratos e endpoints administrativos
de usuários estão prontos no backend, mas não possuem consumidor Web. Login,
logout e `/auth/me` existem na API, porém os formulários Web ainda não os
consomem e não há sessão produtiva na Web. O fluxo aprovado está em
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md), depende de
`CONTRACTS-009` e `AUTH-004` e prevê um catálogo público em `/` e um dashboard
protegido em `/dashboard`. Essa mudança de rotas ainda não foi implementada.

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
