# WEB-MOVIMENTACOES-001 — Integrar movimentações na Web

**Status:** implementada e integrada; validação automatizada concluída em 28/10/2026. Homologação manual com leitor de tela pendente.
**Planejamento aprovado:** 27/10/2026.

## Objetivo e dependências

Substituir o placeholder por consulta, detalhe individual e registro de
transferências comuns. Depende de CONTRACTS-012 e MOVIMENTACOES-001
implementadas e verificadas; não chamar rotas planejadas antes disso.

## Contexto e referências

- [RF13, RF19 e UC13](../requisitos-SIPAT.md).
- [Contratos e interface HTTP](./CONTRACTS-012-contratos-movimentacoes.md).
- [API](./MOVIMENTACOES-001-transferir-consultar-patrimonios.md).
- [Permissões](../security-and-access.md#movimentações--política-implementada).
- [Roadmap Web](../apps/web/roadmap.md), [integração](../integrations/web-api/README.md),
  [hooks](../integrations/web-api/client-hooks.md), [segurança Web](../apps/web/security.md)
  e [acessibilidade](../apps/web/responsive-ux-and-accessibility.md).
- [Placeholder entregue](./WEB-MOVIMENTACOES-000-placeholder.md)
  e [guia](../../PROMPTS-MOVIMENTACOES.md).

### Referência visual consultada

- [Tela de movimentações](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3229).
- [Nova Movimentação: seleção](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3471).
- [Definição dos setores](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3728).
- [Revisão: elemento localizado no frame](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-4123).

Referências inspecionadas visualmente em 27/10/2026. O fluxo e as adaptações
abaixo foram aprovados; não houve teste funcional do protótipo nem aprovação
da aparência final implementada. Não copiar código TR, data manual, acessos
administrativos indevidos ou outros módulos presentes no desenho.

## Escopo e decisões de interface

### Consulta e detalhe

- /movimentacoes e /movimentacoes/[movimentacaoId] acessíveis a diretor e
  administrador. Uma linha e um detalhe por transferência, sem entidade de lote.
- Filtros na URL conforme CONTRACTS-012: patrimônio/busca, origem, destino,
  período e comissão; paginação e ordem mais recentes primeiro.
- Exibir número/descrição do patrimônio, setores, data e horário em
  America/Sao_Paulo e origem COMUM/CORRECAO_INVENTARIO legível.
- Detalhe mostra comissão, motivo quando existente, autoria e vínculo de
  correção quando aplicável. Motivo antigo nulo é ausência de informação,
  não erro. UUID identifica a rota; não inventar código TR.
- Filtros usam auxiliares no contexto FILTRO, incluindo inativos/vencidas.
- Nomes relacionados são cadastrais atuais; não apresentar responsável atual
  como prova de responsabilidade histórica. Responsável do destino no
  formulário é informativo e derivado do setor.
- Administrador não recebe botão de criação; acesso direto à página de criação
  é negado. Proteção real continua também na API.

### Criação: /movimentacoes/nova, somente diretor

1. **Selecionar bens:** reutilizar consulta patrimonial; manter seleção entre
   buscas/páginas, indexada por ID; contador até dez; impedir repetição e seleção
   dos estados proibidos, com explicação. Nenhum bloqueio visual substitui API.
2. **Definir destinos:** comissão vigente e motivo obrigatório comuns; destino
   individual; aplicar o mesmo destino a todos; permitir remover itens e voltar
   preservando dados. Não aceitar destino igual à origem nem destino inativo;
   origem inativa pode ser exibida/selecionada. Usar auxiliares REGISTRO.
3. **Revisar e confirmar:** mostrar bens, origens, destinos, comissão e motivo;
   informar que data/horário serão registrados pelo servidor ao confirmar e
   que qualquer impedimento cancela todas as transferências dessa confirmação.

Comissões/motivos diferentes exigem confirmações separadas. Não gravar ao
avançar de etapa. O único envio de escrita ocorre na confirmação explícita.
Motivo é enviado em observacao; não duplicar campo motivo no contrato.

### Concorrência, reenvio e estados

- Guardar a origem vista na seleção como pré-condição por item. Se houver
  conflito, preservar o preenchimento, destacar os itens e solicitar atualização
  e nova conferência; não trocar silenciosamente a origem e reenviar.
- Criar uma chave técnica ao confirmar; bloquear duplo clique enquanto pending.
  Resultado desconhecido por timeout/desconexão conserva payload e chave para
  recuperar a mesma confirmação, sem abrir uma nova transferência.
- Não habilitar retry automático de mutação por conveniência da biblioteca.
  Se o usuário corrigir o pedido após falha conclusiva, usar nova chave na
  nova confirmação. Nunca apresentar erro de rede como certeza de que nada foi
  gravado; recuperar o resultado anterior antes de tratar como nova operação.
- Sucesso apresenta quantidade e links para os registros individuais e atualiza
  consultas patrimoniais/de movimentações afetadas; não criar página de lote.
- Falha exibe resumo e mensagens por item/campo usando os paths do contrato,
  mantendo dados corrigíveis; nenhum sucesso parcial.
- Modelar carregamento, vazio real, erro, pending, sucesso, sessão expirada e
  falta de permissão. Erro de consulta não pode aparecer como lista vazia.
- A política B de inventários é revalidada pela API na confirmação; dados
  carregados antes do início/criação de inventário não autorizam a operação.

## Arquitetura e fora do escopo

Reutilizar shell, catálogo por perfil, browserApiClient/serverApiClient,
operações tipadas e hooks específicos quando houver Client Components.
Preferir Server Components e estado local/URL; não instalar biblioteca
transversal sem necessidade concreta e decisão aplicável.

Fora: APIs improvisadas, dados fictícios como reais, código TR, entidade de lote,
edição/exclusão/estorno, data manual, outras operações patrimoniais, alteração do
fluxo de correções de inventário, pesquisa global, notificações e ativação
automática das ações rápidas do dashboard.

## Critérios de aceite verificáveis

- [x] Ambos os perfis consultam; somente diretor abre/cria; API nega registro ao
      administrador mesmo por chamada direta.
- [x] Seleção aceita até dez únicos, mantém-se entre páginas e impede estados
      proibidos; API ainda é a autoridade.
- [x] Comissão/motivo comuns, destino individual/aplicar a todos e navegação
      entre etapas preservam valores; só confirmar produz escrita.
- [x] Códigos TR e data manual não aparecem; dia/hora usam America/Sao_Paulo.
- [x] Filtros de URL incluem comissão e histórico de setores/comissões
      inativos/vencidas; ordenação e paginação usam contrato real.
- [x] Detalhe é individual; correção é identificada; observação antiga nula
      não quebra renderização.
- [x] Erro em um item não produz sucesso parcial e preserva preenchimento;
      origem alterada exige revisão; inventário iniciado no intervalo bloqueia.
- [x] Duplo clique e perda de resposta não duplicam registros; reenvio mantém
      chave/payload e recupera IDs/horário anteriores.
- [x] Loading, vazio, erro, pending, sucesso, 401 e 403 são distinguíveis.
- [ ] Teclado, foco após erros, leitores de tela, zoom, conteúdo longo e
      viewports estreita/intermediária/ampla são verificados. Parcial: teclado, foco, semântica/axe, zoom e viewports passaram; falta homologação manual com leitor de tela.
- [x] E2E com mocks estritos e fluxo com API real controlada passam; aparência
      final é comparada ao Figma com as adaptações aprovadas e apresentada.
- [x] Catálogo, navegação, tarefa, roadmap e handoff só refletem capacidades
      efetivamente entregues e verificadas.

## Arquivos existentes e propostos

Existentes: apps/web/AGENTS.md; apps/web/app/(sistema)/movimentacoes/page.tsx;
layout.tsx do mesmo grupo; components/shared/; lib/navigation/system-navigation.ts;
lib/api/browser-api-client.ts e server-api-client.ts;
features/patrimonios/api/; e2e/movimentacoes.e2e.ts e e2e/support/;
packages/contracts/src/index.ts.
Propostos: apps/web/features/movimentacoes/;
apps/web/app/(sistema)/movimentacoes/nova/page.tsx e
apps/web/app/(sistema)/movimentacoes/[movimentacaoId]/page.tsx.

## Verificações esperadas e pendências

Lint, typecheck, testes e build de @repo/web; E2E de sessão, perfis, erros,
idempotência e integração; inspeção visual/acessibilidade. API real em ambiente
controlado, sem criar usuários ou alterar dados operacionais para capturas.

Dependências bloqueiam execução até a conclusão de contratos/API. Não há decisão
de produto pendente para o fluxo aprovado. Aparência final e eventuais
bibliotecas foram avaliadas na execução. No planejamento de 27/10/2026 ainda não havia verificações; evidências posteriores seguem abaixo.

## Execução e evidências — 28/10/2026

Entregues consulta e detalhe Server, filtros de URL, criação Client em três
etapas, operações tipadas, hooks por operação e observabilidade normalizada.
A navegação e o catálogo permitem consulta pelos dois perfis e criação somente
pelo diretor; as ações rápidas do dashboard continuam fora deste escopo.

Seleção por ID entre buscas/páginas, até dez; destinos individuais/aplicar a
todos; comissão/motivo comuns; volta/remoção preservam o preenchimento. Somente
confirmar envia POST. Conflito de origem exige atualização explícita e nova
revisão. Erros de domínio preservam campos e foco. A consulta não trata falha
como vazio e distingue sessão expirada de falta de perfil.

Um pedido com resultado desconhecido conserva chave/payload imutáveis em
memória e sessionStorage por usuário, incluindo recarregamento e sessão
expirada no reenvio. Não armazena credencial. Duplo clique é protegido por ref;
não existe retry automático de mutação. Novas leituras Server usam no-store e
o sucesso atualiza a árvore Server com router.refresh.

Verificações finais: lint, typecheck, 43 testes unitários e build de produção;
22 E2E padrão passaram. Nesse comando os cinco testes reais são explicitamente
ignorados; eles passaram separadamente com a configuração real. Contratos:
123 testes; API: 395 testes habilitados; mobile: typecheck passou.

Os cinco E2E reais usam Web/Next, API/Nest, Guards, cookie e PostgreSQL isolado:
registro/detalhe/lista; perda da resposta após commit e recuperação dos mesmos
IDs/instante; dez registros e estados impeditivos; administrador/403;
inventário criado entre preenchimento e confirmação, com formulário preservado.
A configuração e os scripts de seed/início são versionáveis e recusam banco
que não seja local com nome `sipat_movimentacoes001_test_<numero>`.

Inspeção visual nas larguras 390, 768, 1440 e 1920, zoom 200%, reduced motion,
conteúdo longo, foco e árvore acessível; axe não apontou violações no cenário
verificado. A leitura manual com NVDA/outro leitor de tela não foi executada;
a evidência de leitores de tela é semântica/automatizada, não homologação humana.
A comparação com Figma preserva shell, paleta, cartões, seleção/destinos/revisão;
as adaptações aprovadas removem data manual e TR e acrescentam buscas paginadas.

Capturas locais: `apps/web/test-results/movimentacoes-destinos-{390,768,1440,1920}.png`
e `movimentacoes-real-consulta.png`. São artefatos ignorados pelo Git.

### Iniciar e testar manualmente

Na raiz, use Node 24.22.1/pnpm 11.28.8 já configurados localmente:

```powershell
$env:PATH = "$PWD\.env.tools\bin;$env:PATH"
node .env.tools/pnpm/package/bin/pnpm.mjs infra:development:up
node .env.tools/pnpm/package/bin/pnpm.mjs dev
```

Acesse `http://localhost:3000`, autentique-se com uma conta existente e abra
Movimentações. Como diretor, selecione de 1 a 10 bens ativos, defina comissão
vigente, motivo e destinos, revise e confirme; abra os detalhes do resultado.
Como administrador, consulte e confirme a ausência da ação de criação. O seed local opt-in descrito no [README](../../README.md) fornece um patrimônio
e os cadastros auxiliares para esse teste. Ele foi executado por solicitação
do usuário após a entrega inicial, sem copiar a base de testes automatizados.

### Reproduzir os testes reais

Crie um banco PostgreSQL vazio exclusivo com nome
`sipat_movimentacoes001_test_<numero>` no servidor local. Configure a URL com
as credenciais locais, sem versioná-la, e execute na raiz com o runtime correto:

```powershell
$env:MOVIMENTACOES_INTEGRATION_DATABASE_URL = 'postgresql://USUARIO:SENHA@localhost:5433/sipat_movimentacoes001_test_20261028'
$env:DATABASE_URL = $env:MOVIMENTACOES_INTEGRATION_DATABASE_URL
pnpm --filter @repo/database db:migrate:deploy
pnpm --filter @repo/api test --testPathPatterns=movimentac
pnpm --filter @repo/api build
$env:API_INTERNAL_URL = 'http://127.0.0.1:3201'
$env:PLAYWRIGHT_TEST = '1'
pnpm --filter @repo/web build
pnpm --filter @repo/web test:e2e --config=playwright.movimentacoes-real.config.ts
```

As portas 3100/3201 precisam estar livres. Os scripts reinicializam somente os
dados desse banco de teste explicitamente validado; não a base `sipat`. A suíte
real inicia e encerra seus próprios servidores. Use um processo de terminal
exclusivo para essas variáveis, sem reutilizá-las na aplicação operacional.
