# EMPRESTIMOS-001 — API e persistência de empréstimos

**Status:** implementada e validada em ambiente isolado (31/10/2026)

## Objetivo

Registrar e consultar saídas e devoluções patrimoniais reais, individuais ou agrupadas, com transações e idempotência.

## Contexto e referências

- [RF16/UC16 e decisões](../requisitos-SIPAT.md)
- [Contratos](./CONTRACTS-015-contratos-emprestimos.md)
- [Roadmap](../roadmap.md)
- [Segurança](../security-and-access.md)

## Escopo

- Migration aditiva, módulo Nest por camadas, opções paginadas, lista, detalhe, saída e devolução parcial.
- Autorização no servidor, vigência de comissão na data informada, bloqueio de setor em conferência EM_ANDAMENTO, cronologia retroativa, locks e rollback da seleção inteira.
- Idempotência persistente com usuário, tipo, hash do payload normalizado e resposta da primeira confirmação.

## Fora do escopo

- Interface, cadastro de destinatários, renovação, exclusão, estorno, anexos, notificações, termos e mudanças de transferências.

## Decisões aprovadas

- Diretor escreve; Diretor e Administrador consultam. Não aplicar o bloqueio PENDENTE específico das transferências.
- Preservar dados e vínculos históricos; não inferir modo de grupo legado com um bem nem preencher nulos antigos.

## Critérios de aceite

- [x] Seis rotas e status consistentes, com permissões e erros públicos.
- [x] Grupo, devolução parcial, idempotência, concorrência e inventário verificados em PostgreSQL isolado.
- [x] Migration preservou empréstimo e devolução sintéticos preexistentes, seus vínculos e campos nulos.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/`, `apps/api/src/modules/emprestimos/`, `apps/api/src/app.module.ts`.

## Verificações esperadas

- Client Prisma, lint, tipos, testes de serviço/HTTP/PostgreSQL e build.

## Pendências ou decisões bloqueantes

- Antes de aplicar a migration em banco não descartável, inspecionar dados legados e executar backup e revisão operacional. Nesta entrega, a migration foi aplicada somente em `127.0.0.1:55416/sipat_rf16`, banco descartável; não foi aplicada em desenvolvimento operacional, staging ou produção.

## Evidências de execução

- `20261031120000_emprestimos_devolucoes_rf16` aplicada após as 23 migrations existentes no PostgreSQL isolado. Em um segundo banco descartável, as 23 migrations antigas foram aplicadas, um empréstimo e uma devolução legados sintéticos foram inseridos, a migration RF16 foi aplicada e a consulta SQL confirmou os mesmos IDs, vínculos e campos nulos.
- Oito testes integrados da feature passaram: HTTP com sessão/perfis/CSRF, grupos e registros separados, reenvio, devolução parcial e final, rollback, concorrência real, datas/comissão, filtros/atraso, inventário e leitura de formato legado. A verificação histórica mantém o vínculo após a devolução.
- Suíte geral da API: 399 testes aprovados e 115 pulados por exigirem bancos próprios de outras features; lint, typecheck e build aprovados.
- Confirmação Web real consultada diretamente no banco isolado: dois bens do mesmo grupo voltaram a `ATIVO`, com duas devoluções persistidas.
- Playwright integrado reproduzível também passou (1 teste) em PostgreSQL descartável; a consulta SQL posterior confirmou 2 bens ativos, 2 devoluções e 1 grupo.
