# Handoff da aplicação Web

## Estado operacional

A branch `main` contém somente o baseline reutilizável. A Web possui página
inicial, health check, proxy para a API, clientes HTTP, configuração pública,
segurança, observabilidade, primitives visuais e testes de infraestrutura.

Não existem rotas ou dependências de domínio. O exemplo anterior pode ser
consultado em `exemplo-produto-v1.0.0`.

## Antes da primeira feature

1. registre a entrega no [roadmap](./roadmap.md);
2. confirme contratos e endpoints reais;
3. defina acesso, estados, limites e comportamento de erro;
4. escolha bibliotecas adicionais somente quando o fluxo justificar;
5. implemente operação, UI e testes na mesma fronteira verificável;
6. atualize este handoff com o estado efetivamente entregue.

## Verificação do baseline

```bash
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web test
pnpm --filter @repo/web build
pnpm --filter @repo/web test:e2e
pnpm format:check
```
