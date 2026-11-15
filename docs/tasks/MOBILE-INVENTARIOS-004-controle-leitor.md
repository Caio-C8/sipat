# `MOBILE-INVENTARIOS-004` — Pausar e retomar o leitor patrimonial

**Status:** `aprovada`

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

- [ ] uma etiqueta mantida diante da câmera gera no máximo uma mutation.
- [ ] leitor não reativa durante pending nem ao renderizar o resultado.
- [ ] `Ler próximo patrimônio` limpa estado apropriado e reativa a câmera.
- [ ] falha não entra em loop e pode ser repetida explicitamente.
- [ ] navegação/background não deixam câmera ou request órfãos.
- [ ] fluxo manual de busca continua disponível.

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
