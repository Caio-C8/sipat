# Roadmap da aplicação Web

## WEB-CADASTROS-001 — Integrar cadastros à API existente

**Status:** implementado e validado em 02/11/2026. Processos de compra e notas
fiscais, espécies, naturezas, comissões e integrantes, responsáveis e setores consomem
os contratos existentes, com consultas paginadas, edição, estados de erro e
confirmações sem repetição automática. O cadastro de patrimônio fica fora
desta entrega. A referência visual é a página `Telas PC` do
[Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled).

Por decisão do usuário, a API e suas permissões permanecem inalteradas:
somente o Administrador inclui notas novas na Web, pois o catálogo de
fornecedores é administrativo. O Diretor pode cadastrar processos sem notas
novas e consultar as notas vinculadas. Não são usados seletores de outros
domínios para contornar essa restrição.

Lint, tipos, 89 testes unitários e build standalone da Web passaram. A suíte
E2E padrão passou com 30 cenários aprovados e 13 integrações opt-in ignoradas;
os dois percursos de cadastros foram executados separadamente e passaram contra
API e PostgreSQL isolado, incluindo edição, situações, integrantes, notas,
PDFs, axe e reflow em 390, 900 e 1536px. Os demais 11 cenários reais de outros
domínios não foram executados nesta entrega. A reprodução está em
[Testes e workflow](./testing-and-workflow.md#cadastros-contra-api-e-banco-reais).

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

## WEB-EMPRESTIMOS-002 — Evolução visual

**Status:** implementada e validada localmente em 13/11/2026. A listagem, a
seleção, o cadastro com revisão, o detalhe e a devolução seguem os cinco
quadros inspecionados do Figma, com dados reais e o domínio existente.
[Tarefa e evidências](../../tasks/WEB-EMPRESTIMOS-002-evolucao-visual-figma.md).

## WEB-INVENTARIOS-001 — Consulta e correção de inventários

**Status:** implementado. Administrador e Diretor consultam inventários e
itens; somente o Diretor abre inventários globais e registra correções
pendentes. A conferência móvel e a conclusão dos setores não fazem parte do
escopo Web. Inventários finalizados permanecem somente leitura.

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

**Status:** implementado em 4 de novembro de 2026 sobre a autenticação de
`WEB-AUTH-001`.

Página `/usuarios` exclusiva do administrador, com listagem, filtros, criação,
edição, ativação e inativação. O consumidor Web usa os contratos e endpoints
existentes, encaminha o cookie
nas consultas e envia CSRF nas mutações. Os campos de funcionário e setor
presentes no protótipo visual não fazem parte do contrato persistido de usuário.
O lint, a checagem de tipos, os testes e a validação visual ainda estão pendentes
porque Node.js, pnpm e as dependências não estão disponíveis neste ambiente.

### WEB-FORNECEDORES-001 — Gestão Web de fornecedores

**Status:** implementada em 12 de novembro de 2026; validação visual no Figma
e percurso opt-in contra PostgreSQL descartável pendentes.

Entregar `/cadastros/fornecedores` exclusivamente ao Administrador, integrando
listagem, consulta, criação, alteração, ativação e inativação às cinco rotas e
aos contratos já existentes. Banco, API e contratos permanecem inalterados,
salvo divergência comprovada em relação a RF08/UC08 e decisão posterior.

A implementação deve abrir a página `Telas PC` com `@Figma` e reproduzir com
fidelidade o padrão visual dos cadastros administrativos. A inspeção de 12 de
novembro de 2026 não encontrou um frame específico de fornecedores; por isso,
até existir um, os frames de responsáveis e setores definem o padrão visual e
os contratos de fornecedores definem campos e comportamento.

[Contrato de execução, referência visual e aceite](../../tasks/WEB-FORNECEDORES-001-gestao-fornecedores.md).

### WEB-DEPRECIACOES-001 — Interface de processamento

**Status:** em execução; branch `codex/depreciacao-web`.

Integra a consulta dos bens elegíveis da competência atual e as execuções
individual e em lote para o Diretor de Patrimônio, usando os endpoints e
contratos já existentes. A lista detalhada de bens no valor residual e o
histórico de processamentos ficam fora desta entrega, pois não possuem
consultas correspondentes na API. [Escopo e aceite](../../tasks/WEB-DEPRECIACOES-001-interface-processamento.md).

### WEB-DEPRECIACOES-002 — Disponibilidade, competências e avisos

**Status:** implementada em 8 de novembro de 2026.

Substitui o início livre pela confirmação auditável de disponibilidade nos
detalhes do bem, permite selecionar competências devidas com rótulos como
`Abril de 2026` e expõe pendências na tela de depreciações, no detalhe, em
relatório próprio e na seção de pendências do sino. O alerta é derivado e não
implementa caixa postal, lido/não lido ou canais externos.
[Escopo e aceite](../../tasks/WEB-DEPRECIACOES-002-disponibilidade-competencias-pendencias.md).

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

## WEB-PATRIMONIOS-001 — Pesquisa, detalhe e ações reais

**Status:** implementado em 02/11/2026; E2E Web real e comparação visual
completa com o Figma pendentes.

A prévia estática de patrimônios será substituída por pesquisa e detalhe reais,
histórico e ficha PDF para os dois perfis e pelas quatro ações permitidas ao
Diretor. A execução deve seguir esta ordem:

| Ordem | Objetivo                                                                 | Dependência                        |
| ----- | ------------------------------------------------------------------------ | ---------------------------------- |
| 1     | completar resumo/detalhe, busca de eventos e opções de comissão da baixa | contratos e APIs existentes        |
| 2     | integrar pesquisa paginada e rota individual                             | objetivo 1                         |
| 3     | integrar histórico e relatório do bem                                    | objetivo 2 e relatórios existentes |
| 4     | integrar movimentação, reavaliação, baixa e substituição                 | objetivos 1–3                      |

O implementador deve usar `@Figma`, abrir o arquivo fornecido e inspecionar os
oito frames da página `Telas PC` antes de alterar cada fluxo. Mobile e relatório
HTML não fazem parte desta tarefa. Na tela individual, movimentação e
reavaliação executam um único bem em drawers laterais, sem navegar para as
páginas gerais.
[Contrato de execução, frames e aceite](../../tasks/WEB-PATRIMONIOS-001-pesquisa-detalhe-acoes.md).

## Manutenção de patrimônios

### WEB-MANUTENCOES-001 — Interface simples integrada

**Status:** implementada e verificada com API e PostgreSQL descartável em 29/10/2026.

Lista, criação e detalhe no shell autenticado, com orçamento e retorno por item,
histórico e documentos reais. O percurso Chromium/axe e os limites da verificação
estão na [tarefa](../../tasks/WEB-MANUTENCOES-001-interface-manutencoes.md).

### WEB-MANUTENCOES-002 — Paridade visual com o Figma

**Status:** implementada e verificada em 13/11/2026.

Adequar lista, novo pedido, configuração por bem, detalhe e retorno aos frames
obrigatórios de `Telas PC`. Administrador e Diretor possuem exatamente as mesmas
permissões em todo o gerenciamento de manutenções. A entrega é Web: banco,
contratos e API permanecem inalterados porque RF18, UC18 e a matriz atual já
atendem à regra; qualquer divergência deve ser reproduzida e retornar para nova
decisão antes de ampliar o escopo.

As oito referências vivas foram comparadas em 1920 × 1080 e o percurso real
passou nos dois perfis contra PostgreSQL descartável, incluindo acessibilidade,
responsividade, idempotência, upload parcial, orçamento e retorno por item.
[Roadmap executável, frames e referências por objetivo](../../tasks/WEB-MANUTENCOES-002-paridade-visual-figma.md).

## Reavaliações

### WEB-REAVALIACOES-001 — Consulta e registro integrados

**Status:** implementado e verificado com API e PostgreSQL descartável em 29/10/2026.

Lista e detalhe acessíveis aos dois perfis; seleção, prévia e confirmação pelo
Diretor com a API real. A data de referência é limitada ao mês corrente até
hoje. O percurso Web–API–PostgreSQL, viewport estreita e axe passaram.
[Tarefa](../../tasks/WEB-REAVALIACOES-001-interface-reavaliacoes.md).

### WEB-REAVALIACOES-002 — Paridade visual com o Figma

**Status:** implementada em 13/11/2026; verificação automatizada concluída.

Foram adequados a lista, o fluxo independente de criação e o detalhe lateral
aos frames obrigatórios de `Telas PC`. O drawer iniciado no patrimônio foi
preservado conforme a decisão de execução, pois já estava pronto. Administrador e Diretor
consultam; somente o Diretor recebe ações de prévia e confirmação. A entrega é
Web: banco, contratos e API permanecem inalterados porque a matriz de acesso e
o domínio atuais atendem aos requisitos. O percurso real Web–API–PostgreSQL,
os perfis, os três viewports e axe passaram.
[Roadmap executável, frames e referências por objetivo](../../tasks/WEB-REAVALIACOES-002-paridade-visual-figma.md).

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

### WEB-MOVIMENTACOES-002 — Paridade visual das telas independentes

**Status:** implementado e validado automaticamente em 13/11/2026; homologação
manual com leitor de tela pendente.

Adequar `/movimentacoes` e as três etapas de `/movimentacoes/nova` aos frames
de `Telas PC`, preservando o detalhe independente somente leitura. Administrador
e Diretor continuam consultando; somente o Diretor recebe o fluxo de criação.
Banco, contratos e API permanecem inalterados porque RF13 e a matriz atual já
atendem à regra.

O drawer aberto pelo detalhe patrimonial está concluído e não faz parte desta
entrega. A execução é incremental: lista e autorização visível, seleção de
bens, destinos/dados comuns, revisão/confirmação, detalhe/regressão e comparação
visual nos viewports previstos.

As telas independentes foram alinhadas aos quatro pontos vivos de `Telas PC`,
sem alterar o drawer patrimonial. Lint, tipos, 112 testes unitários, build, sete
E2E Web e cinco E2E reais contra PostgreSQL descartável passaram; a validação
incluiu axe, teclado, zoom a 200% e os viewports previstos.
[Roadmap executável, frames e referências por objetivo](../../tasks/WEB-MOVIMENTACOES-002-paridade-visual-figma.md).

## Baixa

### WEB-BAIXAS-001 — Consulta e registro conforme o Figma

**Status:** aprovada; depende de `BAIXAS-002` para a consulta individual pelo
Administrador.

Implementar `/baixas`, `/baixas/nova` e o detalhe individual no shell
autenticado. Administrador e Diretor consultam os registros; somente o Diretor
vê e acessa o fluxo de registro. A navegação, o título e os textos identificam
a área somente como `Baixa`: `Baixa e estorno`, filtros, estados ou ações de
estorno não devem existir.

O implementador deve abrir o arquivo vivo do Figma e comparar os seis nodes
indicados na tarefa. O Figma é autoridade para a composição visual; requisitos,
contratos e API continuam sendo autoridade para comportamento. Por isso, a
seleção visualmente equivalente aceita exatamente um patrimônio, embora o
protótipo ilustre vários itens. A listagem reutiliza o relatório tabular de
baixas e a criação reutiliza a operação unitária existente; não estão previstos
novo endpoint, contrato, migration ou alteração de banco.

[Tarefa, nodes do Figma, desvios obrigatórios e critérios](../../tasks/WEB-BAIXAS-001-interface-baixas.md).

## WEB-RELATORIOS-001 — Relatórios patrimoniais

**Status:** concluída em 01/11/2026. Nove tipos com prévia/PDF reais, ficha,
seletores e filtros; Chrome integrado ao PostgreSQL isolado nos dois perfis.
[Tarefa, evidências e limitações](../../tasks/WEB-RELATORIOS-001-interface.md).
