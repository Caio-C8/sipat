# SEED-GERAL-001 — Base realista para desenvolvimento e staging

**Status:** concluída em 30 de outubro de 2026.

## Objetivo

Entregar um seed opt-in, reproduzível e protegido que prepare uma base sintética
realista para validar o SIPAT em `development` e `staging`. A execução deve usar
os services da API para criar e transicionar entidades de domínio, produzir os
documentos privados correspondentes e terminar com uma base coerente para testes
manuais pelas interfaces e rotas existentes.

O seed não substitui testes automatizados nem comprova o comportamento HTTP
completo. Guards, controllers, pipes e CSRF continuam cobertos pelos testes e
percursos próprios da API.

## Contexto e referências

- [Roadmap do SIPAT](../roadmap.md)
- [Ambientes](../environments.md)
- [Identidade, sessão e acesso](../security-and-access.md)
- [Armazenamento privado de documentos](../file-storage.md)
- [RF09, RF10, RF18, RF19, UC09, UC10, UC18 e UC19](../requisitos-SIPAT.md)
- [Arquitetura e estado da API](../apps/api/README.md)

### Leitura obrigatória do implementador

Antes de editar, o agente deve ler e confirmar o estado real destes arquivos:

1. `AGENTS.md`, `apps/api/AGENTS.md` e `docs/README.md`;
2. `docs/environments.md`, `docs/security-and-access.md` e
   `docs/file-storage.md`;
3. `docs/apps/api/README.md`, `docs/apps/api/services.md` e
   `docs/apps/api/workflow-and-testing.md`;
4. `packages/database/prisma/schema.prisma`,
   `packages/database/prisma.config.ts` e `packages/database/src/index.ts`;
5. `apps/api/src/app.module.ts`, `apps/api/src/environment.ts`,
   `apps/api/src/commands/provisionar-administrador.ts`,
   `apps/api/src/modules/auth/provisionamento-admin.ts` e
   `apps/api/webpack.config.js`;
6. os services, modules e contratos de usuários, responsáveis, setores,
   naturezas, espécies, fornecedores, comissões, processos de compra, notas
   fiscais, patrimônios, inventários e manutenções;
7. `apps/api/src/common/storage/`, com atenção a staging, compensação,
   reconciliação e validação de PDF;
8. `package.json`, `apps/api/package.json`, `compose.yaml`,
   `compose.staging.yaml` e `docker/api.Dockerfile`;
9. as tarefas já verificadas
   [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md),
   [COMPRAS-001](./COMPRAS-001-gerenciar-processos-compra.md),
   [NOTAS-FISCAIS-001](./NOTAS-FISCAIS-001-gerenciar-notas-anexos.md),
   [COMISSOES-001](./COMISSOES-001-gerenciar-comissoes.md),
   [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md),
   [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md) e
   [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md).

Se algum caminho tiver mudado, o implementador deve localizar o símbolo atual
com `rg` e atualizar esta referência, sem presumir que o estado histórico ainda
é válido.

## Escopo

- Criar um comando Nest standalone, sem listener HTTP, compilado na imagem da
  API e capaz de resolver os services por injeção de dependências.
- Validar explicitamente cada entrada pelos schemas de `@repo/contracts`, pois
  o contexto standalone não executa o `ZodValidationPipe` dos controllers.
- Criar um serviço one-shot no Compose com a mesma imagem, rede interna,
  configuração de banco e bind mount de uploads da API.
- Expor na raiz os comandos:
  - `pnpm db:seed:geral:development`;
  - `pnpm db:seed:geral:staging`.
- Fazer `pnpm db:seed:geral:staging` carregar `.env.staging` e executar o
  serviço one-shot no Compose, sem exigir que o operador monte manualmente uma
  `DATABASE_URL` nem grave PDFs fora do volume usado pela API.
- Permitir somente `APP_ENV=development` ou `APP_ENV=staging`, com opt-in e
  confirmação explícitos; recusar incondicionalmente `production` e `test`.
- Exigir banco sem dados de domínio, migrations atuais e armazenamento gravável
  antes da primeira escrita.
- Produzir dados sintéticos determinísticos, plausíveis, variados e claramente
  identificados como demonstração, sem copiar pessoas, empresas, documentos ou
  contatos reais.
- Criar os documentos PDF privados necessários pelos mesmos boundaries de
  armazenamento usados pela aplicação.
- Validar as contagens, distribuições, relações, arquivos e estados finais
  antes de concluir.
- Documentar operação, variáveis, credenciais, falhas parciais e recriação do
  ambiente.

## Fora do escopo

- Executar ou criar baixas, movimentações comuns, depreciações, reavaliações,
  empréstimos ou substituições de número patrimonial.
- Corrigir divergências de inventário quando a correção produzir transferência.
- Criar inventário não finalizado.
- Criar rotas, contratos externos ou semânticas de produto exclusivas para o
  seed.
- Executar em produção ou oferecer opção capaz de ignorar essa proibição.
- Limpar, truncar, resetar ou sobrescrever automaticamente um banco existente.
- Transformar o seed em teste E2E HTTP ou usar sua execução como evidência de
  Guards, controllers, cookies, CSRF ou consumidores Web/mobile.
- Remover ou alterar o comportamento dos seeds locais específicos existentes;
  eventual descontinuação pertence a uma decisão posterior.

## Decisões aprovadas

### Estratégia de criação

- Criações e transições de domínio passam pelos services da API.
- Prisma direto fica limitado a pré-verificação, leituras de orquestração,
  auditoria final e ao bootstrap do primeiro administrador pelo mecanismo já
  aprovado.
- O primeiro administrador usa `provisionarPrimeiroAdministrador`; os demais
  usuários usam `UsuariosService`.
- As contas terminam ativas e com primeiro acesso concluído pelo fluxo de auth,
  sem alteração direta de senha ou de `trocaSenhaObrigatoria` no banco.
- Senhas são recebidas por variáveis não versionadas, não possuem valor padrão
  em staging e não são impressas em logs.
- O seed completo não será envolvido em uma transação global: Argon2,
  filesystem e services possuem boundaries próprios. Falha parcial exige
  recriação do banco e dos uploads do ambiente de teste antes de nova tentativa.

### Proteções de ambiente

- A execução exige `SIPAT_ALLOW_DEMO_SEED=true` e uma confirmação explícita que
  coincida com `APP_ENV`.
- `production` deve falhar antes de qualquer consulta mutável ou escrita em
  filesystem.
- O seed deve consultar o estado real do banco e recusar qualquer dado de
  domínio preexistente, inclusive uma execução parcial anterior.
- O comando de staging usa um serviço one-shot do Compose, com `restart: "no"`,
  a mesma rede interna e o mesmo bind mount de `UPLOADS_ROOT_PATH=/data/uploads`
  da API. Ele não depende de executar dentro do processo servidor já ativo.
- O serviço one-shot não pertence ao startup normal do stack e só deve ser
  acionado pelo comando explícito de seed.
- Desenvolvimento e staging nunca compartilham banco, volume ou credenciais.

### Massa de dados base

| Entidade            | Quantidade | Estado ou distribuição                                  |
| ------------------- | ---------: | ------------------------------------------------------- |
| Usuários            |          2 | um Administrador e um Diretor, ativos e utilizáveis     |
| Responsáveis        |         10 | matrículas únicas e dados sintéticos                    |
| Setores             |         10 | ativos, cada um com responsável, sala e ramal           |
| Naturezas           |          5 | categorias patrimoniais distintas                       |
| Espécies            |         10 | duas por natureza                                       |
| Fornecedores        |          5 | ativos, completos, fictícios e reutilizados             |
| Comissões           |          3 | duas encerradas e uma vigente                           |
| Membros de comissão | 9 vínculos | três por comissão, exatamente um presidente em cada uma |
| Processos de compra |         10 | um por grupo de cinco patrimônios                       |
| Notas fiscais       |         20 | duas por processo                                       |
| PDFs de nota fiscal |         20 | um PDF válido, privado e identificável por nota         |
| Patrimônios         |         50 | cinco por setor                                         |
| Inventários         |          1 | completo e finalizado                                   |
| Manutenções         |          2 | uma concluída e uma em andamento                        |

Os dados visíveis usam descrições coerentes, como notebooks, estações de
trabalho, monitores, projetores, impressoras, equipamentos de rede, aparelhos
de ar-condicionado e mobiliário. Não usar nomes apresentados ao usuário como
`Patrimônio 1`, `Setor 2` ou `Fornecedor 3`.

E-mails devem usar domínio reservado para exemplos. Nomes, CNPJs, telefones,
endereços, matrículas, números fiscais e documentos devem ser sintéticos e não
podem afirmar vínculo com pessoa ou empresa real.

### Processos, notas e patrimônios

- Cada processo possui número, ano, empenho, valor total e observação.
- Cada processo possui exatamente duas notas, ambas com fornecedor e PDF.
- O valor total do processo corresponde à soma dos valores de incorporação dos
  cinco patrimônios vinculados. A nota atual não possui valor próprio no modelo;
  o seed não deve inventar esse campo.
- Datas preservam a sequência processo/aquisição, emissão e tombamento aceita
  pelos contratos e regras vigentes.
- Cada setor recebe exatamente quatro patrimônios oficiais e um sem número
  oficial, totalizando 40 oficiais e 10 provisórios.
- Descrições, marcas, modelos, séries, datas, valores, espécies e formas de
  incorporação variam por uma matriz explícita e reproduzível, não por geração
  aleatória opaca.
- Todos os patrimônios possuem processo de compra, situação contábil inicial e
  relações válidas. Alguns podem possuir parâmetros iniciais de depreciação,
  mas nenhuma competência é executada.

### Comissões

- Cada comissão possui três responsáveis distintos e exatamente um presidente.
- As composições e presidências variam entre as três comissões; responsáveis
  podem participar de mais de uma comissão.
- Duas vigências terminam antes da data-base; a comissão vigente inclui a data
  civil da execução.
- Inventário e manutenção usam somente uma comissão que esteja vigente na data
  exigida pelo respectivo service.

### Inventário

- O inventário é criado quando os 50 patrimônios ainda estão `ATIVO`, portanto
  materializa dez setores e cinquenta itens.
- O resultado final planejado é: 40 itens corretos, sete não localizados e três
  divergências preservadas sem correção.
- Divergências não são corrigidas pelo seed, pois a correção criaria uma
  transferência, que permanece fora do escopo.
- Todos os setores são iniciados e concluídos na ordem exigida, e o inventário
  é finalizado com a confirmação explícita aplicável às pendências.
- Nenhum inventário fica aberto; o usuário pode criar um novo pela interface
  usando a comissão vigente.

### Manutenções

- Depois da finalização do inventário, criar uma manutenção de três itens e
  concluí-la com orçamentos, fornecedores, serviços, valores, garantias,
  retornos e documentos coerentes. Os três patrimônios voltam a `ATIVO`.
- Criar uma segunda manutenção com três itens e deixá-la em andamento: um item
  com orçamento completo, um aguardando orçamento e um com fornecedor e
  previsão de retorno.
- O estado final contém 47 patrimônios `ATIVO` e três `EM_MANUTENCAO`.
- Documentos de manutenção são PDFs privados válidos e usam fases e vínculos
  aceitos pelos contratos atuais.

### Datas e determinismo

- Capturar uma única data-base civil de `America/Sao_Paulo` no início.
- Derivar vigências, emissões, tombamentos, envios, previsões e retornos dessa
  data, preservando a ordem cronológica.
- Não usar `Math.random()` para conteúdo, relações ou estados. Uma execução em
  banco vazio na mesma data deve gerar a mesma matriz lógica, embora UUIDs e
  números de sequences possam variar.

## Critérios de aceite

- [x] `pnpm db:seed:geral:development` executa explicitamente o seed com a
      configuração de desenvolvimento documentada.
- [x] `pnpm db:seed:geral:staging` carrega `.env.staging`, executa o serviço
      one-shot no Compose e usa o banco e o volume privado de staging.
- [x] Ambos os comandos recusam ambiente, confirmação, banco, migration ou
      armazenamento incompatível antes de criar registros de domínio.
- [x] `production` e `test` são recusados sem escrita, mesmo que a flag opt-in
      esteja presente.
- [x] Entradas de services são validadas pelos schemas públicos correspondentes.
- [x] O build da API contém o entrypoint standalone e a imagem runner consegue
      executá-lo sem dependências de desenvolvimento.
- [x] A execução cria exatamente as quantidades e distribuições aprovadas.
- [x] Cada setor termina com cinco patrimônios, sendo quatro oficiais e um sem
      número oficial.
- [x] Os dez processos possuem duas notas e dois PDFs cada; seus valores totais
      correspondem aos cinco patrimônios vinculados.
- [x] As três comissões possuem três membros e um único presidente; duas estão
      encerradas e uma vigente na data-base.
- [x] O inventário finalizado possui cinquenta itens: 40 corretos, sete não
      localizados e três divergentes sem transferência de correção.
- [x] A manutenção concluída preserva histórico e devolve três bens a `ATIVO`;
      a aberta deixa três bens em `EM_MANUTENCAO`.
- [x] O estado final contém 40 números oficiais, dez provisórios, 47 bens
      `ATIVO` e três `EM_MANUTENCAO`.
- [x] Banco parcialmente preenchido e segunda execução são recusados sem
      duplicação ou sobrescrita.
- [x] Logs não expõem senhas, tokens, conteúdo sensível, `DATABASE_URL` nem
      caminhos privados persistidos.
- [x] README e documentação de ambientes explicam preparação, variáveis,
      comandos, resultado, falha parcial e recriação segura.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/commands/` e novo módulo/orquestrador do seed;
- `apps/api/src/modules/*/*.module.ts`, somente quando um service necessário
  ainda não estiver exportado de forma pública pelo módulo;
- `apps/api/webpack.config.js` e `apps/api/package.json`;
- `package.json`;
- `compose.yaml` e, somente se necessário, `compose.staging.yaml`;
- `docker/api.Dockerfile`, somente se a imagem runner não contiver o artefato
  compilado ou runtime necessário;
- `packages/contracts/src/`, apenas para consumir schemas existentes, sem mudar
  contratos externos;
- `packages/database/prisma/`, somente para configurar o entrypoint oficial se
  a implementação mantiver integração com `prisma db seed`; não criar migration
  para dados de demonstração;
- `README.md`, `docs/environments.md`, `docs/apps/api/README.md` e esta tarefa;
- testes da API e suportes de PostgreSQL/armazenamento descartáveis.

## Verificações esperadas

1. Formatação, links relativos e `git diff --check` da documentação.
2. Geração do Prisma Client quando necessária.
3. Lint, typecheck, testes e build de `@repo/api`.
4. Verificações dos packages afetados e consumidores compilados.
5. Testes unitários da matriz, datas, proteções, logs e auditoria final.
6. Teste de integração em PostgreSQL descartável e diretório temporário real de
   uploads, começando por schema migrado e vazio.
7. Execução real do comando de desenvolvimento.
8. Execução real do comando de staging em stack local isolado, sem tratá-la
   como evidência de execução em um staging compartilhado ou remoto.
9. Inspeção no banco e filesystem das contagens, relações, hashes, estados,
   PDFs e ausência das operações fora do escopo.
10. Casos negativos para `production`, `test`, opt-in ausente, confirmação
    divergente, banco não vazio, migrations pendentes e uploads sem escrita.

## Ordem de implementação

1. Confirmar contratos, services exportados, build e topologia Compose atuais.
2. Implementar proteções e pré-verificação sem escrita.
3. Implementar matriz determinística e validação por contratos.
4. Implementar bootstrap e contas utilizáveis.
5. Criar catálogos, responsáveis, setores, fornecedores e comissões.
6. Criar processos, notas e PDFs.
7. Criar os cinquenta patrimônios e auditar a distribuição.
8. Criar, conferir e finalizar o inventário.
9. Criar a manutenção concluída e a manutenção aberta.
10. Auditar estado final, encerrar o contexto Nest e emitir resumo seguro.
11. Integrar os dois comandos raiz e o serviço one-shot de staging.
12. Executar as verificações proporcionais e atualizar o status somente com as
    evidências realmente obtidas.

## Pendências ou decisões bloqueantes

- Nenhuma. A matriz, os ambientes autorizados, as operações excluídas e o
  comando obrigatório de staging foram aprovados.

## Evidências da conclusão

- o Prisma Client foi regenerado e `@repo/api` passou em lint, typecheck, build
  e 382 testes; 18 suítes/98 testes condicionais permaneceram skipped pela
  configuração da execução;
- os oito testes unitários específicos cobriram ambiente, opt-in, confirmação,
  credenciais, data civil, CNPJ sintético, migrations e banco não vazio;
- `production` e `test` foram recusados pelo artefato compilado antes de avaliar
  o módulo Nest;
- a imagem runner foi construída e o serviço one-shot executado em um projeto
  Compose local isolado, com PostgreSQL 17 migrado e bind mount temporário;
- a auditoria interna e uma inspeção externa confirmaram 2 usuários utilizáveis,
  10 setores, 50 patrimônios, 10 processos, 20 notas, 3 comissões, inventário
  `40/7/3`, manutenções `1 concluída/1 em andamento`, estados `47/3`, numeração
  `40/10`, 8 documentos de manutenção e 28 PDFs físicos;
- a segunda execução foi recusada sem alterar os agregados; transferências,
  baixas, depreciações e reavaliações permaneceram zeradas;
- o stack, o volume, as imagens locais e os uploads descartáveis usados nessa
  validação foram removidos ao final.

A execução Compose comprova a integração local da configuração de staging, não
uma execução em homologação compartilhada ou remota. O wrapper de development
foi validado estruturalmente e usa o mesmo entrypoint; não foi apontado ao banco
de desenvolvimento existente do operador.
