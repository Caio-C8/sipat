# Fluxo de trabalho entre agentes

Este fluxo organiza a passagem de funcionalidades e mudanças relevantes entre
planejamento, implementação e versionamento. Ele começa a valer para trabalhos
novos e não exige migrar roadmaps, handoffs ou entregas existentes.

O objetivo é permitir que cada conversa receba contexto suficiente por meio de
documentos versionados, sem depender do histórico completo das outras.

## Responsabilidades

### Planejador

- consulta requisitos, decisões, roadmaps e o estado existente relacionado ao
  objetivo;
- avalia criticamente a solução proposta e suas dependências;
- define escopo, fora do escopo e critérios de aceite;
- registra decisões novas no documento que já é fonte de verdade para o tema;
- atualiza o roadmap quando o objetivo ou suas dependências mudarem;
- prepara uma especificação de tarefa compreensível sem o histórico do chat.

O planejador não marca implementação como concluída sem evidência do estado
real. Use [o template de tarefa](../tasks/TEMPLATE.md) para funcionalidades,
mudanças arquiteturais ou trabalhos que precisem de passagem formal; correções
pequenas não exigem um arquivo próprio.

### Implementador

- recebe a especificação aprovada e confirma o estado real do código, da branch
  e das dependências relevantes;
- consulta as instruções e somente a documentação aplicável ao escopo;
- implementa o que foi aprovado e preserva mudanças alheias;
- executa verificações proporcionais ao impacto e ao risco;
- atualiza roadmaps, tarefas e handoffs afetados somente depois de verificar o
  resultado correspondente;
- informa alterações, validações, limitações e pendências.

Se faltar uma decisão de produto ou segurança que altere comportamento, o
implementador solicita esclarecimento em vez de inventar a regra.

### Versionador

- inspeciona o estado Git atual e somente as alterações relevantes;
- diferencia mudanças staged, unstaged e untracked;
- identifica agrupamentos coerentes a partir dos diffs;
- sugere mensagens em Conventional Commits e comandos prontos para execução;
- não altera código ou documentação e não executa staging, commit ou push.

Quando disponível, use a skill
[`versionar-git`](../../.agents/skills/versionar-git/SKILL.md) para esse fluxo.

## Passagem da tarefa

1. O planejador identifica as fontes de verdade e cria ou atualiza somente os
   registros necessários.
2. A especificação aprovada referencia requisitos e decisões existentes em vez
   de copiá-los. Ela contém objetivo, escopo, critérios, verificações e decisões
   bloqueantes.
3. O implementador usa a especificação como contrato de execução, mas confirma
   o estado atual antes de agir. Divergências materiais retornam ao planejador
   ou ao usuário para decisão.
4. Após implementar e verificar, o implementador atualiza o estado e registra
   evidências e limitações nos documentos apropriados.
5. O versionador reinspeciona o worktree vivo. Listas de arquivos ou commits de
   uma conversa anterior não substituem essa inspeção.

O handoff entre conversas deve apontar para o documento de tarefa e para as
fontes de verdade relevantes. Não é necessário transcrever raciocínio, saídas
extensas de ferramentas ou todo o histórico da sessão.

## Responsabilidade de cada documento

| Documento               | Responsabilidade principal                   |
| ----------------------- | -------------------------------------------- |
| Requisitos              | comportamento e regras do produto            |
| Arquitetura e segurança | decisões técnicas e políticas aprovadas      |
| Roadmap                 | objetivos, dependências e progresso geral    |
| Documento de tarefa     | contrato de execução de um trabalho aprovado |
| Handoff                 | estado operacional efetivamente entregue     |

Registre cada informação completa em uma única fonte de verdade e use links
relativos nos demais documentos. O documento de tarefa não substitui o roadmap,
e o handoff não deve antecipar um estado ainda não verificado.

## Uso eficiente do contexto

- organize sessões por objetivo ou tarefa quando isso facilitar o handoff, sem
  criar uma conversa nova para cada ajuste pequeno;
- reutilize o contexto verificado da sessão atual;
- localize símbolos e leia trechos relevantes antes de abrir documentos
  completos;
- mantenha prompts de implementação centrados na tarefa aprovada e em links
  específicos;
- limite saídas de ferramentas e resumos finais ao que sustenta decisões,
  validações, limitações e próximos passos;
- amplie a investigação quando dependências, riscos ou incertezas exigirem.
