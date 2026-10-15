# Handoff da aplicação Web

## Estado operacional

A Web do SIPAT possui somente a infraestrutura inicial: página inicial técnica,
health check, proxy para a API, clientes HTTP, configuração pública, segurança,
observabilidade, primitives visuais e testes de infraestrutura.

Ainda não existem rotas ou dependências do domínio patrimonial.

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
