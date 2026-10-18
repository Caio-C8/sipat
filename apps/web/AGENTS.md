# Instruções para agentes — Web

Estas regras complementam o `AGENTS.md` da raiz para qualquer alteração em
`apps/web`.

## Roteamento da leitura

Comece pelo índice da
[documentação Web](../../docs/apps/web/README.md), localize as rotas,
componentes e operações afetadas e leia somente os capítulos relacionados à
tarefa.

Consulte adicionalmente, quando aplicável:

- [Contratos](../../docs/contracts/README.md) ao usar ou alterar schemas e tipos
  compartilhados;
- [Integração web–API](../../docs/integrations/web-api/README.md) ao criar
  cliente, operação, hook ou fluxo que chama a API;
- [Segurança web](../../docs/apps/web/security.md) para dados externos,
  conteúdo rico, credenciais, scripts ou componentes Client;
- [Performance web](../../docs/apps/web/performance.md) quando a mudança afetar
  renderização, bundle, mídia, rede, cache ou métricas;
- [Responsividade, UX e acessibilidade](../../docs/apps/web/responsive-ux-and-accessibility.md)
  para qualquer página ou componente visual.

Uma tarefa pode implementar interface e integração na mesma execução. A
separação dos documentos não proíbe isso; exige aplicar as duas áreas.
Não abra todos os capítulos por padrão; amplie a leitura conforme as
responsabilidades realmente afetadas.

## Pré-condições

- Confirme o estado real do app e as dependências instaladas.
- Não presuma que React Hook Form, shadcn/ui, biblioteca de cache ou stack de
  testes já existam.
- Confirme contratos de request e response antes de integrar.
- Não invente endpoint, autenticação, erro, cache ou regra de produto.
- Confirme componentes e tokens existentes antes de criar outra primitive.
- Pergunte ao usuário antes de escolher uma biblioteca transversal quando a
  decisão ainda estiver pendente.

## Arquitetura

- Prefira Server Components.
- Use `"use client"` na menor fronteira que precise de hooks, estado, eventos
  ou APIs do navegador.
- Componentize por responsabilidade, reutilização ou isolamento de
  complexidade; não fragmente JSX sem benefício.
- Mantenha componente exclusivo junto da rota e promova somente após
  reutilização real.
- Primitives e código shadcn/ui ficam em `components/ui`; regra de domínio
  não entra ali.
- Estado permanece o mais próximo possível; URL representa estado
  compartilhável de navegação.
- Não adicione estado global, effect, memoização ou dependência sem necessidade
  concreta.

## Metadata

Toda página deve produzir:

```text
Nome da página | Nome do projeto
```

Use o template do layout e metadata específica da página. Lembre que o template
não se aplica ao `page.tsx` do mesmo segmento que o declara. Confirme o título
resultante, inclusive para a home e metadata dinâmica.

## Formulários

- Use React Hook Form e resolver Zod quando o baseline estiver instalado.
- Use contrato compartilhado somente quando a semântica do formulário for a
  mesma da operação.
- Diferencie `z.input` e `z.output`.
- Preserve a diferença entre ausente, `undefined`, `null` e string vazia.
- Não trate validação cliente como segurança.
- Não faça chamada HTTP diretamente no componente do formulário.

## Integração

- Client Components usam um hook por operação HTTP.
- Método e endpoint diferentes exigem operações e hooks distintos.
- O hook chama uma função de operação; não duplica URL ou cliente.
- Server Components chamam funções assíncronas comuns, nunca hooks.
- Use somente `browserApiClient` no cliente e `serverApiClient` em código
  server-only.
- Não crie instância HTTP por feature ou hook.
- Valide responses externas quando houver schema.
- Não implemente cache próprio com vários effects.

## Qualidade

- Planeje loading, vazio, erro, sucesso, pending e sem permissão.
- Verifique viewport estreita, intermediária e ampla.
- Teste teclado, foco, zoom, conteúdo longo e reduced motion.
- Use HTML semântico antes de ARIA.
- Não exponha segredo, HTML não confiável ou detalhe interno.
- Avalie impacto de Client Components, imagens, fontes, scripts e dependências.
- Preserve métricas de Core Web Vitals e compare regressões por rota e versão;
  metas adicionais pertencem ao contexto do projeto.
- Questione requisitos que contrariem segurança, acessibilidade, documentação
  oficial ou os limites descritos, explicando risco e alternativa.

## Verificação

Use [Testes e workflow](../../docs/apps/web/testing-and-workflow.md) para
selecionar verificações progressivas:

- documentação Web: diff, links, Markdown e formatação;
- código localizado: lint, typecheck e testes relevantes de `@repo/web`;
- página, fluxo ou integração funcional: suíte Web, build, inspeção manual e E2E
  aplicável;
- contratos ou mudança transversal: valide também os packages e apps
  consumidores.

A CI completa permanece como critério de integração. Não declare a tarefa
concluída com falha conhecida ou sem relatar limitações de teste visual,
acessibilidade ou integração.
