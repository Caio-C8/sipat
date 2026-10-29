# MANUTENCOES-001 — API e persistência de manutenção

**Status:** implementada e verificada em bancos descartáveis e no desenvolvimento local em 29/10/2026.

## Objetivo

Implementar o ciclo de manutenção de patrimônios para Administrador e Diretor de Patrimônio, com persistência consistente, histórico e documentos privados.

## Contexto e referências

- [RF18 e UC18](../requisitos-SIPAT.md)
- [Roadmap](../roadmap.md)
- [Segurança](../security-and-access.md)
- [Armazenamento de documentos](../file-storage.md)
- [CONTRACTS-013](./CONTRACTS-013-contratos-manutencoes.md)

## Escopo

- Migration preservadora para fornecedor, tipo e previsão por item, garantias, revisões, documentos e idempotência.
- Módulo Nest com listagem, detalhe, seletores, criação, orçamento, retorno, upload e download.
- Autorização no servidor, transações, concorrência, bloqueio de conferência ativa e auditoria.

## Fora do escopo

- Web, mobile, número institucional, cancelamento, exclusão e correção de retorno registrado.

## Decisões aprovadas

- Data de envio passada ou atual, nunca futura; comissão vigente nessa data. O pedido mantém essa comissão até a conclusão.
- Um a cinquenta itens distintos por pedido. Criação altera todos de `ATIVO` para `EM_MANUTENCAO` atomicamente.
- Orçamento por item admite revisões até o retorno. Nova vinculação exige fornecedor ativo; vínculo histórico é preservado.
- Retorno é único por item; a conclusão depende de todos os retornos e usa a data do último retorno.
- Documento do pedido é opcional; itens aceitam PDFs de envio e recebimento, até 10 MiB cada e vinte por item, sem sobrescrita.
- Chaves de repetição protegem criação, retorno e upload. Conflitos de versão e de estado produzem `409`.
- Conferência de setor `EM_ANDAMENTO` bloqueia mudanças de elegibilidade do bem; setor apenas pendente não recebe esse bloqueio.
- O valor patrimonial e as verificações de inventário consolidadas não são alterados automaticamente.

## Critérios de aceite

- [x] Ambos os perfis usam as rotas com sessão, CSRF e validação de recurso/estado na API.
- [x] Criação e retorno preservam atomicidade de pedido, itens e situação patrimonial.
- [x] Histórico de orçamento, documentos e vínculos legados é preservado.
- [x] Concorrência, repetição e falha parcial não deixam estado incoerente nos cenários testados.
- [x] PDFs são privados, validados e entregues apenas por rota autorizada.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/`, `apps/api/src/modules/manutencoes/`, `apps/api/src/common/storage/` e policy de inventário.

## Verificações esperadas

- Prisma client; lint, tipos, testes e build da API; E2E de guards e documentos; PostgreSQL descartável para migration, rollback e concorrência.

## Resultado verificado

- A migration `20261028210000_implementa_manutencoes_001` foi aplicada ao PostgreSQL descartável `sipat_test` na porta `5434`, ao banco de demonstração `sipat_movimentacoes001_test_1793203701000` na porta `5433` e ao banco local de desenvolvimento `sipat` na porta `5433`. No banco local, a pré-verificação encontrou zero itens legados de manutenção e zero duplicidades; o Prisma confirmou 19 migrations aplicadas. Nenhum banco de staging ou produção recebeu esta migration.
- Em `sipat_legacy_validation`, também no contêiner descartável, foram aplicadas as 18 migrations anteriores, inseridos vínculos fictícios e executado o SQL novo em transação. A consulta de verificação confirmou cópia de fornecedor, tipo e previsão por item, versão do orçamento, referência legada e dois documentos `LEGADO`, preservando as colunas antigas.
- Testes com PostgreSQL cobriram dois itens, retorno parcial e conclusão, valor patrimonial inalterado, rollback quando um item é inválido, dois envios concorrentes do mesmo bem, setor de inventário pendente e conferência ativa. Testes HTTP reais cobriram os dois perfis, sessão, CSRF, idempotência, PDF, download autenticado e arquivo inválido.
- `@repo/api`: após a atualização da branch, suíte geral com 52 suítes e 376 testes aprovados (18 suítes e 98 testes condicionais pulados sem seus ambientes); typecheck, lint e build aprovados. Os dois testes de manutenção com PostgreSQL isolado passaram, totalizando seis casos.
- O seed opt-in `SIPAT_SEED_MANUTENCOES=true` (`pnpm --filter @repo/database db:seed:manutencoes`) criou no banco local um pedido fictício `DEMO-MAN-001` com dois itens, os bens `SP-2` e `SP-3`, fornecedor e comissão de demonstração. A segunda execução manteve um pedido e dois itens, com os dois bens em `EM_MANUTENCAO`; não criou usuário nem credenciais.
- A API local antiga devolvia `404` em `GET /api/manutencoes`. Depois do reinício na porta original `3001`, devolveu `401` sem sessão e registrou as nove rotas de manutenção, confirmando que a rota passou a existir e exige autenticação.

## Limites da verificação

- Bancos de staging e produção não foram inspecionados nem migrados. A migration rejeita duplicidades legadas de itens antes de criar os índices únicos; esses dados exigem tratamento explícito se existirem no destino.
- A corrida entre início/conclusão de conferência e manutenção foi coordenada por locks no código e verificada por cenários de estado; não houve um teste simultâneo específico entre essas duas operações.

## Pendências ou decisões bloqueantes

- Nenhuma identificada no planejamento aprovado.
