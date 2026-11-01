# CONTRACTS-016 — Idempotência de operações críticas

**Status:** concluída (31/10/2026)

## Objetivo

Padronizar a chave de idempotência e os conflitos públicos das mutações que
podem duplicar dados ou efeitos de negócio, preservando as rotas e alterando os
consumidores somente onde a proteção exigir.

## Contexto e referências

- [Requisitos do SIPAT](../requisitos-SIPAT.md)
- [Roadmap geral](../roadmap.md#idempotencia-de-operacoes-criticas)
- [Convenções de contratos](../contracts/conventions.md)
- [Erros compartilhados](../contracts/errors.md)
- [Integração Web–API](../integrations/web-api/README.md)
- [Integração Mobile–API](../integrations/mobile-api/README.md)
- Contexto anterior à entrega: movimentações, manutenções, reavaliações e
  empréstimos já recebiam `chaveIdempotencia`, mas repetiam a resposta de
  sucesso anterior.

## Escopo

- Reutilizar um schema UUID compartilhado para `chaveIdempotencia`.
- Manter a chave no body validado. Em multipart, mantê-la no JSON do campo
  `dados`; não criar header, rota ou decorator transversal novo.
- Exigir a chave nas criações sem identidade natural suficiente definidas por
  `IDEMPOTENCIA-001`: patrimônio, inventário, processo de compra, nota fiscal,
  comissão, setor e fornecedor.
- Preservar a chave já exigida em movimentação, criação/retorno/documento de
  manutenção, confirmação de reavaliação, saída e devolução de empréstimo.
- Padronizar os conflitos HTTP `409`:
  - `OPERACAO_JA_PROCESSADA`: mesma chave, operação e conteúdo já concluídos;
  - `CHAVE_IDEMPOTENCIA_REUTILIZADA`: mesma chave com operação ou conteúdo
    diferentes;
  - `OPERACAO_EM_PROCESSAMENTO`: outra requisição com a mesma chave ainda não
    produziu resultado confirmado.
- Usar em `OPERACAO_JA_PROCESSADA` uma mensagem inequívoca: a operação anterior
  foi concluída e nenhuma nova alteração foi feita.
- Manter `RespostaErroSchema` sem snapshot de sucesso, IDs técnicos ou novo
  envelope. Os consumidores distinguem o caso pelo `codigo`.
- Atualizar exports e testes dos contratos afetados.

## Fora do escopo

- Alterar URLs, métodos HTTP, responses de sucesso, autenticação, CSRF ou
  permissões.
- Criar um header `Idempotency-Key`, middleware, interceptor ou decorator.
- Retornar silenciosamente o sucesso anterior.
- Acrescentar idempotência a operações já protegidas por unicidade, estado ou
  precondição conforme a matriz de `IDEMPOTENCIA-001`.
- Definir retry automático em Web ou mobile.

## Decisões aprovadas

- Repetição confirmada é um conflito explícito, não um replay de sucesso.
- A chave pertence ao usuário autenticado e ao tipo da operação; o mesmo UUID
  pode existir para usuários diferentes.
- O hash considera apenas a entrada validada e semanticamente relevante. Em
  uploads, inclui o SHA-256 dos bytes dos arquivos na ordem/vínculo validados.
- Falha antes do commit não registra a chave como processada.
- Não serão expostos dados do resultado anterior no erro. A interface informa
  que nada foi duplicado e permite atualizar a consulta existente.

## Critérios de aceite

- [x] Todos os schemas novos e existentes usam o mesmo formato UUID para a
      chave, sem aceitar propriedades extras.
- [x] Os três códigos públicos possuem `409`, mensagem estável e campo
      `chaveIdempotencia` quando houver erro de campo.
- [x] Criações multipart incluem a chave dentro de `dados`, sem campo multipart
      adicional.
- [x] Responses de sucesso e rotas existentes permanecem compatíveis.
- [x] Testes cobrem chave ausente/inválida, os três conflitos e exports
      públicos.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/common/`
- `packages/contracts/src/movimentacao/`
- `packages/contracts/src/manutencao/`
- `packages/contracts/src/reavaliacao-patrimonio/`
- `packages/contracts/src/emprestimo/`
- `packages/contracts/src/patrimonio/`
- `packages/contracts/src/inventario/`
- `packages/contracts/src/processo-compra/`
- `packages/contracts/src/nota-fiscal/`
- `packages/contracts/src/comissao/`
- `packages/contracts/src/setor/`
- `packages/contracts/src/fornecedor/`
- `packages/contracts/src/index.ts`

## Verificações esperadas

- Lint, typecheck e testes de `@repo/contracts`.
- Busca por consumidores dos bodies alterados em API, Web, mobile, testes,
  Postman e seed.
- `pnpm format:check` nos documentos e contratos afetados.

## Resultado verificado

- `ChaveIdempotenciaSchema`, códigos, mensagens e schemas estritos dos três
  conflitos foram publicados pelo entrypoint de `@repo/contracts`.
- As sete criações aprovadas passaram a exigir a chave; processos de compra e
  notas fiscais a mantêm no JSON de `dados` do multipart.
- Os quatro módulos que já possuíam idempotência reutilizam a mesma primitive e
  os mesmos códigos públicos.
- `@repo/contracts`: lint e typecheck sem erros; 143 testes aprovados.
- Prettier dos contratos e documentos afetados e `git diff --check` aprovados.
- Consumidores em API, Web, mobile, testes e seed foram localizados. Persistência
  e experiência de conflito foram implementadas e verificadas nas tarefas
  dependentes `IDEMPOTENCIA-001`, `WEB-IDEMPOTENCIA-001` e
  `MOBILE-IDEMPOTENCIA-001`.

## Pendências ou decisões bloqueantes

- Nenhuma.
