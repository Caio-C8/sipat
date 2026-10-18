# Desenvolvimento da aplicação Web

Este diretório documenta o padrão de desenvolvimento de `apps/web`.

## Objetivo

A aplicação usa Next.js com App Router. As páginas e features do SIPAT serão
adicionadas conforme entregas concretas dos requisitos, preservando as
fronteiras entre UI, contratos e integração HTTP.

## Estado atual

- `/` apresenta a infraestrutura atual e links para os health checks;
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
- Vitest cobre infraestrutura HTTP, configuração e observabilidade;
- Playwright cobre home, acessibilidade automatizável e headers de segurança;
- não existem páginas, formulários, hooks, cache remoto ou regras de domínio.

Os contratos e endpoints administrativos de usuários existem no backend, mas
ainda não possuem consumidor Web. Login, logout, `/auth/me` e criação produtiva
de sessão também não existem.

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
- autenticação Web, identidade atual, redirects, login e logout;
- duração e política operacional das sessões e do cookie;
- serviço de observabilidade e analytics;
- internacionalização;
- metas numéricas de bundle e Core Web Vitals;
- navegadores E2E adicionais, PWA e offline.

Quando uma decisão afetar API, contratos ou comportamento entre aplicações,
registre-a também em [Integrações](../../integrations/README.md).
