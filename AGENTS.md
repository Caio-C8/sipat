# Instruções para agentes

## Regras universais

- Delimite o objetivo e confirme o estado real do código e da configuração antes
  de editar. Preserve mudanças do usuário fora do escopo e faça alterações
  pequenas, verificáveis e compatíveis com a arquitetura.
- Não invente regras de negócio, semânticas de campos, contratos, políticas de
  segurança ou estados de implementação. Não altere contratos externos
  silenciosamente.
- Peça uma decisão quando a ambiguidade puder mudar comportamento externo,
  segurança, custo relevante ou escopo. Resolva detalhes seguros e compatíveis
  que não mudem esses limites.
- Avalie criticamente a solução proposta. Quando ela for inconsistente,
  desnecessariamente complexa ou insegura, explique evidências, impactos e uma
  alternativa. Depois de expostos os trade-offs, respeite a decisão confirmada
  dentro dos limites de segurança e autorização.
- Confirme APIs e recomendações nas documentações oficiais das versões usadas.
  Em incerteza relevante, pesquise fonte confiável e forneça o link; trate
  issues, discussões e comunidade como evidência secundária.
- Mantenha documentação e implementação consistentes. Atualize o documento que
  a mudança tornar incorreto quando isso estiver dentro do escopo.

## Leitura eficiente

- Identifique áreas e riscos antes de explorar. Localize arquivos e símbolos com
  `rg --files`, `rg` ou equivalente antes de abrir conteúdos completos.
- Comece por índices e trechos diretamente relacionados. Não faça varredura
  completa, releitura ou investigação externa ao escopo sem necessidade
  concreta.
- Reutilize contexto já verificado na sessão e limite a saída das ferramentas ao
  necessário para decidir ou validar.
- Amplie a investigação ao encontrar dependências, impacto transversal,
  segurança ou evidência insuficiente.

Essas são preferências operacionais, não limites para uma investigação
necessária.

## Roteamento por escopo

Comece por [docs/README.md](docs/README.md) e consulte somente o que a tarefa
exigir:

| Escopo                                                                                 | Ponto de entrada e gatilhos adicionais                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos ou consumidores                                                              | [docs/contracts/README.md](docs/contracts/README.md). Leia convenções, integrações, testes e roadmap conforme o impacto; registre antes uma nova capacidade relevante ou mudança de contrato externo.                   |
| `apps/api`                                                                             | [apps/api/AGENTS.md](apps/api/AGENTS.md) e [docs/apps/api/README.md](docs/apps/api/README.md).                                                                                                                          |
| `apps/web`                                                                             | [apps/web/AGENTS.md](apps/web/AGENTS.md) e [docs/apps/web/README.md](docs/apps/web/README.md). Para API, autenticação, response, cache remoto ou hooks, leia [integração Web–API](docs/integrations/web-api/README.md). |
| `apps/mobile`                                                                          | [docs/apps/mobile/README.md](docs/apps/mobile/README.md). Para chamadas à API, leia [integração Mobile–API](docs/integrations/mobile-api/README.md).                                                                    |
| Caminho crítico, query, listagem, upload, cache, concorrência, build ou infraestrutura | [docs/performance/README.md](docs/performance/README.md) e somente o capítulo da camada afetada.                                                                                                                        |
| Identidade, sessão, autenticação, autorização, CSRF, credenciais ou auditoria          | [docs/security-and-access.md](docs/security-and-access.md) e segurança da aplicação afetada. Não enfraqueça a política existente.                                                                                       |
| Handoff formal entre agentes                                                           | [docs/agents/workflow.md](docs/agents/workflow.md) e, quando trouxer rastreabilidade útil, [docs/tasks/TEMPLATE.md](docs/tasks/TEMPLATE.md).                                                                            |

## Estado documental

- Requisitos descrevem o produto; arquitetura e segurança registram decisões;
  roadmaps organizam objetivos e dependências; tarefas formalizam o contrato de
  execução; handoffs registram o estado operacional entregue.
- Atualize status somente após as verificações correspondentes e diferencie o
  padrão desejado do que está implementado.
- Evite duplicação: registre a informação completa em uma fonte de verdade e
  use links relativos nos demais documentos. Não crie artefatos apenas para
  demonstrar o trabalho.

## Verificação proporcional

| Impacto                        | Verificação mínima                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Somente documentação           | Diff, links relativos, Markdown e formatação afetados.                             |
| Código localizado              | Lint, typecheck e testes do package, módulo ou arquivos afetados.                  |
| Comportamento funcional        | Cobertura do comportamento, lint, tipos, testes, build e consumidores necessários. |
| Mudança transversal ou crítica | Packages e apps envolvidos, integração ou E2E aplicável e build relevante.         |

A CI completa continua sendo o critério de integração. Não apresente como
executada uma validação que não ocorreu; relate falhas, limitações e pendências.

## Comunicação

- Não repita todo o contexto. Explique decisões e trade-offs relevantes.
- Ao concluir, informe objetivamente arquivos alterados, verificações,
  limitações e pendências.
- Peça esclarecimento somente diante de ambiguidade relevante que não possa ser
  resolvida com segurança.
- Não produza relatório ou documentação duplicada apenas para registrar a
  atividade do agente.
