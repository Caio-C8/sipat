# Instruções para agentes

## Escopo geral

- Inspecione a estrutura e os usos existentes antes de alterar código.
- Preserve mudanças do usuário que não pertençam à tarefa.
- Faça mudanças pequenas, verificáveis e compatíveis com a arquitetura.
- Não altere contratos externos silenciosamente.
- Explique decisões arquiteturais e trade-offs relevantes.
- Quando a semântica de um campo não puder ser inferida com segurança, pergunte
  antes de decidir.

## Fontes

- Confirme APIs e recomendações nas documentações oficiais das versões usadas.
- Quando houver incerteza, pesquise uma fonte confiável e forneça o link.
- Use issues, discussões e comunidade apenas como evidência secundária.

## Análise crítica

- Trate o pedido do usuário como o objetivo a ser alcançado, não como prova de
  que a solução sugerida é a melhor implementação.
- Compare decisões propostas com o código existente, a arquitetura documentada,
  as versões instaladas e as recomendações oficiais aplicáveis.
- Quando uma decisão parecer inconsistente, desnecessariamente complexa,
  insegura ou contrária às práticas recomendadas, explique antes de adotá-la:
  identifique o problema, apresente evidências, descreva os impactos e recomende
  uma alternativa.
- Não bloqueie o trabalho por preferência pessoal ou diferença apenas estética.
  Se houver uma alternativa segura, compatível e dentro do escopo, prossiga com
  ela e registre a adaptação.
- Peça uma decisão ao usuário quando as alternativas mudarem comportamento
  externo, política de produto, segurança, custo relevante ou escopo.
- Se o usuário mantiver conscientemente uma decisão após conhecer os trade-offs,
  respeite-a dentro dos limites de segurança, autorização e viabilidade técnica.

## Explicação e documentação

- Seja capaz de explicar em linguagem clara as regras, conceitos e decisões
  descritos na documentação do repositório.
- Ao explicar, confirme também o código e a configuração atuais. Diferencie o
  padrão desejado daquilo que já está implementado.
- Aponte os documentos internos relevantes e, quando necessário, as fontes
  oficiais que sustentam a explicação.
- Se uma mudança tornar a documentação incorreta, atualize-a na mesma tarefa
  quando isso estiver dentro do escopo.

## Contratos

Antes de modificar `packages/contracts` ou um consumidor de seus contratos,
comece por [docs/contracts/README.md](docs/contracts/README.md) e leia apenas os
documentos relevantes à tarefa.

Regras obrigatórias:

- Use Zod 4 para novos contratos runtime.
- Considere o schema a fonte de verdade e derive tipos dele.
- Diferencie `z.input` de `z.output` quando houver transformação.
- Valide dados externos no boundary.
- Mantenha regras dependentes de banco ou permissões fora dos schemas.
- Não faça `@repo/contracts` depender de `@repo/database` sem decisão
  arquitetural explícita.
- Não crie uma DSL genérica sobre o Zod.
- Preserve a diferença entre propriedade ausente, `undefined`, `null` e
  string vazia.
- Não presuma que Create, Update, formulário, banco e response compartilham o
  mesmo contrato.
- Adicione testes antes de reutilizar primitives, normalizers, codecs ou helpers
  em várias features.

## Roadmap de contratos

Antes de criar uma nova capacidade relevante em `@repo/contracts` ou alterar o
comportamento de um contrato externo, registre um objetivo em
[docs/contracts/roadmap.md](docs/contracts/roadmap.md).

- Inclua contexto, escopo, consumidores afetados e critérios de aceite.
- Não adicione objetivos hipotéticos ou de um domínio inexistente à estrutura
  padrão.
- Atualize o status somente depois das verificações correspondentes.
- Promova uma capacidade ao baseline apenas quando ela estiver implementada,
  validada e for reutilizável em qualquer projeto derivado.
- Correções pequenas que não criam capacidade nem alteram comportamento externo
  não precisam de um objetivo separado.

## API

Antes de modificar `apps/api`, leia [apps/api/AGENTS.md](apps/api/AGENTS.md) e
comece por [docs/apps/api/README.md](docs/apps/api/README.md). As instruções
específicas da API complementam as regras gerais deste arquivo.

## Web

Antes de modificar `apps/web`, leia [apps/web/AGENTS.md](apps/web/AGENTS.md) e
comece por [docs/apps/web/README.md](docs/apps/web/README.md).

Quando a tarefa envolver chamadas à API, autenticação, contratos de response,
cache remoto ou hooks de dados, leia também
[docs/integrations/web-api/README.md](docs/integrations/web-api/README.md).

Uma tarefa pode implementar página e integração em conjunto; nesse caso, aplique
as instruções das duas áreas.

## Performance

Antes de alterar caminho crítico, query, listagem, upload, integração externa,
cache, concorrência, build ou infraestrutura, leia
[docs/performance/README.md](docs/performance/README.md) e o capítulo da camada
afetada.

- Considere performance durante o desenho, não somente depois da implementação.
- Defina limites finitos para trabalho controlado por entrada externa.
- Observe no mínimo duração por percentis, volume, falhas, saturação, dados
  processados e tempo das dependências quando aplicáveis.
- Não invente metas numéricas universais; registre metas e alertas conforme o
  contexto do projeto.
- Não use média isolada para concluir que um fluxo atende performance.
- Não adicione cache, índice, paralelismo, memoização ou nova tecnologia sem
  identificar o gargalo e a semântica afetada.
- Compare cenários equivalentes antes e depois de uma otimização.
- Métricas, logs e traces não podem usar credenciais, dados pessoais, IDs ou
  URLs brutas como labels.

## Verificação

Depois de modificar somente o package de contratos, execute no mínimo:

```bash
pnpm --filter @repo/contracts lint
pnpm --filter @repo/contracts typecheck
```

Execute os testes do package quando o script `test` existir. Para mudanças que
afetem consumidores, valide também os apps envolvidos ou rode:

```bash
pnpm check
pnpm format:check
```
