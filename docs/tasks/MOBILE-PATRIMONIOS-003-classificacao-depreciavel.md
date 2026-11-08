# `MOBILE-PATRIMONIOS-003` — Adaptar cadastro à classificação depreciável

**Status:** aprovada

## Objetivo

Manter o cadastro mobile compatível com a classificação de espécie e com o novo
contrato patrimonial, sem implementar no aplicativo a confirmação operacional
de disponibilidade para uso.

## Contexto e referências

- Dependências: [CONTRACTS-018](./CONTRACTS-018-disponibilidade-competencias-pendencias-depreciacao.md)
  e [DEPRECIACOES-002](./DEPRECIACOES-002-disponibilidade-competencias-integridade.md).
- Estado atual: [MOBILE-PATRIMONIOS-002](./MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md).
- Integração: [Mobile–API](../integrations/mobile-api/README.md).

## Escopo

- consumir `depreciavel` nas opções de espécie;
- mostrar vida útil e residual somente para espécie depreciável;
- não enviar `parametrosDepreciacao` para espécie não depreciável;
- remover o campo de início de depreciação do formulário e da revisão;
- informar após o cadastro que a disponibilidade deve ser confirmada no fluxo
  operacional Web antes do início da depreciação;
- limpar valores de parâmetros ao trocar de espécie depreciável para não
  depreciável e exigir novos valores ao fazer a troca inversa;
- atualizar fixtures, tentativas preservadas, idempotência e invalidação de
  queries afetadas.

## Fora do escopo

- confirmar disponibilidade no mobile;
- processar depreciação ou exibir relatório/notificação no mobile;
- alterar navegação, cache ou contratos além do necessário à compatibilidade.

## Critérios de aceite

- [ ] espécie depreciável exige parâmetros e não depreciável não os envia;
- [ ] início manual não aparece no formulário, revisão ou payload;
- [ ] troca de espécie não reaproveita valores ocultos indevidamente;
- [ ] erro da API preserva tentativa/idempotência conforme o fluxo existente;
- [ ] lint, typecheck e testes do mobile passam;
- [ ] viewports, teclado, foco e tecnologias assistivas permanecem verificáveis.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/features/patrimonios/create/`;
- operações e testes de catálogos/patrimônios;
- contratos/fixtures consumidos pelo mobile;
- documentação mobile somente após verificação.

## Verificações esperadas

- lint, typecheck e testes de `@repo/mobile`;
- testes de formulário, tentativa, payload e mudança de espécie;
- inspeção em Android/iOS ou relato explícito do limite;
- Prettier e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
