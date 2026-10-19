# Documentação do SIPAT

Este diretório concentra a documentação técnica compartilhada por pessoas e
agentes durante o desenvolvimento.

## Documentação geral

Os documentos abaixo tratam de decisões transversais e permanecem na raiz:

- [Arquitetura do SIPAT](./architecture.md);
- [Ambientes](./environments.md);
- [Como adicionar aplicações e pacotes](./adding-apps.md);
- [Visão geral do SIPAT](./sipat.md);
- [Requisitos do SIPAT](./requisitos-SIPAT.md);
- [Roadmap inicial do SIPAT](./roadmap.md);
- [Identidade, sessão e controle de acesso](./security-and-access.md);
- [Armazenamento local de documentos](./file-storage.md).

## Áreas específicas

- [Contratos compartilhados](./contracts/README.md);
- [Aplicações](./apps/README.md);
- [Integrações entre aplicações](./integrations/README.md);
- [Performance](./performance/README.md).

## Trabalho com agentes

- [Fluxo entre planejamento, implementação e versionamento](./agents/workflow.md);
- [Template para novas tarefas com handoff formal](./tasks/TEMPLATE.md).

O fluxo é incremental: ele orienta novos trabalhos sem substituir roadmaps,
handoffs, requisitos ou decisões já existentes.

Cada nova aplicação pode receber um diretório próprio em `docs/apps/<app>`.
Crie documentação detalhada somente quando suas decisões forem conhecidas.

O `AGENTS.md` da raiz contém instruções operacionais para agentes. Explicações,
decisões e guias de desenvolvimento devem permanecer em `docs/`, evitando
duplicação entre documentação humana e instruções de agente.
