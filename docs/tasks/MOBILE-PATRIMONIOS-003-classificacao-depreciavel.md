# `MOBILE-PATRIMONIOS-003` — Classificação depreciável incorporada

**Status:** incorporada a `CONTRACTS-018`; não executar separadamente

## Motivo

A classificação `depreciavel` tornou-se um atributo obrigatório do patrimônio.
Implementar primeiro apenas o contrato ou a API deixa o cadastro mobile com um
payload inválido; implementar o mobile posteriormente deixa o repositório sem
typecheck entre objetivos. Por isso, o escopo desta tarefa passou a integrar a
fatia vertical de
[CONTRACTS-018](./CONTRACTS-018-disponibilidade-competencias-pendencias-depreciacao.md).

## Escopo transferido

`CONTRACTS-018` agora deve, na mesma entrega:

- adicionar a checkbox de classificação no cadastro mobile;
- exigir e enviar parâmetros quando `depreciavel: true`;
- ocultar, limpar e não enviar parâmetros quando `depreciavel: false`;
- remover qualquer inferência pela espécie;
- atualizar revisão, tentativa preservada, idempotência, fixtures e testes;
- exibir a classificação no detalhe do patrimônio.

## Fora do escopo preservado

- confirmar disponibilidade no mobile;
- processar depreciação ou exibir relatório/notificação no mobile;
- alterar navegação ou cache além do necessário para o novo atributo.

## Referências

- Execução: [CONTRACTS-018](./CONTRACTS-018-disponibilidade-competencias-pendencias-depreciacao.md).
- Estado anterior: [MOBILE-PATRIMONIOS-002](./MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md).
- Integração: [Mobile–API](../integrations/mobile-api/README.md).

Este arquivo permanece apenas para rastreabilidade. O implementador não deve
abrir uma entrega ou validação independente para `MOBILE-PATRIMONIOS-003`.
