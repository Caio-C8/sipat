# Contratos compartilhados

Este diretório documenta a evolução do package `@repo/contracts`, localizado em
`packages/contracts`. Ele é a fonte de verdade para contratos que atravessam
processos ou camadas do monorepo.

## Objetivo

Construir uma camada baseada em Zod 4 que:

- valide dados não confiáveis em runtime;
- derive tipos TypeScript dos schemas;
- possa ser usada por Next.js e NestJS;
- mantenha contratos independentes da persistência;
- normalize somente quando a operação exigir;
- produza erros previsíveis para clientes da API e formulários;
- permaneça explícita e simples de testar.

A regra central é:

> Não esconder o Zod. Complementar o Zod.

## Estado atual

O package se chama `@repo/contracts`, é consumido por `apps/web`, `apps/api` e
`apps/mobile` e usa Zod 4 para contratos runtime. Ele possui testes próprios
executados por `tsx` e entrega o baseline genérico de respostas, erros,
paginação e health check, além dos contratos já concluídos de identidade,
usuários, autenticação Web e mobile, senha, patrimônios, seus cadastros relacionados,
processos de compra, notas fiscais, comissões, inventários, primeiro acesso e
reavaliações patrimoniais.
Novos contratos do SIPAT devem ser adicionados por entrega, depois de confirmar
sua semântica nos [requisitos](../requisitos-SIPAT.md) e registrar o objetivo
correspondente no roadmap.

Os documentos deste diretório descrevem tanto as decisões aprovadas quanto o
plano para construir a camada de validação. Exemplos marcados como conceituais
não representam necessariamente código já implementado.

## Por onde começar

| Necessidade                                  | Documento                                                   |
| -------------------------------------------- | ----------------------------------------------------------- |
| Entender responsabilidades e dependências    | [Arquitetura](./architecture.md)                            |
| Criar ou revisar um schema                   | [Convenções](./conventions.md)                              |
| Padronizar mensagens e respostas de erro     | [Erros](./errors.md)                                        |
| Integrar com NestJS ou Next.js               | [Integrações](./integrations.md)                            |
| Definir testes                               | [Testes](./testing.md)                                      |
| Limitar custo de requests e responses        | [Performance](../performance/contracts-and-integrations.md) |
| Consultar implementações conceituais         | [Exemplos](./examples.md)                                   |
| Consultar o baseline ou registrar objetivos  | [Roadmap](./roadmap.md)                                     |
| Verificar APIs e decisões em fontes oficiais | [Referências](./references.md)                              |

## Vocabulário

- **Contrato:** representação aceita ou produzida por uma operação da aplicação.
- **Schema:** definição Zod executável em runtime.
- **Input:** valor externo antes de validação e transformação.
- **Output:** valor validado e normalizado entregue à aplicação.
- **Primitive:** schema reutilizável que representa um conceito do sistema.
- **Normalizer:** transformação de representação sem regra de negócio.
- **Codec:** conversão bidirecional entre representação externa e interna.
- **Boundary:** ponto em que dados não confiáveis entram na aplicação.

## Fluxo esperado

```text
dado não confiável
        ↓
schema Zod no boundary
        ↓
output validado
        ↓
controller ou caso de uso
        ↓
regra de negócio
        ↓
persistência
```

Frontend e backend podem importar o mesmo schema quando compartilham
verdadeiramente o mesmo contrato. A validação executada no frontend melhora a
experiência do usuário, mas nunca substitui a validação do backend.
