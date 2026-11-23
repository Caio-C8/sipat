# `MOBILE-INVENTARIOS-004` — Pausar e retomar o leitor patrimonial

**Status:** `concluída`

## Objetivo

Impedir leituras repetidas do mesmo código e tentativas duplicadas durante a
conferência móvel, com um ciclo explícito de pausar, mostrar resultado e ler o
próximo patrimônio.

## Contexto e referências

- Roadmap: [SIPAT](../roadmap.md#evolução-web-de-usabilidade-e-padronização) e
  [Mobile](../apps/mobile/roadmap.md).
- Requisito: [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Estado: [MOBILE-INVENTARIOS-002](./MOBILE-INVENTARIOS-002-conferir-itens.md) e
  [MOBILE-INVENTARIOS-003](./MOBILE-INVENTARIOS-003-corrigir-concluir-setor.md).

## Escopo

- pausar câmera/leitor na primeira leitura válida antes de iniciar a mutation;
- manter um único envio em curso e ignorar callbacks repetidos;
- mostrar resultado persistente e ação `Ler próximo patrimônio` para reativar;
- em falha conclusiva, oferecer repetição explícita sem disparo automático;
- preservar idempotência do backend e resultado consolidado de releitura;
- limpar o valor anterior somente ao confirmar nova leitura;
- cobrir retorno da tela, background/foreground e desmontagem do scanner.

## Fora do escopo

- redesign geral do Mobile;
- alterar contrato ou regra de conferência;
- fila offline, repetição automática ou leitura contínua por lote;
- usar apenas atraso arbitrário como proteção.

## Decisões aprovadas

- o leitor permanece pausado até ação humana, não somente por cooldown;
- resultado e erro ficam legíveis antes de nova leitura;
- backend continua sendo a proteção definitiva contra duplicação.

## Critérios de aceite

- [x] uma etiqueta mantida diante da câmera gera no máximo uma mutation.
- [x] leitor não reativa durante pending nem ao renderizar o resultado.
- [x] `Ler próximo patrimônio` limpa estado apropriado e reativa a câmera.
- [x] falha não entra em loop e pode ser repetida explicitamente.
- [x] navegação/background desmontam a câmera e ignoram atualizações visuais
      posteriores à desmontagem; a mutation já enviada pode concluir para
      preservar o resultado consolidado do servidor.
- [x] fluxo manual de busca continua disponível.

## Estado implementado

- o bloqueio síncrono local pausa o leitor antes de iniciar a mutation e
  complementa a trava já existente no hook;
- sucesso e erro persistem na tela até `Ler próximo patrimônio`, `Tentar
novamente` ou `Ler outro patrimônio`;
- a câmera só aceita o centro de códigos detectados dentro do guia visível
  quando a plataforma fornece geometria e mantém fallback para simbologias que
  não a fornecem;
- câmera e callback ficam desmontados fora de foco, em background, durante a
  digitação manual e enquanto resultado, erro ou divergência estão abertos;
- a entrada manual reage ao teclado, rola para a área visível ao ganhar foco e
  preserva o valor até a confirmação de uma nova leitura; durante a digitação,
  a área pausada da câmera é reduzida para liberar espaço acima do teclado;
- no Android, o detector ML Kit usado pelo `expo-camera` não reconhece códigos
  1D com um único caractere. Etiquetas desses patrimônios precisam codificar ao
  menos dois caracteres, como `07`; a normalização existente converte esse
  conteúdo para o número canônico `7` antes do envio.

## Verificação concluída

Em 23/11/2026, a entrega foi validada localmente após os ajustes encontrados
na homologação:

- `pnpm check` aprovou lint, tipos e testes, incluindo a trava de submissão, o
  ciclo persistente de resultado e a semântica acessível da próxima leitura;
- os exports Expo de Android, iOS e Web foram gerados com sucesso;
- a conferência foi exercitada em tablet Android com câmera, etiqueta real e
  teclado, incluindo pausa/retomada, entrada manual visível e normalização de
  `07` para o patrimônio canônico `7`;
- a limitação do ML Kit para códigos 1D de um único caractere ficou tratada pela
  convenção documentada de etiqueta com ao menos dois caracteres.

Os critérios de aceite desta tarefa estão atendidos e não há pendência
operacional para `MOBILE-INVENTARIOS-004`.

## Arquivos ou módulos potencialmente afetados

- tela/feature Mobile de conferência de inventário;
- componente de scanner e hook de mutation;
- testes de scanner, sessão e inventário;
- documentação Mobile de inventários.

## Verificações esperadas

- lint, tipos e testes Mobile;
- testes com callbacks repetidos e request pendente;
- emulador/dispositivo com câmera ou evidência equivalente explicitamente
  limitada;
- verificação de acessibilidade do botão e anúncio do resultado.

## Pendências ou decisões bloqueantes

- Nenhuma.
