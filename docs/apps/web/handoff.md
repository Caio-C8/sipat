# Handoff da aplicação Web

## Estado operacional

A Web do SIPAT possui um catálogo público em `/`, a visão geral protegida e
integrada aos totais patrimoniais em `/dashboard`, shell autenticado
compartilhado e filtrado por perfil, fluxo funcional de login e primeiro
acesso, health check, proxy para a API, clientes HTTP, configuração pública,
segurança, observabilidade, primitives visuais e testes de infraestrutura,
autenticação e dashboard.

A gestão Web de usuários continua pendente. Movimentações possui fluxo operacional integrado. Os contratos e endpoints administrativos
de usuários estão prontos no backend, mas não possuem consumidor Web. Login,
logout, `/auth/me` e conclusão do primeiro acesso são consumidos pela Web com
cookie `HttpOnly`, CSRF e redirects conforme a matriz de
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md). Para a tela de login, a comparação visual direta com Figma e seu E2E real específico continuam como pendências históricas.

`WEB-SHELL-001` está implementado no grupo `(sistema)`. As opções futuras da
sidebar permanecem visíveis somente para os perfis permitidos. Opções sem página
não recebem `href`; busca e feed de notificações continuam explicitamente não implementados.

`/movimentacoes` e `/movimentacoes/[movimentacaoId]` consultam transferências
comuns/correções para ambos os perfis; `/movimentacoes/nova` é exclusivo do
diretor. Seleção de até dez, destinos, comissão/motivo, revisão, conflitos e
recuperação de reenvios consomem API real. Evidências, limites, migrations e
comandos de reprodução e a pendência de homologação manual com leitor de tela estão em
[WEB-MOVIMENTACOES-001](../../tasks/WEB-MOVIMENTACOES-001-integrar-movimentacoes.md).
A suíte real também comprovou cookie/Guards nesse fluxo, sem substituir as
pendências históricas específicas da tela de login.

`/emprestimos`, `/emprestimos/nova` e `/emprestimos/[emprestimoId]` foram
validados com saída agrupada, retorno parcial e conclusão sobre API e banco
isolados, inclusive por Playwright reproduzível. O detalhe permaneceu legível
em 390 px, axe passou e a navegação por Tab até a busca de bens foi verificada. A homologação com leitor de tela continua
pendente. Evidências, migration e comandos de reprodução estão em
[WEB-EMPRESTIMOS-001](../../tasks/WEB-EMPRESTIMOS-001-interface-emprestimos.md).

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
