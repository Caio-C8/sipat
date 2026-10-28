# MOVIMENTACOES-001 — Transferir e consultar patrimônios entre setores

**Status:** implementada e verificada em 28/10/2026.
**Planejamento aprovado:** 27/10/2026.

## Objetivo e dependências

Implementar a API de transferências comuns e a consulta de registros individuais,
incluindo os originados em correções de inventário.
Depende de [CONTRACTS-012](./CONTRACTS-012-contratos-movimentacoes.md)
implementada e verificada; cadastro/consulta patrimonial, comissões, setores,
autenticação e [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md)
são dependências existentes a confirmar no código.

## Fontes de verdade

- [RF13, RF19 e UC13](../requisitos-SIPAT.md).
- [Política de acesso planejada](../security-and-access.md#movimentações--política-implementada).
- [Roadmap geral](../roadmap.md#movimentações-entre-setores--planejamento-aprovado).
- [API](../apps/api/README.md), [segurança](../apps/api/security/README.md),
  [services](../apps/api/services.md), [repositories](../apps/api/repositories.md),
  [performance](../apps/api/performance.md), [banco](../performance/database.md)
  e [workflow/testes](../apps/api/workflow-and-testing.md).
- [Guia e transporte](../../PROMPTS-MOVIMENTACOES.md).
- Figma: [consulta](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3229),
  [seleção](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3471),
  [destinos](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3728)
  e [revisão](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-4123).

## Estado de partida no planejamento

Não há módulo geral de movimentações. Existe TransferenciaPatrimonio com UUID
por registro, sem código TR e sem lote; a correção de inventário grava nessa
entidade. A inspeção do schema/migrations não comprova a estrutura do banco em
execução. InventariosPolicyService não possui método geral pronto para
transferência; não basta chamar uma verificação fora da transação.

## Escopo

- Implementar listagem, detalhe individual, confirmação e auxiliares definidos
  em CONTRACTS-012, sem ampliar GET /setores ou GET /comissoes administrativos.
- Manter Guards de sessão, perfil e CSRF; leitura para ambos os perfis,
  registro somente para diretor, auxiliares conforme contexto.
- Criar domínio NestJS com DTOs, controller, service, repository, mappers,
  tipos, testes e registro no AppModule, respeitando apps/api/AGENTS.md.
- Registrar comissão e motivo comuns em cada transferência, com origem,
  autoria e instante do servidor; cada patrimônio conserva seu próprio UUID.
- Atualizar localização e inserir todos os históricos da confirmação na mesma
  transação. Limite de dez, patrimônio único e nenhum sucesso parcial.
- Revalidar ATIVO, destino existente/ativo/diferente, origem esperada, comissão
  vigente e inventários no estado transacional atual. Origem inativa é aceita.
- Calcular o dia da vigência e dos filtros em America/Sao_Paulo; respostas ISO
  UTC; nenhuma data manual. Instante único por confirmação e preservado em replay.
- Identificar correção pelo vínculo ItemInventario.transferenciaCorrecaoId,
  sem gerar registros retroativos nem inferir a origem pelo texto da observação.
- Adequar persistência somente quando necessária à idempotência, concorrência e
  consultas aprovadas. Migration futura deve preservar dados existentes,
  observação nullable e vínculos de correção; não criar entidade de lote.

### Inventários: mudança aprovada, ainda a implementar

Aplicar a seção específica de RF19 para transferências comuns. Ao consultar
todos os inventários não finalizados pertinentes, qualquer conferência
PENDENTE ou EM_ANDAMENTO de origem ou destino impede a confirmação inteira.
CONCLUIDO não impede por si só; não consultar apenas o inventário mais recente.

Para patrimônio incluído em inventário aberto, preservar a restrição de destino
fora dos setores daquela população fixa. Não ampliar essa restrição para um bem
que não pertença ao inventário. Não adicionar/remover itens da população,
reabrir conferências nem sobrescrever resultados já verificados.

Cobrir criação de inventário e início de conferência concorrentes: se a
restrição se consolidar antes da transferência, esta falha; se a transferência
se consolidar antes, a criação/conferência deve observar o estado coerente
resultante. Não permitir um resultado impossível em execução serial.
A estratégia deve abranger também corridas com mudança/inativação de destino,
alteração de comissão e outro registro sobre o mesmo patrimônio.

O service de movimentações usa services/policies de outros domínios, não seus
repositories diretamente. Projetar a propagação do contexto transacional,
locks e ordem de aquisição sem abrir uma segunda transação independente.
A escolha concreta deve ser comprovada em PostgreSQL isolado.

Correções de inventário continuam no fluxo específico. Não encaminhá-las
automaticamente pelo novo registro comum, aplicar-lhes o bloqueio B nem
introduzir revalidação de vigência, motivo obrigatório, limite de dez ou
elegibilidade nova. Preservar todas as validações existentes.

### Idempotência e concorrência

- A chave técnica é vinculada ao usuário autenticado e à operação de registro.
  Autenticação/perfil/CSRF continuam exigidos também no reenvio.
- Persistir identificação do pedido e resultado de sucesso junto da transação;
  não usar somente memória do processo ou estado do navegador.
- Mesma chave e mesmo payload validado recuperam o resultado original sem
  reexecutar regras de transferência sobre a localização já modificada.
  Mesma chave com conteúdo diferente retorna conflito.
- Duas requisições simultâneas com a mesma chave não podem produzir dois
  conjuntos de registros. Se ainda não houver resultado recuperável, usar o
  conflito público de processamento e permitir nova consulta pelo mesmo envio.
- Falha/rollback não pode deixar localização, histórico ou sucesso de
  idempotência parcialmente gravados. Não registrar falha como sucesso.
- Não expirar silenciosamente uma chave bem-sucedida tornando-a reutilizável;
  preservar vínculo suficiente para reconhecer reenvios enquanto os registros
  permanecerem existentes. Não criar código comercial nem entidade de lote.
- Retry transacional interno é finito e seguro; não confundir com repetição HTTP.
  A Web conserva a chave quando o resultado for desconhecido.
- Origem esperada é comparada à origem persistida; cliente não escolhe origem
  histórica nem usuário. Locks/revalidação devem impedir duas atualizações
  baseadas na mesma origem obsoleta.

### Erros e histórico

Seguir códigos e paths de CONTRACTS-012. Identificar impedimentos por item
mantendo os índices originais; não retornar sucesso parcial. Motivo e comissão
comuns usam paths globais. Não expor detalhes SQL ou stack.
Não tratar uma falha de rede como prova de rollback.
Paginar consulta e auxiliares; filtros históricos não excluem setores inativos
ou comissões vencidas. Não apresentar nomes atuais como snapshots históricos.

## Fora do escopo

Web, mobile, edição/exclusão/estorno, outras operações patrimoniais, migração
retroativa de motivos, código TR, lote de domínio e mudança das regras de
correção de inventário. A pendência futura de vigência dessas correções está
registrada em RF19 e não bloqueia esta tarefa.

## Critérios de aceite verificáveis

- [x] Diretor registra; administrador recebe 403 ao registrar e consulta lista,
      detalhe e filtros; anônimo recebe 401; CSRF é exercitado com Guards reais.
- [x] Confirmações com 1 e 10 bens válidos produzem exatamente 1 e 10 registros
      independentes e mudam seus setores; comissão/motivo/instante são comuns.
- [x] Qualquer item inválido, repetido ou acima do limite deixa todos os setores
      e históricos intactos; response identifica os itens corrigíveis.
- [x] BAIXADO, EMPRESTADO, EM_MANUTENCAO, destino inativo/igual e comissão fora
      da vigência são recusados; origem inativa com destino válido é aceita.
- [x] Comissão vigente sem membros/presidente continua elegível conforme RF05.
- [x] Testar fronteiras do dia de São Paulo e dias inicial/final da vigência.
- [x] Origem ou destino PENDENTE/EM_ANDAMENTO em qualquer inventário aberto
      bloqueia; CONCLUIDO não bloqueia isoladamente; inventário FINALIZADO não
      aciona esse bloqueio, mesmo com correções pendentes.
- [x] Patrimônio incluído não sai para setor fora da população do inventário
      aberto; demais bens não recebem essa restrição por simples coincidência.
- [x] Transferência entre setores concluídos preserva itens e resultados; a
      operação de correção específica conserva comportamento e validações.
- [x] Dois envios com chave igual, inclusive concorrentes e após reinício do
      processo, retornam no máximo um conjunto; payload diferente conflita.
- [x] Duas confirmações distintas sobre a mesma origem, criação/início de
      inventário concorrentes e inativação/alteração de comissão não deixam
      estado inconsistente; rollback é comprovado em PostgreSQL isolado.
- [x] Listagem inclui registros comuns/correções, aceita histórico nullable,
      filtra e pagina deterministicamente; detalhe identifica um único UUID.
- [x] Não há N+1 ou consulta ilimitada; índices atendem queries aprovadas.
- [x] Verificações passam antes de atualizar o status da capacidade.

## Arquivos de referência e alterações previstas

Existentes: apps/api/AGENTS.md; apps/api/src/app.module.ts;
apps/api/src/modules/patrimonios/, inventarios/, setores/, comissoes/ e auth/;
packages/database/prisma/schema.prisma e migrations/;
packages/contracts/src/index.ts.
Propostos: apps/api/src/modules/movimentacoes/ e eventuais migrations técnicas,
somente na execução desta tarefa. Confirmar os caminhos e preservar alterações
alheias. Reusar a infraestrutura singleton de banco.

## Verificações esperadas e pendências

Lint, typecheck, testes unitários/E2E e build de @repo/api; contratos;
Prisma/client/consumidores se afetados; testes reais de concorrência e rollback
em PostgreSQL descartável. Nunca usar banco operacional como base de testes.
Atualizar tarefa, roadmap e matriz do guia somente com evidências reais.

No planejamento de 27/10/2026 não havia validação de implementação; a execução está registrada abaixo. Dependência
bloqueante de execução: CONTRACTS-012 concluída e verificada. Desenho físico de
idempotência e coordenação transacional são trabalho técnico desta tarefa,
não autorização para mudar regras de produto.

## Execução e evidências — 28/10/2026

Entregues módulo, DTOs, controller, service, repository, tipos e mappers em
`apps/api/src/modules/movimentacoes/`, registrados no AppModule. As operações HTTP de registro/consulta e os dois auxiliares respeitam a matriz de perfis, sessão e CSRF.
Listagens usam paginação limitada e joins/seleções explícitas, sem N+1.

A confirmação usa uma transação SERIALIZABLE, com até três tentativas para
serialização/deadlock e uma chave advisory não bloqueante por usuário/pedido.
A ordem é chave, comissão, inventários pertinentes por ID, destinos por ID e
patrimônios por ID. Services dos outros domínios recebem o mesmo TransactionClient;
não há transação interna independente. Locks SHARE dos inventários coordenam
início/conferência/correção; os predicados serializáveis coordenam a criação
concorrente da população, comprovada com os services reais no PostgreSQL.

A tabela técnica `idempotencias_movimentacao` conserva hash do payload validado
e snapshot allowlisted do sucesso na mesma transação. Não é lote de domínio,
não expira chaves e não altera registros antigos. O replay preserva até os
valores relacionados do resultado original. A consulta normal continua usando
os cadastros atuais. UUIDs de entrada são normalizados para caixa baixa, conforme a equivalência do [tipo UUID no PostgreSQL](https://www.postgresql.org/docs/current/datatype-uuid.html).

Verificações: lint, typecheck e build da API; lint/typecheck do banco, geração
Prisma; 395 testes passaram em 53 suítes. Outros 68 testes PostgreSQL de módulos
anteriores ficaram desabilitados por não terem suas URLs próprias; não foram
contados como validação. A suíte nova executou de fato 24 cenários HTTP/PostgreSQL
e dois testes de datas, incluindo rollback após primeira escrita, bloqueios controlados de
concorrência, chaves simultâneas, nova instância, vigência civil, regra B,
população fixa, correção sem observação e uso do índice pelo EXPLAIN.

A migration `20261028120000_adiciona_movimentacoes_001` é aditiva e foi aplicada
pelo Prisma no banco local `localhost:5433/sipat` e no banco isolado
`sipat_movimentacoes001_test_1793200237429`. Também foi aplicada no local a
migration pendente `20261027210000_adiciona_sessoes_mobile`, trazida pelo pull.
`migrate status` confirmou 18 migrations aplicadas; `migrate diff` não encontrou
diferença entre banco local e schema. As contagens locais conferidas permaneceram
1 usuário e zero patrimônios/transferências/inventários/itens. Não houve reset,
seed operacional, drop ou uso de bens operacionais em testes.

A reprodução dos testes reais está na tarefa Web. As três tarefas permaneceram
sem staging, commit ou push. O stash anterior à sincronização foi preservado.
