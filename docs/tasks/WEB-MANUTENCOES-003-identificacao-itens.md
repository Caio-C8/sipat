# `WEB-MANUTENCOES-003` — Identificar pedidos e simplificar itens

**Status:** baseline implementada e validada em 16/11/2026; extensão de anexos
e detalhes de orçamento/retorno implementada e validada em 17/11/2026.

## Objetivo

Dar identificação humana aos pedidos de manutenção e simplificar seleção e
preenchimento por item, preservando o ciclo funcional já validado para os dois
perfis. A extensão permite substituir e remover anexos de observação sem deixar
arquivos órfãos e torna orçamento e retorno consultáveis na tabela de itens,
preservando a imutabilidade após o retorno.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF18](../requisitos-SIPAT.md#rf18-gestão-de-manutenções).
- Estado: [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md),
  [WEB-MANUTENCOES-001](./WEB-MANUTENCOES-001-interface-manutencoes.md) e
  [WEB-MANUTENCOES-002](./WEB-MANUTENCOES-002-paridade-visual-figma.md).
- Fundação: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Diretrizes obrigatórias de interface e feedback

- Padronizar a interface usando as primitives do shadcn como base para tabelas,
  campos, botões, dialogs, drawers, cards, alerts e demais controles. Não criar
  componentes visuais paralelos quando já houver primitive equivalente.
- Escolher controles pela semântica: `InPATCH` para texto curto, `Textarea` para
  conteúdo longo, `Checkbox` para booleanos, `Select` para poucas opções
  fixas e `Combobox` para listas extensas, remotas ou pesquisáveis.
- Extrair para `components/shared` somente composições realmente reutilizadas
  por domínios distintos. Regras de negócio, permissões e estados específicos
  permanecem nas respectivas features.
- São permitidas mudanças de composição, hierarquia, agrupamento, espaçamento e
  apresentação visual quando melhorarem clareza e usabilidade, desde que
  preservem os requisitos funcionais e sigam o padrão visual já estabelecido.
- Centralizar cores em tokens e seguir a paleta: primário `#1E3A5F`, azul
  profundo `#0F2644`, apoio `#2A4F7A`, dourado `#D4A017`, dourado claro
  `#F5C842`, interativo `#2563EB`, fundo `#F8FAFC`, superfície `#FFFFFF`,
  texto `#0F172A`, texto auxiliar `#64748B` e borda `#E2E8F0`.
- Usar foco dourado de 3 px com afastamento de 2 px e nunca depender somente de
  cor para comunicar estado, prioridade ou resultado.
- Aplicar feedback conforme o tipo:
  - erro de campo fica abaixo do controle, com `aria-invalid`, borda vermelha e
    foco no primeiro campo inválido;
  - erro geral que exige correção usa `Alert` acima do formulário, recebe
    scroll/foco e permanece visível até a correção;
  - toast é reservado a sucesso ou falha geral não bloqueante e nunca é o único
    lugar para erro de campo, aviso persistente ou instrução necessária;
  - aviso contextual usa `Alert` quando houver pré-condição, consequência
    importante, ação irreversível ou informação que precise permanecer visível;
    não criar caixas meramente instrucionais ou decorativas;
  - ações destrutivas usam variante destrutiva e confirmação explícita.
- Escrever mensagens claras e orientadas à ação, sem expor termos de API, banco,
  servidor, stack ou implementação. Preservar teclado, foco, loading, disabled,
  responsividade e contraste.
- É permitido evoluir contratos compartilhados e responses de erro quando isso
  for necessário para fornecer feedback seguro e útil, inclusive campo, código
  público, mensagem pública ou condição de nova tentativa. Toda mudança deve
  atualizar validação, API, consumidores, testes e documentação; preservar
  compatibilidade quando possível; e nunca alterar regra de negócio,
  autorização ou contrato externo silenciosamente, nem expor detalhes internos.

## Escopo

- adicionar `numeroPedido BIGINT`, único, imutável e gerado por sequence;
- retropreencher pedidos existentes em ordem determinística de criação/id;
- transportar o número como string decimal nos contratos JSON e exibir
  `Pedido #n`; não reutilizar `numeroRequisicao` nem UUID;
- cobrir geração concorrente e busca por número do pedido;
- aplicar filtros, tabela, paginação, feedback e sete casas monetárias do kit;
- melhorar a busca e seleção de patrimônios disponíveis;
- mostrar dados de cada item abaixo do bem selecionado em seção recolhível,
  com erros próprios, resumo, remoção segura e preservação dos dados digitados;
- pausar confirmação enquanto houver item incompleto e focar o primeiro erro;
- aplicar máscara monetária compartilhada aos valores de orçamento e retorno;
- manter o rodapé de confirmação visível no seletor rolável de bens;
- apresentar somente o orçamento atual, sem linguagem de versões ou histórico;
- substituir a coleção de documentos por, no máximo, um anexo PDF da
  observação do pedido e um por item;
- preservar orçamento, retorno, idempotência e permissões iguais para
  Administrador e Diretor.

## Extensão aprovada — anexos e detalhes por item

### Anexo da observação do pedido

- manter o `POST /manutencoes/:manutencaoId/anexo-observacao` atual para a
  primeira inclusão;
- adicionar `PATCH /manutencoes/:manutencaoId/anexo-observacao` para substituir o
  PDF existente e `DELETE /manutencoes/:manutencaoId/anexo-observacao` para
  remover sua referência e seu arquivo físico;
- permitir inclusão, substituição e remoção somente quando o pedido estiver em
  `EM_ANDAMENTO`; pedido `CONCLUIDA` continua permitindo consulta/download, mas
  nenhuma mutação do anexo;
- bloquear o registro do pedido durante a validação de estado e a troca ou
  limpeza da referência, evitando que conclusão e mutação do anexo ocorram de
  forma concorrente.

### Anexo da observação do item

- manter o `POST /manutencoes/:manutencaoId/itens/:itemId/anexo-observacao`
  atual para a primeira inclusão;
- adicionar `PATCH /manutencoes/:manutencaoId/itens/:itemId/anexo-observacao`
  para substituir o PDF existente e
  `DELETE /manutencoes/:manutencaoId/itens/:itemId/anexo-observacao` para
  removê-lo;
- considerar o item em andamento somente quando `dataRetorno` for `null`;
- permitir qualquer mutação do anexo apenas quando, simultaneamente, o pedido
  estiver `EM_ANDAMENTO` e o item ainda não tiver retorno;
- após o retorno do item, impedir inclusão, substituição e remoção mesmo quando
  outros itens mantenham o pedido em andamento; consulta/download continuam
  disponíveis;
- bloquear pedido e item na mesma transação antes de revalidar pertencimento,
  estado e referência atual.

### Consistência do storage e concorrência

- substituição exige anexo existente e reutiliza o multipart `dados` com
  `chaveIdempotencia`; referência ausente usa o erro público de documento não
  encontrado. O `POST` continua recusando uma segunda inclusão;
- `DELETE` é idempotente: se a referência já estiver ausente, retorna sucesso
  com o detalhe atual sem tentar apagar outra chave;
- validar tipo, conteúdo e limite do novo PDF antes de alterar a referência;
- na substituição, preparar o arquivo novo com chave única, persistir a nova
  referência sob transação/lock e somente depois remover o arquivo antigo;
- se a persistência falhar, compensar o arquivo novo e preservar referência e
  arquivo antigos; se a exclusão física posterior falhar, registrar a falha sem
  expor caminhos e deixar a reconciliação idempotente remover o órfão;
- na remoção, limpar a referência no banco antes de excluir o arquivo físico,
  conforme [armazenamento local](../file-storage.md#criação-substituição-remoção-e-órfãos);
- cobrir substituições concorrentes, substituição concorrente com retorno do
  item, remoção concorrente com conclusão do pedido e repetição segura. Nenhuma
  resposta de sucesso pode apontar para arquivo inexistente;
- preservar os dois perfis já autorizados, limites, validação de PDF e proteção
  CSRF; a API deve responder `409` público quando pedido ou item tiver mudado de
  estado, independentemente do que a Web estiver exibindo.
- ampliar `CODIGOS_ERRO_MANUTENCAO` com `MANUTENCAO_CONCLUIDA` para mutação em
  pedido concluído; reutilizar `ITEM_JA_RECEBIDO` para item com retorno,
  `DOCUMENTO_MANUTENCAO_NAO_ENCONTRADO` para substituir referência ausente e
  `CONFLITO_CONCORRENTE_MANUTENCAO` quando a revalidação sob lock não puder
  concluir com segurança;
- `PATCH` e `DELETE` retornam o envelope tipado de sucesso com o detalhe
  atualizado do pedido, permitindo que a Web substitua seu estado sem inferir
  a referência. Reutilizar a abstração de documentos já aplicada à substituição
  e remoção de anexos de nota fiscal, sem duplicar lógica de storage.

### Web e feedback

- no anexo do pedido e de cada item, mostrar `Anexar` quando não houver arquivo
  e `Abrir`, `Substituir` e `Remover` quando houver;
- exibir `Substituir` e `Remover` somente nos estados mutáveis aprovados;
  enquanto a operação estiver pendente, desabilitar ações concorrentes;
- `Remover` usa variante destrutiva e confirmação explícita, identificando se o
  alvo é o pedido ou um patrimônio específico;
- sucesso de substituição/remoção usa toast; falha bloqueante ou `409` usa
  `Alert` persistente, atualiza o detalhe e explica que o pedido/item já foi
  concluído quando esse for o motivo;
- ocultar controles na Web não substitui a validação da API. A Web deve tratar
  `401`, `403`, `404` e `409` sem simular sucesso ou manter estado local obsoleto.

### Detalhes de orçamento e retorno na tabela

- adicionar em cada linha da tabela de itens uma ação acessível `Ver detalhes`,
  com `aria-expanded`, que abre uma linha/painel imediatamente associado ao
  item sem perder o contexto da tabela;
- mostrar no painel de orçamento atual: fornecedor, data, descrição, valor,
  responsável pelo registro e data/hora do registro, usando apenas os dados já
  autorizados no contrato;
- mostrar no painel de retorno: data, serviço realizado, valor realizado,
  garantia e término quando existirem, responsável pelo recebimento e data/hora
  do registro;
- representar ausência de orçamento, retorno ou garantia explicitamente, sem
  células vazias ou dados fictícios;
- antes do retorno, manter a edição do orçamento já existente; após
  `dataRetorno` ser preenchida, orçamento e retorno ficam somente leitura e a
  Web não renderiza ações de alteração;
- a API continua impedindo `PATCH` de orçamento após o retorno com `409`, e o
  retorno permanece único e sem edição/estorno. O painel de detalhes nunca
  transforma esses dados em formulário quando o item estiver retornado.

## Fora do escopo

- alterar significado de `numeroRequisicao`/`numeroEmpenho`;
- reiniciar numeração por ano;
- excluir pedidos ou itens já confirmados;
- mudar regra de retorno ou garantia.
- editar ou excluir o próprio pedido/item, a observação textual, orçamento ou
  retorno já confirmado;
- manter histórico ou múltiplas versões de anexos de observação;
- remover a possibilidade de abrir/download do anexo após a conclusão.

## Decisões aprovadas

- sequência é global e gaps são aceitáveis;
- o banco usa `BIGINT`, enquanto API/Web usam string decimal;
- itens ficam inline e recolhíveis; não usam modal de configuração;
- o orçamento persistido continua protegido por concorrência, mas a interface
  mostra somente o estado atual e não promete consulta histórica;
- anexos de manutenção são recursos únicos da observação, sem fase ou lista;
- `POST` inclui, `PATCH` substitui e `DELETE` remove o recurso único; substituir
  ou remover não cria histórico de anexos;
- pedido `CONCLUIDA` e item com `dataRetorno` são imutáveis para anexos na API e
  na Web; a validação da API é obrigatória mesmo sem controles visíveis;
- detalhes de orçamento e retorno permanecem consultáveis depois da conclusão,
  sempre em modo somente leitura;
- ambos os perfis mantêm acesso total às operações existentes.

## Critérios de aceite

- [x] interface usa primitives shadcn, tokens e composições compartilhadas sem
      duplicar controles equivalentes.
- [x] controles seguem a semântica de InPATCH, Textarea, Checkbox, Select e
      Combobox; teclado, foco, loading, disabled, contraste e reflow permanecem
      funcionais.
- [x] erros de campo, erros gerais, toasts, alerts persistentes e confirmações
      destrutivas seguem os critérios desta task, com mensagens orientadas à
      ação e sem detalhes técnicos.
- [x] qualquer evolução de contrato feita para melhorar feedback possui
      cobertura de validação, API, consumidores, testes e documentação, sem
      enfraquecer autorização ou alterar regra de negócio silenciosamente.

- [x] migration aplica desde banco vazio e sobre histórico com backfill estável.
- [x] pedidos concorrentes recebem números distintos e crescentes.
- [x] lista, detalhe, busca e cabeçalho operacional usam `Pedido #n`.
- [x] UUID deixa de ser identificação visível, mas continua chave técnica da URL.
- [x] seleção e seções de itens funcionam por teclado e em viewport estreita.
- [x] erro de um item abre a seção correta e move o foco.
- [x] orçamento, retorno, upload/download do anexo único e idempotência não
      sofrem regressão.

### Critérios de aceite da extensão

- [x] pedido em andamento permite substituir/remover seu anexo; pedido
      concluído recebe `409` na API e não mostra essas ações na Web.
- [x] item sem retorno em pedido em andamento permite substituir/remover seu
      anexo; item retornado recebe `409` mesmo se o pedido continuar aberto.
- [x] substituição bem-sucedida preserva somente a nova referência e remove o
      arquivo antigo; falha antes do commit preserva o anexo anterior e limpa o
      novo arquivo.
- [x] remoção limpa a referência antes da exclusão física e a reconciliação
      cobre qualquer falha de compensação sem apagar arquivo ainda referenciado.
- [x] concorrência entre anexo, retorno e conclusão não permite mutação tardia,
      referência quebrada ou arquivo final órfão fora da carência operacional.
- [x] inclusão, substituição e remoção são autorizadas e testadas nos dois
      perfis; chamadas sem sessão, sem CSRF ou com alvo divergente são negadas.
- [x] cada linha permite consultar detalhes completos do orçamento e retorno por
      teclado, inclusive após a conclusão e em viewport estreita.
- [x] orçamento não pode ser alterado após o retorno na API nem na Web; retorno
      registrado permanece único, somente leitura e sem ação de estorno.
- [x] feedback de sucesso, confirmação destrutiva e conflitos de estado seguem
      as diretrizes comuns desta task e atualizam o detalhe sem estado obsoleto.

## Arquivos ou módulos potencialmente afetados

- nenhuma mudança de schema ou nova migration foi necessária para a extensão;
- `packages/contracts/src/manutencao/`;
- `apps/api/src/modules/manutencoes/`;
- `apps/api/src/common/storage/` ou abstração equivalente de documentos e
  reconciliação;
- `apps/web/app/(sistema)/manutencoes/` e `apps/web/features/manutencoes/`;
- [armazenamento local](../file-storage.md);
- dashboard, relatórios de manutenção, seed e fixtures;
- testes de migration, API, Web e integração real.

## Verificações esperadas

- histórico completo de migrations e `prisma migrate diff --exit-code` em
  PostgreSQL descartável;
- contratos, API e Web: lint, tipos, testes e build;
- concorrência real e backfill com dados legados fictícios;
- Web E2E nos dois perfis, incluindo documentos e retorno parcial;
- API/E2E de `POST`, `PATCH`, `DELETE` e download para pedido/item em andamento,
  retornado e concluído, incluindo concorrência e falhas de storage;
- teste de reconciliação garantindo que arquivos referenciados nunca sejam
  removidos e que órfãos da substituição/remoção sejam limpos após a carência;
- Web E2E da confirmação de remoção, substituição, `409` por estado alterado e
  expansão acessível dos detalhes de orçamento/retorno;
- axe, teclado, reflow, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Resultado verificado da baseline

- `numeroPedido` foi adicionado como `BIGINT` global, único, imutável e gerado
  por sequence. O backfill usa `created_at, id`, o contrato o serializa como
  string decimal e a busca aceita o número sem conversão para `number`.
- A criação apresenta cada bem em seção inline recolhível, preserva os dados
  digitados, exige o conjunto completo do orçamento opcional, destaca os
  campos inválidos e abre/focaliza o primeiro item que precisa de correção.
- Os Guards das rotas de manutenção foram auditados e autorizam
  `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`. Os testes PostgreSQL exercitam criação,
  orçamento, retorno, upload e download alternando os dois perfis.
- A evolução complementar aplica `MoneyInPATCH`, usa `Select` para opções fixas e
  `Combobox` para fornecedores, mantém o rodapé do seletor de bens visível e
  garante espaçamento inferior nos dialogs.
- A migration complementar consolida o documento mais recente nos campos de
  anexo da observação sem apagar arquivos físicos excedentes, remove a tabela
  `documentos_manutencao`, seu enum de fases e a FK de idempotência.
- O histórico completo de 31 migrations aplicou em PostgreSQL 17 descartável e
  `prisma migrate diff --exit-code` não encontrou drift. Dois testes próprios
  provaram banco vazio, backfill determinístico e continuidade da sequence; um
  terceiro consolidou múltiplos documentos legados pelo mais recente e
  confirmou a remoção da tabela. Os testes PostgreSQL focados aprovaram 10
  cenários de migration, concorrência, autorização, upload e idempotência.
- O seed geral foi executado em banco e storage descartáveis: a auditoria
  confirmou 2 anexos de observação em pedidos, 3 em itens, 25 PDFs físicos e
  ausência de `documentos_manutencao`.
- Contratos passaram em tipos e 159 testes; API passou em lint, tipos, build e
  suíte unitária, incluindo os 10 testes focados de seed/reconciliação; Web
  passou em lint, tipos, build, 159 testes Vitest e 4 cenários Playwright com os
  dois perfis, axe, máscara monetária, foco de erro, rodapé visível e viewport
  de 390 px. `git diff --check` passou.

## Resultado verificado da extensão

- A API expõe `PATCH` e `DELETE` do anexo único tanto no pedido quanto no item,
  com os mesmos Guards de `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`, CSRF nas
  mutações, retorno do detalhe atualizado e `DELETE` idempotente.
- Pedido concluído e item retornado são revalidados sob lock. Testes reais
  provaram substituição concorrente com retorno e remoção concorrente com
  conclusão; o retry passou a reconhecer também os códigos PostgreSQL `40001`
  e `40P01`, impedindo que disputa serializável resulte em erro interno.
- A coordenação compartilhada de documentos mantém a ordem gravar, trocar a
  referência e remover o arquivo anterior; na remoção, limpa a referência antes
  da exclusão física. Os testes existentes cobrem compensação e preservação do
  arquivo referenciado quando a persistência falha.
- A Web apresenta `Anexar`, `Abrir`, `Substituir` e `Remover` conforme o estado,
  confirma a remoção destrutiva e atualiza o detalhe após sucesso ou conflito.
  Cada item expande orçamento atual e retorno em regiões acessíveis e únicas.
- Contratos e Web aprovaram 159 testes cada. API aprovou os 8 testes PostgreSQL
  focados; o E2E HTTP inclui as quatro rotas novas, os dois perfis, sessão/CSRF,
  estados imutáveis e concorrência. O build Web e os 4 cenários Playwright no
  Chromium passaram com auditoria Axe e viewport de 390 px.

## Limites da verificação da baseline

- O PostgreSQL foi descartável; nenhum banco de desenvolvimento, staging ou
  produção recebeu a migration.
- Axe e viewport estreita foram automatizados no Chromium. Leitor de tela,
  zoom manual de 200% e navegadores adicionais não foram exercitados.
- O build alertou que o Next.js 16.4.3 possui vulnerabilidade conhecida; a
  atualização de dependência permanece fora desta task.
