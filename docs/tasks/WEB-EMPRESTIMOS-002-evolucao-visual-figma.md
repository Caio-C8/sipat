# WEB-EMPRESTIMOS-002 — Evolução visual dos empréstimos

**Status:** implementada e validada localmente em 13/11/2026

## Objetivo e referências

Evoluir a Web de RF16/UC16 com os cinco quadros de `Telas PC` do
[Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-6579),
preservando o domínio e a integração de
[WEB-EMPRESTIMOS-001](./WEB-EMPRESTIMOS-001-interface-emprestimos.md).
Foram inspecionados diretamente os nós `303:6579` (lista), `303:6769`
(seleção), `303:5987` (cadastro), `303:7162` (detalhe) e `303:7353`
(devolução).

## Entrega

- Lista com abas, filtros e paginação na URL, indicação de atraso derivada da
  API, identificação curta baseada no UUID e retorno à consulta anterior.
- Seleção de bens elegíveis com busca, paginação, checkboxes, limite do contrato
  e estado preservado entre pesquisa e cadastro.
- Cadastro dividido em destino, comissão e bens; revisão local antes da única
  confirmação; resultado mostra todos os registros separados quando aplicável.
- Detalhe com saída, bens, devoluções, histórico sustentado pelos eventos da
  resposta e link para a ficha patrimonial.
- Registro de devolução parcial ou integral com prévia de pendências, seleção
  por ID do empréstimo individual e atualização pelo retorno real da API.
- Sem mudança nos endpoints, contratos, regras, autorização, CSRF ou mecanismo
  central de idempotência.

## Adaptações do desenho

O contrato fornece UUID, então não foi criada numeração `EMP-...`.
O catálogo específico retorna apenas bens ativos elegíveis; a interface não
simula indisponíveis. O detalhe não inventa responsável do setor, estado atual
do patrimônio nem dados ausentes de registros legados. A barra lateral e a
topbar permanecem no shell compartilhado.

## Verificação nesta entrega

- `pnpm --filter @repo/web typecheck`: aprovado.
- ESLint dos arquivos Web e do seed alterados: aprovado.
- `pnpm --filter @repo/web test`: 115 testes aprovados.
- `pnpm --filter @repo/web build`: aprovado, com as três rotas.
- E2E Chrome com Web → API → PostgreSQL descartável em
  `127.0.0.1:55416/sipat_rf16`: 2 cenários aprovados. Cobriram saída em
  grupo, seleção após pesquisa, revisão, falha de resposta e reenvio idempotente,
  devolução parcial e conclusão, registros separados, consulta do Administrador
  e ausência de ações de escrita para ele, além de axe no detalhe e largura
  estreita.
- Capturas do navegador em 390, 1024 e 1440 px foram comparadas com a
  composição do Figma; não foi encontrado overflow horizontal da página.
- Em `localhost:3000`, a primeira inspeção do Administrador apresentou estado
  vazio. Depois, foram cadastrados dois bens sintéticos no banco de
  desenvolvimento, e o fluxo completo foi executado pelo navegador com um
  Diretor de teste: empréstimo em grupo `7856386f-3922-422c-a9bb-ee6e5ffdc33c`,
  devolução parcial e devolução final. O Histórico passou a exibir um registro
  concluído, com `0 de 2` bens pendentes, também na sessão do Administrador.
  A conta temporária do Diretor foi desativada; o empréstimo e os bens `DEMO`
  permanecem na instância local para conferência.

## Roteiro

Com API e Web iniciadas no ambiente desejado, abrir `/emprestimos`.
Administrador consulta lista e detalhe. Diretor pode abrir
`/emprestimos/nova`, selecionar bens, revisar e confirmar, depois abrir o
detalhe e registrar devoluções. Para repetir escritas sem afetar dados locais,
usar o banco RF16 descartável e o teste
`apps/web/playwright.emprestimos-real.config.ts` conforme a tarefa anterior.

Leitura manual com tecnologia assistiva permanece pendente.
