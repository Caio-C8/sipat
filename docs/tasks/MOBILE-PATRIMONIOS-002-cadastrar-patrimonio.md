# `MOBILE-PATRIMONIOS-002` — Cadastrar um patrimônio no mobile

**Status:** planejada

## Objetivo

Implementar o fluxo mobile unitário de cadastro patrimonial para o Diretor de
Patrimônio e uma comunicação visual agradável de acesso restrito para o
Administrador, reutilizando os catálogos e o `POST /api/patrimonios` existentes
e reproduzindo os frames aprovados do Figma.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#consulta-e-cadastro-de-patrimônios-no-mobile)
  e [mobile](../apps/mobile/roadmap.md#bens-e-cadastro-patrimonial).
- Requisitos: [RF10 e UC10](../requisitos-SIPAT.md).
- Dependências:
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md),
  [PATRIMONIOS-004](./PATRIMONIOS-004-leitura-catalogos-diretor.md) e
  [MOBILE-PATRIMONIOS-001](./MOBILE-PATRIMONIOS-001-consultar-patrimonios.md).
- Segurança: [matriz de acesso](../security-and-access.md#leitura-de-catálogos-para-cadastro-patrimonial-planejada).
- Mobile: [formulários](../apps/mobile/forms-and-validation.md),
  [componentes](../apps/mobile/components-and-design-system.md),
  [rotas](../apps/mobile/routing-and-navigation.md) e
  [testes](../apps/mobile/testing-and-workflow.md).
- Integração: [mobile–API](../integrations/mobile-api/README.md).
- Figma obrigatório no navegador, página `Telas Mobile`:
  [página](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f),
  [etapa 1](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1177&p=f),
  [etapa 2](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1269&p=f),
  [etapa 3](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1368&p=f),
  [etapa 4](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1475&p=f),
  [revisão](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1581&p=f)
  e [sucesso](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=278-1674&p=f).

## Pré-condição visual obrigatória

Antes de editar, o implementador deve abrir no navegador a página e os seis
estados do fluxo acima, inspecionar também as transições disponíveis no
protótipo e registrar a comparação no handoff. O Figma é somente leitura. Não
é permitido implementar pela descrição textual, pela UI atual ou por imagens
copiadas, nem alterar o arquivo de design.

## Ordem de execução

1. Confirmar worktree, dependências concluídas, contrato de criação, sessão,
   catálogo de rotas e operações HTTP existentes.
2. Inspecionar todos os frames obrigatórios no navegador e registrar medidas,
   hierarquia, estados, assets e transições relevantes.
3. Adicionar `/cadastro/patrimonio` no grupo `(app)` e no catálogo tipado para
   os dois perfis, pois o Administrador receberá um estado informativo real.
4. Implementar primeiro o gate visual por perfil, sem carregar catálogos quando
   a sessão for administrativa.
5. Implementar operações de leitura dos catálogos e a operação unitária de
   criação para o Diretor.
6. Implementar estado local tipado, quatro etapas, retorno entre etapas, revisão
   editável, submissão única e confirmação com a response real.
7. Tornar `Cadastro` navegável e selecionado na bottom bar nessa rota.
8. Cobrir autorização, formulário, mappers, rede, navegação e acessibilidade.
9. Comparar cada estado executado em 390×844 e validar dimensões adaptáveis.

## Escopo

- rota `/cadastro/patrimonio` protegida por sessão e troca de senha concluída;
- Diretor recebe o fluxo de quatro etapas, revisão e sucesso;
- Administrador recebe uma tela coerente com o shell, com ícone de cadeado,
  título `Cadastro restrito`, explicação de que somente o Diretor de Patrimônio
  pode cadastrar bens e ação `Consultar bens` para `/bens`;
- o gate do Administrador não consulta setores, espécies ou processos e não
  instancia o formulário;
- etapa 1: descrição, marca, modelo, número de série e indicação de bem sem
  número oficial; o número é somente uma informação de geração pelo servidor;
- etapa 2: espécie com natureza derivada, setor com responsável e sala
  derivados e situação inicial `ATIVO` somente leitura;
- etapa 3: tipo de incorporação, processo de compra opcional, resumo do processo,
  data de tombamento e valor de incorporação;
- etapa 4: método `LINEAR` somente leitura, vida útil inicial, residual em valor
  ou percentual como representação do formulário, valor residual efetivo e
  data de início;
- mapper local converte máscaras, moeda, datas, campos vazios e modo percentual
  para `CriarPatrimonioBodySchema`, sem modificar o contrato público;
- cálculo/preview de depreciação usa aritmética decimal e a mesma regra linear
  aprovada no domínio; a API continua sendo a validação final;
- espécies usam `GET /api/especies`; setores ativos usam
  `GET /api/setores?ativo=true`; processos usam `GET /api/processos-compra` e,
  ao selecionar, `GET /api/processos-compra/:processoCompraId` para o resumo;
- catálogos paginados usam busca incremental ou paginação explícita; não
  carregam silenciosamente todas as páginas;
- `POST /api/patrimonios` ocorre uma única vez por confirmação, sem retry
  automático e com bloqueio de submissão duplicada;
- revisão permite voltar à etapa correspondente sem perder os demais valores;
- sucesso usa a response criada para número, descrição, status, setor,
  responsável e valor e oferece `Cadastrar outro patrimônio` com formulário
  novo e limpo;
- erros de campo, relação desativada, conflito de série, `401`, `403`, timeout,
  offline/rede, response inválida e erro inesperado possuem estados distintos.

## Fora do escopo

- cadastro em lote, quantidade ou repetição sequencial de `POST`;
- controle `Mais de um bem igual?` mostrado no protótipo;
- número escolhido pelo usuário, edição posterior, importação ou idempotência
  genérica;
- criar ou alterar setor, espécie, natureza, responsável ou processo de compra;
- histórico, ficha do bem, relatório, impressão ou reimpressão de etiqueta;
- endpoint ou contrato específico para mobile;
- persistência offline do rascunho, fila, upload, câmera ou scanner;
- permitir ao Administrador enviar o body mesmo que manipule a navegação.

## Decisões aprovadas

- Cada confirmação cadastra exatamente um patrimônio. O controle de múltiplos
  bens é omitido intencionalmente, mesmo existindo no frame.
- O Administrador vê `Cadastro` na navegação e uma explicação agradável, mas
  nunca o formulário. O bloqueio definitivo continua no Guard da API.
- A rota pode pertencer aos dois perfis porque possui dois estados reais; isso
  não amplia a permissão da mutação.
- Seleções exibem dados derivados das responses existentes e enviam somente os
  IDs exigidos pelo contrato.
- O formulário não promete que o próximo número exibido será reservado; a
  numeração real aparece apenas na response de sucesso.
- Nenhuma mutation recebe retry automático.

## Critérios de aceite

- [ ] implementador registra que abriu e comparou no navegador todos os frames
      obrigatórios;
- [ ] Diretor percorre as quatro etapas, revisa e cadastra exatamente um bem;
- [ ] request final passa por `CriarPatrimonioBodySchema` e response passa por
      `CriarPatrimonioResponseSchema`;
- [ ] campos condicionais e opcionais preservam semântica de ausência, sem
      enviar strings vazias;
- [ ] dupla ativação, remontagem ou erro de rede não repetem o `POST`;
- [ ] Administrador vê o estado restrito e a ação para Bens, sem formulário nem
      requests de catálogo;
- [ ] tentativa forçada do Administrador recebe `403` da API;
- [ ] etapas, revisão e sucesso correspondem ao Figma em 390×844, salvo a
      omissão aprovada do controle de múltiplos bens;
- [ ] erros mantêm o rascunho não sensível e permitem correção sem perder etapas;
- [ ] voltar, teclado, safe areas, fonte ampliada e leitores de tela permanecem
      utilizáveis;
- [ ] nenhuma rota de API específica para mobile é criada.

## Arquivos ou módulos potencialmente afetados

- novo `apps/mobile/src/app/(app)/cadastro/patrimonio.tsx` ou estrutura
  equivalente confirmada contra as convenções do Expo Router;
- novo `apps/mobile/src/features/patrimonios/create/` com tela, etapas,
  componentes, schema de formulário, mapper, estado e testes;
- `apps/mobile/src/features/patrimonios/api/` para catálogos, detalhe de processo
  e criação, compartilhado com a consulta quando houver consumidor real;
- `apps/mobile/src/lib/navigation/routes.ts` e testes;
- `apps/mobile/src/components/shared/app-bottom-bar.tsx` e testes;
- `apps/mobile/src/theme/tokens.ts` somente para tokens semânticos reutilizados;
- `packages/contracts/src/patrimonio/` e catálogos como dependências, sem mudança
  presumida;
- API apenas como dependência entregue por `PATRIMONIOS-004`, sem controller
  mobile novo.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- testes de mapper e validação para todos os campos condicionais, moeda, datas,
  residual em valor/percentual e omissão de opcionais;
- testes HTTP de catálogos, detalhe de processo, `POST` único, conflito, timeout,
  cancelamento, `401`, `403` e response inválida;
- testes de tela para Diretor e Administrador, quatro etapas, voltar, revisão,
  edição, pending, erro e sucesso;
- integração real com API/PostgreSQL e sessões dos dois perfis;
- comparação visual no navegador com todos os frames em 390×844;
- telefone/tablet, retrato/paisagem, Web, teclado, fonte ampliada, foco,
  TalkBack e VoiceOver quando disponíveis;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Cadastro múltiplo, histórico e ficha estão explicitamente fora do
  escopo.
