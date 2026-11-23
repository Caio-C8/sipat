# Desenvolvimento da aplicação Web

Este diretório documenta o padrão de desenvolvimento de `apps/web`.

## Objetivo

A aplicação usa Next.js com App Router. As páginas e features do SIPAT serão
adicionadas conforme entregas concretas dos requisitos, preservando as
fronteiras entre UI, contratos e integração HTTP.

## Estado atual

- `/processos-compra`, `/fornecedores`, `/setores`, `/responsaveis`,
  `/comissoes`, `/naturezas` e `/especies` possuem listas e detalhes
  independentes. Criação e edição usam URLs canônicas e são interceptadas em
  modal quando iniciadas pela lista; acesso direto ou refresh preserva a página
  completa. Os seis catálogos administrativos são consultáveis pelos dois
  perfis e mutáveis somente pelo Administrador. Processos de compra permanecem
  disponíveis aos dois perfis. Todos consomem a API existente: consultas
  paginadas, criação, edição, situação, integrantes e documentos fiscais.
  A criação e a edição de processos, notas fiscais e anexos ficam disponíveis
  ao Administrador e ao Diretor de Patrimônio, em alinhamento com os Guards da
  API e com a evolução registrada em `WEB-CADASTROS-002`.
  O cadastro de patrimônio não faz parte dessa integração.

- `/` decide no servidor entre `/login`, `/redefinir-senha` e `/dashboard`
  conforme ausência de sessão, primeiro acesso ou sessão comum;
- `/dashboard` apresenta a visão geral autenticada com totais patrimoniais
  reais, obtidos da metadata de `GET /patrimonios`, e estados explícitos para
  blocos ainda sem integração;
- `/patrimonios/novo` carrega espécies, setores ativos, processos de compra e a
  prévia não reservada dos dois tipos de numeração. Número, natureza e
  responsável são informações automáticas fora de inputs; o residual é
  informado explicitamente em reais ou percentual. O cadastro registra o bem
  por `POST /patrimonios` com validação e idempotência;
- `/configuracoes` exibe a identidade autenticada; a aba de usuários permanece
  indisponível. `/configuracoes/alterar-senha` consome o `AUTH-002`, encerra as
  sessões no backend e orienta um novo login;
- `/patrimonios` oferece pesquisa com filtros relacionais pesquisáveis e
  compartilháveis pela URL; o detalhe organiza todos os atributos, usa filtros
  e paginação compartilhados no histórico e mantém as quatro ações em drawers.
  Ações incompatíveis com perfil, status, numeração ou classificação continuam
  visíveis e desativadas com explicação; a substituição mostra prévia não
  reservada do próximo número oficial. Pesquisa, cadastro, ficha e drawers usam
  as primitives e os tokens do design system, com campos semânticos, erros
  persistentes e foco acessível padronizado;
- `/movimentacoes` e seu detalhe consultam transferências reais para os dois
  perfis; `/movimentacoes/nova` registra de 1 a 10 transferências somente pelo
  diretor. Lista, filtros e paginação usam o kit visual compartilhado;
- `/manutencoes`, `/manutencoes/nova` e o detalhe permitem aos dois perfis
  consultar, criar, revisar orçamento, registrar retorno e anexar/abrir PDFs
  pela API real; a API mantém cobertura de integração com PostgreSQL isolado em
  seus testes de manutenção;
- `/reavaliacoes`, `/reavaliacoes/nova` e o detalhe oferecem consultas,
  prévia e confirmação na API real; a Web cobre os perfis com a fronteira HTTP
  simulada e a API mantém cobertura própria com PostgreSQL isolado.
  A evolução visual entregue em
  [WEB-REAVALIACOES-002](../../tasks/WEB-REAVALIACOES-002-paridade-visual-figma.md)
  reproduz na tela independente a lista, a criação em etapas e o detalhe
  em página completa no padrão de movimentações, sem alterar o domínio
  existente;
- `/depreciacoes` lista todos os registros processados para os dois perfis por
  padrão e permite filtrar por uma competência exata opcional; o Diretor acessa
  `Processar depreciações`, que abre `/depreciacao`. A tela de
  processamento seleciona pela URL as competências devidas, prioriza a mais
  antiga e permite ao Diretor executar depreciações individuais ou em lote;
  o Administrador mantém somente a leitura das pendências;
- `/inventarios` permite a Administrador e Diretor consultar e filtrar
  inventários; o Diretor pode criar e editar inventários pendentes em modais
  roteáveis, resolver divergências e finalizar com confirmação explícita.
  A conferência de bens e setores permanece no aplicativo móvel; inventário
  finalizado é somente leitura na Web;
- o detalhe patrimonial confirma e exibe a disponibilidade para uso, resume
  primeira, última e próxima competência e liga para a pendência; o relatório
  de pendências preserva essa semântica sem criar central de notificações;
- `/emprestimos`, `/emprestimos/nova` e o detalhe oferecem consulta, saída e
  devolução parcial na API real; a Web cobre lista, detalhe e criação com a
  fronteira HTTP simulada e a API mantém cobertura própria com PostgreSQL.
  A evolução visual de seleção, revisão, detalhe e devolução está em
  [WEB-EMPRESTIMOS-002](../../tasks/WEB-EMPRESTIMOS-002-evolucao-visual-figma.md).
  A consulta usa um filtro de situação para todos, em andamento ou finalizados,
  sem abas; a API deriva a conclusão da existência de itens ainda sem devolução.
  Filtros, campos, seleção, tabelas e paginação usam o kit visual compartilhado;
- `/baixas`, `/baixas/nova` e o detalhe oferecem consulta aos dois perfis e
  registro unitário somente ao Diretor. O bem é escolhido por combobox
  pesquisável no próprio formulário; após sucesso, a Web confirma por toast e
  volta à listagem. O PDF comprobatório original permanece restrito ao Diretor.
  Filtros, formulário, tabela e paginação usam o kit visual compartilhado;
- movimentações, manutenções, reavaliações e empréstimos distinguem os três
  conflitos públicos de idempotência, preservam a chave somente enquanto o
  resultado permanece incerto e nunca fazem retry automático. Em movimentações,
  uma falha conclusiva durante a recuperação não apaga a chave quando uma
  tentativa anterior ainda tem resultado incerto; ver
  [WEB-IDEMPOTENCIA-001](../../tasks/WEB-IDEMPOTENCIA-001-adaptar-conflitos-operacoes.md);
- `/api/health` verifica o processo Web;
- `/api/backend/:path*` encaminha chamadas para a API por
  `API_INTERNAL_URL`;
- clientes HTTP centrais separam navegador e servidor;
- o cliente comum trata JSON, timeout, cancelamento, `204 No Content`, contrato
  de erro e validação de response;
- a aplicação configura CSP, headers de segurança e remove o header de
  tecnologia;
- Core Web Vitals e operações HTTP podem emitir métricas com rotas e nomes
  normalizados;
- `components/ui` contém primitives visuais genéricas e `components/shared`
  oferece campos, feedback, filtros, paginação e inputs numéricos comuns;
- Vitest cobre infraestrutura HTTP, configuração, observabilidade, a operação
  patrimonial e os estados do dashboard;
- Playwright cobre o catálogo, o fluxo de autenticação, redirects, estados do
  dashboard, acessibilidade automatizável e headers de segurança;
- as rotas `/login`, `/redefinir-senha`, `/senha-atualizada`,
  `/esqueci-senha`, `/recuperar-senha` e `/recuperacao-concluida` estão
  integradas à API por operações tipadas quando há mutation;
- o grupo `(sistema)` compartilha sidebar, topbar, breadcrumb navegável,
  `PageHeader`, rodapé derivado da tela e menu do usuário, com navegação
  ordenada e filtrada por perfil; Minha conta fica no menu, o shell não consulta
  notificações e `SystemFooter` é o único rodapé de página autenticada;
- não existem biblioteca de cache remoto nem estado global na Web;
- `WEB-AUTH-001` está implementado com backend mockado estrito no E2E; a
  validação adicional contra uma stack real permanece pendente.
- `WEB-AUTH-002` está implementado com backend mockado estrito no E2E; a
  validação adicional contra PostgreSQL e SMTP fake permanece pendente.

`WEB-AUTH-001` moveu a visão geral ilustrativa para `/dashboard`. O
`WEB-AUTH-003` substituiu o catálogo transitório de `/` pela matriz Server de
entrada, centralizou ausência/indisponibilidade no limite autenticado e removeu
retornos vazios das páginas protegidas.
`WEB-SHELL-001` moveu a proteção e a composição visual das páginas autenticadas
para o layout do grupo `(sistema)` sem alterar a URL pública.

## Evolução aprovada de usabilidade e padronização

A sequência aprovada para estabilizar autenticação, permissões, componentes,
shell e verticais Web está em
[Evolução Web de usabilidade e padronização](./roadmap.md#evolução-web-de-usabilidade-e-padronização).
As tarefas vinculadas ao roadmap são contratos de execução; esta seção não
descreve essas melhorias como já implementadas. O trabalho prioriza o produto
Web apresentável e funcional, preserva as URLs atuais e deixa a evolução mobile
para depois, exceto pelo controle crítico do leitor de inventário.

`/usuarios`, `/usuarios/novo`, `/usuarios/[usuarioId]` e
`/usuarios/[usuarioId]/editar` integram listagem paginada, filtros, consulta,
criação, edição e situação à API administrativa. Criação e edição também usam
modal interceptado a partir da lista. O acesso é restrito ao Administrador e a
API continua sendo a autoridade final. O contrato de criação recebe nome,
e-mail, senha inicial e perfil; vínculo com funcionário/setor não existe nesse
contrato.

## Princípios

- Prefira Server Components e crie a menor fronteira Client necessária.
- Componentize por responsabilidade, reutilização ou isolamento de
  complexidade.
- Mantenha componente exclusivo junto da rota e promova somente após
  reutilização real.
- Use componentes padronizados antes de criar outra primitive.
- Modele loading, vazio, erro, sucesso, pending e falta de permissão.
- Validação no navegador melhora a experiência, mas não substitui a API.
- Não introduza biblioteca, estado global ou abstração sem necessidade.
- Meça desempenho; não use “leve” como critério subjetivo.

## Metadata obrigatória

Toda página deve produzir:

```text
Nome da página | Nome da aplicação
```

O nome vem de `NEXT_PUBLIC_APP_NAME`. O layout raiz define `title.default` e
`title.template`; cada página declara seu título específico quando estiver sob
esse template.

## Documentos

| Assunto                                       | Documento                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Entregas e critérios de aceite                | [Roadmap](./roadmap.md)                                                     |
| Estado operacional                            | [Handoff](./handoff.md)                                                     |
| Organização, renderização e estado            | [Arquitetura](./architecture.md)                                            |
| Rotas, layouts, metadata e estados de página  | [Páginas e rotas](./pages-and-routing.md)                                   |
| Componentização e design system               | [Componentes e design system](./components-and-design-system.md)            |
| Formulários e contratos Zod                   | [Formulários e validação](./forms-and-validation.md)                        |
| Layout adaptável, UX e acessibilidade         | [Responsividade, UX e acessibilidade](./responsive-ux-and-accessibility.md) |
| Controles do navegador e código client/server | [Segurança](./security.md)                                                  |
| Bundle, imagens, fontes e métricas            | [Desempenho](./performance.md)                                              |
| Ordem de trabalho e verificações              | [Testes e workflow](./testing-and-workflow.md)                              |
| Fontes oficiais                               | [Referências](./references.md)                                              |

## Decisões pendentes do SIPAT

- identidade visual definitiva além dos tokens e padrões aprovados em
  `WEB-UI-001`;
- biblioteca de cache e estado remoto;
- duração e política operacional das sessões e do cookie;
- serviço de observabilidade e analytics;
- internacionalização;
- metas numéricas de bundle e Core Web Vitals;
- navegadores E2E adicionais, PWA e offline.

Quando uma decisão afetar API, contratos ou comportamento entre aplicações,
registre-a também em [Integrações](../../integrations/README.md).

## Relatórios patrimoniais

`/relatorios` integra catálogo, filtros por tipo, seletores paginados, prévia,
ficha, totais e PDF pela API real. Alterar filtros invalida a prévia.
[Contrato de execução e evidências](../../tasks/WEB-RELATORIOS-001-interface.md).
