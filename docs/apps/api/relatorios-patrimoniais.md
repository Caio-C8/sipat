# Relatórios patrimoniais — RF20/RF21

Planejamento autorizado em 01/11/2026. Implementação sequencial e verificações
registradas nas tarefas abaixo; a aprovação do plano não comprova entrega.

## Cobertura e granularidade

| Tipo                | Unidade                              | Período obrigatório                | Totais                                                             |
| ------------------- | ------------------------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| Patrimônios         | bem atual, incluindo baixados        | nenhum; tombamento opcional        | incorporação, bruto, acumulado e líquido separados                 |
| Ficha individual    | bem e eventos de domínio             | nenhum                             | eventos por tipo                                                   |
| Movimentações       | transferência individual             | ocorrência em São Paulo            | transferências e bens distintos                                    |
| Manutenções         | item enviado                         | envio ou retorno civil             | orçamento vigente e realizado separados                            |
| Depreciações        | lançamento bem/parâmetro/competência | competências inicial e final       | quotas por competência e intervalo                                 |
| Reavaliações        | operação por bem                     | registro ou referência             | operações e bens; sem soma de saldos                               |
| Inventários         | item de inventário selecionado       | inventário obrigatório             | verificação, situação e correções separadas                        |
| Empréstimos         | bem emprestado                       | saída, previsão ou devolução civil | registros, grupos, pendentes, devolvidos, atrasados e sem previsão |
| Baixas patrimoniais | baixa preservada                     | data civil da baixa                | quantidade por tipo; sem valor histórico inventado                 |

Estorno não permitido pelas regras atuais. Fora do escopo: posição histórica
completa, snapshots retroativos, módulos operacionais novos, BI, gráficos,
Excel/CSV, agendamento, e-mail e retenção permanente.

## Semântica e segurança

Ambos os perfis podem consultar e exportar relatórios e ficha. Guards globais,
primeiro acesso e restrições das operações/anexos existentes permanecem.
Somente projeções autorizadas: sem contatos, matrículas, credenciais, caminhos
de storage, chaves de idempotência ou logs técnicos. Conteúdo cadastral é texto.

Cadastro atual não representa posição passada. Nomes de relações sem snapshot
são identificados como nomes cadastrais atuais. Ocorrência desconhecida e
snapshot ausente continuam nulos; não se usa updatedAt para inventar eventos.
Não filtrar cadastros relacionados por ativo nem históricos por status do bem.

Dias civis inclusivos: timestamps usam [início em São Paulo, início do próximo
dia); DATE e datas civis de empréstimo preservam o dia UTC armazenado.
Competência usa YYYY-MM. Decimal com sete casas e ROUND_HALF_UP; transporte
como string. Ausência contábil gera null, quantidade afetada e total
indisponível, nunca zero artificial. Totais são do conjunto filtrado no banco.

Reavaliações identificam parâmetro anterior registrado, primeiro parâmetro ou
legado desconhecido. A identificação de primeiro parâmetro exige o conjunto
moderno persistido (base nova e snapshot do número), com vínculo anterior nulo;
legados sem esse conjunto não recebem essa classificação por suposição.

Cada consulta usa snapshot RepeatableRead somente leitura. Prévia e emissão
são consultas novas, com UUID e instante próprios. PDF inclui todo o conjunto
filtrado, sem confiar em linhas/totais do navegador. Encerrar transação antes
da renderização. Cada relatório tem query estrita e ordenação fechada com UUID.

## Interface HTTP e limites aprovados

Prefixo /api/relatorios; somente GET autenticado, private, no-store.
Catálogo na raiz; opções enumeradas em /opcoes/:catalogo; oito tipos tabulares
em /:tipo e /:tipo/pdf. Ficha em /ficha-bem/:patrimonioId, /eventos e /pdf.
Opções permitidas por tipo: patrimônios, setores, responsáveis, naturezas,
espécies, comissões, fornecedores e inventários. Não são seletores de tabelas.

Prévia/opções: padrão 20, máximo 50; offset máximo 50.000. Históricos: até
366 dias, exceto ficha e inventário; depreciações até 12 competências.
PDF: 1.000 linhas/eventos, 200 páginas, 10 MiB; dataset normalizado 8 MiB.
Uma emissão por usuário e duas por instância, sem fila; orçamento 20 s com
timeout de banco menor. Excesso rejeita emissão inteira (422), sem truncamento.
Capacidade ocupada: 429 com Retry-After; dependência/timeout: 503 normalizado.

## PDF e Web

PDFKit na API; StreamableFile após geração completa em memória limitada.
Assets locais controlados, brasão existente, identificação SIPAT — Câmara
Municipal de Patos de Minas. Título, filtros, critério temporal, ordenação,
emissão em São Paulo, usuário/perfil da sessão, UUID técnico, unidades,
totais, avisos e paginação. Textos longos continuam sem corte; vazio é PDF válido.
Sem anexos, URLs externas, selo ou assinatura inventada. Descartar na resposta.

/relatorios usa shell autenticado, seleção, filtros por tipo, prévia paginada,
totais/avisos e download binário pelo cliente HTTP central. Mudanças de filtro
invalidam prévia; consultas antigas não sobrescrevem seleção nova. Sem retry
automático; liberar Object URL; preservar filtros em erro. Mensagem explícita:
“O PDF consultará novamente os dados; alterações posteriores à prévia poderão aparecer”.

## Execução e evidências

1. [CONTRACTS-017](../../tasks/CONTRACTS-017-relatorios-patrimoniais.md).
2. [RELATORIOS-001](../../tasks/RELATORIOS-001-consultas-tabulares.md).
3. [RELATORIOS-002](../../tasks/RELATORIOS-002-ficha-historico.md).
4. [RELATORIOS-003](../../tasks/RELATORIOS-003-pdf.md).
5. [WEB-RELATORIOS-001](../../tasks/WEB-RELATORIOS-001-interface.md).

Referências oficiais: [PDFKit](https://pdfkit.org/docs/getting_started.html),
[streaming NestJS](https://docs.nestjs.com/techniques/streaming-files).

## Filtros implementados

Todos os filtros opcionais usam igualdade por UUID ou enum fechado, salvo as
buscas textuais limitadas a 200 caracteres. Paginação não integra a entrada PDF.

| Tipo          | Filtros opcionais                                                                                                                              | Base / ordenação                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Patrimônios   | busca cadastral normalizada/número canônico, bem, setor/responsável atuais, espécie/natureza, status, tipo de número, tombamento inicial/final | número crescente ou tombamento crescente, UUID                |
| Ficha         | tipo de evento e ocorrência inicial/final                                                                                                      | ocorrência crescente, tipo e UUID; datas desconhecidas ao fim |
| Movimentações | bem, origem/destino, comissão, origem comum/correção                                                                                           | ocorrência decrescente e UUID                                 |
| Manutenções   | pedido, bem, fornecedor do item, tipo e situação                                                                                               | envio/retorno decrescente, pedido e item                      |
| Depreciações  | bem e comissão                                                                                                                                 | competência, processamento e UUID decrescentes                |
| Reavaliações  | bem e comissão                                                                                                                                 | registro/referência, instante e UUID decrescentes             |
| Inventários   | bem, setor esperado/encontrado, verificação, situação original, correções original/posterior                                                   | setor esperado, identificação atual e UUID crescentes         |
| Empréstimos   | bem, grupo, destinatário, pendente/devolvido e atraso                                                                                          | saída/previsão/devolução decrescente e UUID                   |
| Baixas        | bem, tipo e comissão                                                                                                                           | baixa, registro e UUID decrescentes                           |

Os contratos específicos em `packages/contracts/src/relatorio-patrimonial/`
definem os campos completos de saída. A ficha oferece 14 variantes de eventos;
transferências de correção aparecem somente como correção. Não há evento de
estorno. Consultas agregam relações únicas ou eventos em UNION ALL e paginam
antes da transferência ao consumidor; contagens e somas são feitas no banco.

## Operação local e conferência manual

O ambiente preparado nesta execução usa apenas o container
`sipat-relatorios-test`, PostgreSQL 17 em `127.0.0.1:55420`, banco
`sipat_relatorios_test`. As 26 migrations existentes foram aplicadas nele.
Nenhuma migration nova foi necessária. Configuração local em `.env.development`
e dados/senhas de teste não são artefatos versionados.

Com Node 24.22.1 e pnpm 11.28.8 disponíveis, execute `pnpm dev:api` e
`pnpm dev:web` em terminais separados. Para reabrir o banco preparado, use
`docker start sipat-relatorios-test`. A conta solicitada foi provisionada
somente nessa base de testes; não há nova rota de provisionamento.

1. Abra `http://localhost:3000/login` e autentique-se com a conta local.
2. Entre em Relatórios, escolha o tipo e os filtros. Dados de domínio da
   fixture usam janeiro a março de 2026; depreciações usam janeiro/fevereiro.
3. Use os seletores reais para ficha/inventário; clique em Consultar prévia.
4. Confira quantidade filtrada, paginação, totais e avisos. Alterar um filtro
   invalida a prévia; consultar novamente preserva os valores informados.
5. Gere o PDF do conjunto completo. O arquivo identifica sua própria consulta.

Reprodução da integração: `RELATORIOS_INTEGRATION_DATABASE_URL` deve apontar
exatamente para o banco isolado acima. Execute a suíte API normalmente com essa
variável. Para Web, inicie os builds API/Web locais e execute
`pnpm --filter @repo/web exec playwright test --config playwright.relatorios-real.config.ts`,
com a URL isolada e `SIPAT_RELATORIOS_EMAIL`/`SIPAT_RELATORIOS_SENHA` no ambiente.
O suporte `test/support/seed-relatorios-real.ts` recusa outros bancos e contas
existentes; não sobrescreve credenciais. A fixture JSON fica em test-results.

PDFKit 0.20.2 está fixado no manifesto/lockfile. O build Nest copia o brasão
para `dist/modules/relatorios/assets`; a imagem runner usa o mesmo asset local.
O PDF destaca número e descrição de cada bem. Depreciações usam uma tabela
com competência, líquido anterior, quota e líquido posterior na mesma linha;
comissão, autor, processamento e referências ficam abaixo do respectivo
lançamento. Os demais tipos usam blocos por registro e campos em grade,
preservando todos os campos e a distinção entre cadastro atual e snapshots.
Quebras repetem a identificação do bem/registro e os cabeçalhos; textos longos
continuam sem corte. Datas civis e competências são formatadas em pt-BR;
instantes usam America/Sao_Paulo. Valores mantêm as sete casas decimais.

## Evidências e limitações

Entrega concluída em 01/11/2026 nos nove tipos aprovados. Não há tipo aprovado
indisponível; estornos continuam proibidos e fora do escopo.

- Contratos: 146 testes, lint e tipos aprovados.
- API: 420 testes aprovados, incluindo os nove cenários da integração nova;
  123 testes de outros bancos especializados foram ignorados porque suas URLs
  não foram fornecidas. Tipos, lint e build aprovados.
- Web: 70 testes Vitest aprovados; tipos, lint e build aprovados.
- Consumidor mobile: typecheck aprovado; sem alteração funcional mobile.
- Chrome real: três E2E aprovados contra os builds finais, API e PostgreSQL 17
  isolado. Nove tipos com download nos dois perfis; seletores, paginação, vazio,
  invalidação de prévia, teclado, 390/768/1440 px e simulação de 200% por
  viewport CSS pela metade/densidade dobrada. Axe sem violações no main.
- PDF: nove amostras reais, extração e inspeção visual de vazio, acentos,
  conteúdo literal, textos longos e múltiplas páginas; todos os 25 registros
  filtrados constam na exportação. A ficha representativa teve 29 páginas.
- Imagem runner local construída; smoke test executado como usuário da imagem
  carregou PDFKit/fontes e brasão e gerou PDF de 9.762 bytes. Sem publicação.
- EXPLAIN das oito fontes executado nas fixtures; nenhum índice ou migration
  novo foi proposto sem necessidade demonstrada.

Os limites são proteções iniciais verificadas em massa sintética, não uma
medição de capacidade de produção. Não houve ensaio de carga prolongado nem
auditoria de uma base legada real. O zoom foi simulado em contexto Chrome
isolado; a ferramenta de inspeção adicional da janela pessoal encerrou a
operação por não conseguir confirmar sua URL. Isso não interrompeu os E2E
reais em instância Chrome separada. A CI completa continua sendo o critério
de integração.

A verificação de links relativos encontrou a referência antiga
`../PROMPTS-MOVIMENTACOES.md` no roadmap geral, já quebrada no HEAD anterior.
Ela foi preservada fora deste escopo; os links acrescentados por esta entrega
resolvem para arquivos existentes. Formatação dos arquivos afetados e
`git diff --check` aprovados.

Os testes de geração não escrevem dados operacionais: fixtures e mudanças de
cenário ocorreram somente no banco isolado. Nenhum staging, commit, push,
publicação ou MR foi realizado.

Revisão de legibilidade do PDF (01/11/2026): renderizador separado em
`pdf-layout.ts`, formatação em `pdf-format.ts`, mantendo a admissão e os limites
no service. Seis testes de PDF passaram, incluindo vínculo entre bem e valores
na mesma página, continuação identificada, texto longo sem espaços, vazio,
datas civis/fuso e precisão decimal. Lint da API, typecheck e build aprovados.
Chrome autenticado validou novamente as nove prévias e downloads sobre DEMO30;
extração conferiu referências, totais, paginação e margens nas nove amostras.
Inspeção visual de depreciações, patrimônios, reavaliações, vazio e texto longo
aprovada. A consulta de depreciações de 10/2026 a 11/2026 preservou seus 30
lançamentos e total de quotas de R$ 1.273,6462037 em sete páginas. A referência
Figma não pôde ser aberta nesta revisão; não se afirma fidelidade ao desenho.

Reexecução E2E após a revisão visual (01/11/2026): os três testes Playwright
reais passaram em 45,8 s (nove tipos para Administrador e Diretor, seletores,
paginação, alteração de filtros, vazio, teclado, telas e axe). Uma execução
adicional com DEMO30 conferiu as nove prévias, ausência de geração duplicada,
headers PDF/no-store, acesso anônimo negado, parâmetros inválidos e recuperação
do formulário preservando filtros. Os 29 PDFs baixados tiveram conteúdo e
paginação conferidos; os 60 lançamentos de depreciação foram comparados
individualmente com a prévia, incluindo bem, valores e total exato. Inspeção
visual de PDF multipágina, vazio e telas desktop/390 px concluída. Nenhuma
falha funcional foi identificada nesses cenários; execução local com banco
isolado e Chrome automatizado em contexto separado da aba pessoal.
