# Roadmap da aplicação Web

## WEB-IDEMPOTENCIA-001 — Adaptar conflitos de operações

**Status:** implementado e validado em 31/10/2026; regressão de CI corrigida e
revalidada em 01/11/2026. Movimentações, manutenções, reavaliações e empréstimos
preservam chave e formulário em resultado incerto, distinguem os três conflitos
públicos e mostram o `409` com `OPERACAO_JA_PROCESSADA` como aviso explícito de
que nada foi duplicado, sem novas rotas ou redesign. Em movimentações, uma
falha conclusiva durante a recuperação, como `401`, não descarta a chave quando
o resultado de uma tentativa anterior ainda é incerto. Os quatro percursos
passaram em Chromium contra API e PostgreSQL descartável; após a correção, a
suíte Web local passou com 29 cenários aprovados e 8 integrações reais ignoradas
por falta da infraestrutura descartável nessa execução.
[Tarefa e aceite](../../tasks/WEB-IDEMPOTENCIA-001-adaptar-conflitos-operacoes.md).

## WEB-EMPRESTIMOS-001 — Consulta, saída e devolução

**Status:** implementada e validada em PostgreSQL isolado em 31/10/2026. Interface simples
no shell autenticado, com operações reais, devolução parcial, estados de erro e
permissão. [Tarefa e aceite](../../tasks/WEB-EMPRESTIMOS-001-interface-emprestimos.md).

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
- [x] Dashboard autenticado com totais patrimoniais reais e estados explícitos
      para capacidades ainda não integradas.

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
4. `/dashboard` protegida para os dois perfis, usando a visão geral que antes
   ocupava `/`;
5. `/` pública como catálogo das rotas Web disponíveis e
   suas permissões;
6. testes unitários e Playwright do fluxo, redirects, acessibilidade e
   segurança.

Especificação aprovada:
[WEB-AUTH-001](../../tasks/WEB-AUTH-001-integrar-autenticacao.md).

### WEB-AUTH-002 — Recuperação de senha por e-mail

**Status:** implementado e validado automaticamente em 29 de outubro de 2026;
a integração contra PostgreSQL e SMTP fake e a abertura do esquema em build
nativo permanecem pendentes.

Foram entregues `/esqueci-senha`, `/recuperar-senha` e
`/recuperacao-concluida`, reutilizando os dois endpoints públicos já
implementados. `/redefinir-senha` permanece exclusivo do primeiro acesso
autenticado. O token chega no fragmento do link, é mantido somente em memória e
é removido da barra antes da submissão; o sucesso não cria sessão.

A conclusão oferece `Voltar ao app` por
`sipat://login?origem=recuperacao-senha`, sem dado sensível, e a alternativa
`Ir para o login Web`. As três telas novas não possuem frames explícitos. O
implementador deve abrir `Telas PC` no Figma e derivá-las dos frames `Login`,
`Crie sua nova senha` e `Senha atualizada`, além de comparar os componentes já
implementados.

Contrato de execução e evidências:
[WEB-AUTH-002](../../tasks/WEB-AUTH-002-recuperar-senha.md).

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

**Status:** implementado em 26 de outubro de 2026.

Consumir a listagem patrimonial existente para os totais gerais e por status,
remover dados ilustrativos e deixar explícitos os blocos que ainda não possuem
endpoint ou rota Web. As ações rápidas permanecem desabilitadas nesta etapa.

A entrega usa cinco consultas Server paralelas e limitadas, valida query e
response com `@repo/contracts`, encaminha o cookie no escopo da requisição e
instrumenta `patrimonios.listar` sem filtros de alta cardinalidade.

Especificação aprovada:
[WEB-DASHBOARD-001](../../tasks/WEB-DASHBOARD-001-integrar-visao-geral.md).

Cada objetivo registra contexto, escopo, estados da interface, contratos e
endpoints afetados, critérios de acessibilidade, segurança, performance e testes.

## Manutenção de patrimônios

### WEB-MANUTENCOES-001 — Interface simples integrada

**Status:** implementada e verificada com API e PostgreSQL descartável em 29/10/2026.

Lista, criação e detalhe no shell autenticado, com orçamento e retorno por item,
histórico e documentos reais. O percurso Chromium/axe e os limites da verificação
estão na [tarefa](../../tasks/WEB-MANUTENCOES-001-interface-manutencoes.md).

## Reavaliações

### WEB-REAVALIACOES-001 — Consulta e registro integrados

**Status:** implementado e verificado com API e PostgreSQL descartável em 29/10/2026.

Lista e detalhe acessíveis aos dois perfis; seleção, prévia e confirmação pelo
Diretor com a API real. A data de referência é limitada ao mês corrente até
hoje. O percurso Web–API–PostgreSQL, viewport estreita e axe passaram.
[Tarefa](../../tasks/WEB-REAVALIACOES-001-interface-reavaliacoes.md).

## Movimentações

### WEB-MOVIMENTACOES-000 — Placeholder no shell

**Status:** concluído; verificações registradas na tarefa.

Entrega histórica do placeholder, substituída por WEB-MOVIMENTACOES-001.
[Especificação e evidências](../../tasks/WEB-MOVIMENTACOES-000-placeholder.md).

### WEB-MOVIMENTACOES-001 — Integração de movimentações

**Status:** implementado e validado automaticamente em 28/10/2026; homologação manual com leitor de tela pendente.
Depende de CONTRACTS-012 e MOVIMENTACOES-001 concluídas e verificadas.
[Tarefa, frames Figma e critérios](../../tasks/WEB-MOVIMENTACOES-001-integrar-movimentacoes.md).

Consulta e detalhe individual para diretor e administrador; registro somente
diretor em três etapas, até dez bens, comissão/motivo comuns e destinos
individuais. Sem código TR ou data manual; erros preservam preenchimento,
reenvios recuperam a confirmação anterior e horário usa America/Sao_Paulo.
Lint, tipos, 43 testes unitários, build, 22 E2E padrão e cinco E2E reais passaram.
Comparação visual, acessibilidade e reprodução estão registradas na tarefa.

## WEB-RELATORIOS-001 — Relatórios patrimoniais

**Status:** concluída em 01/11/2026. Nove tipos com prévia/PDF reais, ficha,
seletores e filtros; Chrome integrado ao PostgreSQL isolado nos dois perfis.
[Tarefa, evidências e limitações](../../tasks/WEB-RELATORIOS-001-interface.md).
