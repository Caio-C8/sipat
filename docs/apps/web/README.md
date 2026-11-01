# Desenvolvimento da aplicação Web

Este diretório documenta o padrão de desenvolvimento de `apps/web`.

## Objetivo

A aplicação usa Next.js com App Router. As páginas e features do SIPAT serão
adicionadas conforme entregas concretas dos requisitos, preservando as
fronteiras entre UI, contratos e integração HTTP.

## Estado atual

- `/` apresenta o catálogo público de páginas, acessos e endpoints técnicos;
- `/dashboard` apresenta a visão geral autenticada com totais patrimoniais
  reais, obtidos da metadata de `GET /patrimonios`, e estados explícitos para
  blocos ainda sem integração;
- `/movimentacoes` e seu detalhe consultam transferências reais para os dois perfis;
  `/movimentacoes/nova` registra de 1 a 10 transferências somente pelo diretor;
- `/manutencoes`, `/manutencoes/nova` e o detalhe permitem aos dois perfis
  consultar, criar, revisar orçamento, registrar retorno e anexar/abrir PDFs
  pela API real; o percurso Chromium com banco isolado está em
  [WEB-MANUTENCOES-001](../../tasks/WEB-MANUTENCOES-001-interface-manutencoes.md);
- `/reavaliacoes`, `/reavaliacoes/nova` e o detalhe oferecem consultas,
  prévia e confirmação na API real; o percurso Chromium com PostgreSQL
  isolado está em
  [WEB-REAVALIACOES-001](../../tasks/WEB-REAVALIACOES-001-interface-reavaliacoes.md);
- `/emprestimos`, `/emprestimos/nova` e o detalhe oferecem consulta, saída e
  devolução parcial na API real; o percurso com PostgreSQL isolado está em
  [WEB-EMPRESTIMOS-001](../../tasks/WEB-EMPRESTIMOS-001-interface-emprestimos.md);
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
- `components/ui` contém primitives visuais genéricas já instaladas;
- Vitest cobre infraestrutura HTTP, configuração, observabilidade, a operação
  patrimonial e os estados do dashboard;
- Playwright cobre o catálogo, o fluxo de autenticação, redirects, estados do
  dashboard, acessibilidade automatizável e headers de segurança;
- as rotas `/login`, `/redefinir-senha`, `/senha-atualizada`,
  `/esqueci-senha`, `/recuperar-senha` e `/recuperacao-concluida` estão
  integradas à API por operações tipadas quando há mutation;
- o grupo `(sistema)` compartilha sidebar, topbar, breadcrumb, notificações e
  menu do usuário, com navegação filtrada por perfil;
- não existem biblioteca de cache remoto nem estado global na Web;
- `WEB-AUTH-001` está implementado com backend mockado estrito no E2E; a
  validação adicional contra uma stack real permanece pendente.
- `WEB-AUTH-002` está implementado com backend mockado estrito no E2E; a
  validação adicional contra PostgreSQL e SMTP fake permanece pendente.

`WEB-AUTH-001` transformou `/` no catálogo público de rotas e moveu a visão
geral ilustrativa para `/dashboard`, protegida para os dois perfis.
`WEB-SHELL-001` moveu a proteção e a composição visual das páginas autenticadas
para o layout do grupo `(sistema)` sem alterar a URL pública.
`WEB-DASHBOARD-001` substituiu os dados ilustrativos pelos totais reais geral e
por status, mantendo indisponíveis os blocos que ainda não possuem contrato.

Os contratos e endpoints administrativos de usuários existem no backend, mas
ainda não possuem consumidor Web. Login, logout, primeiro acesso e consumo de
`/auth/me` já possuem integração; gestão de usuários permanece no objetivo
`WEB-USERS-001`.

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

- identidade visual, temas e tokens definitivos;
- biblioteca de formulários e estado remoto;
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
