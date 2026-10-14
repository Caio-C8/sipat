# Documentação do projeto

Este diretório concentra a documentação técnica compartilhada por pessoas e
agentes durante o desenvolvimento.

## Documentação geral

Os documentos abaixo tratam de decisões transversais e permanecem na raiz:

- [Arquitetura da base](./architecture.md);
- [Ambientes](./environments.md);
- [Como adicionar aplicações e pacotes](./adding-apps.md);
- [Manutenção da base e versionamento do exemplo](./template-and-example.md).

## Áreas específicas

- [Contratos compartilhados](./contracts/README.md);
- [Aplicações](./apps/README.md);
- [Integrações entre aplicações](./integrations/README.md).

Cada nova aplicação pode receber um diretório próprio em `docs/apps/<app>`.
Crie documentação detalhada somente quando suas decisões forem conhecidas.

O `AGENTS.md` da raiz contém instruções operacionais para agentes. Explicações,
decisões e guias de desenvolvimento devem permanecer em `docs/`, evitando
duplicação entre documentação humana e instruções de agente.
