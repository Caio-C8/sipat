# MOBILE-IDEMPOTENCIA-001 — Proteger cadastro patrimonial no mobile

**Status:** concluída (01/11/2026)

## Objetivo

Adaptar o cadastro unitário de patrimônio ao novo contrato de idempotência,
preservando a tela e deixando explícito quando uma tentativa anterior já foi
concluída.

## Contexto e referências

- [CONTRACTS-016](./CONTRACTS-016-idempotencia-operacoes-criticas.md)
- [IDEMPOTENCIA-001](./IDEMPOTENCIA-001-api-persistencia-operacoes-criticas.md)
- [MOBILE-PATRIMONIOS-002](./MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md)
- [Roadmap mobile](../apps/mobile/roadmap.md#mobile-idempotencia-001--proteger-cadastro-patrimonial)
- [Integração Mobile–API](../integrations/mobile-api/README.md)

## Escopo

- Incluir `chaveIdempotencia` na operação existente de criação patrimonial.
- Criar a chave uma vez por confirmação e preservá-la após timeout, perda de
  conexão, resposta inválida ou renovação transparente da sessão.
- Criar nova chave somente quando o payload mudar após erro conclusivo ou o
  usuário iniciar outro cadastro.
- Bloquear duplo toque enquanto a mutation estiver pendente; não adicionar
  retry automático nem fila offline.
- Em `OPERACAO_JA_PROCESSADA`, informar que o cadastro anterior foi concluído e
  que nenhum novo patrimônio foi criado; atualizar lista/detalhe pelos fluxos
  existentes sem fingir novo sucesso.
- Manter a distinção dos outros dois conflitos e preservar os campos do
  formulário.

## Fora do escopo

- Alterar Figma, layout, navegação, permissões ou cadastrar vários bens.
- Mudar conferência de inventário; suas operações já usam estado e unicidades.
- Implementar consumidores mobile para outras entidades do roadmap.
- Persistir a chave em SecureStore ou criar fila offline.

## Critérios de aceite

- [x] Reenvio incerto usa a mesma chave e cria no máximo um patrimônio.
- [x] Alterar o conteúdo depois de falha conclusiva gera outra chave.
- [x] Duplo toque não dispara duas requests.
- [x] Os três conflitos possuem mensagens claras e acessíveis, sem apagar os
      dados corrigíveis.
- [x] Renovação de access token não troca chave nem corpo da mutation original.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/features/patrimonios/create/`
- `apps/mobile/src/lib/api/`
- `apps/mobile/src/lib/query/`
- testes do cadastro patrimonial e integração com sessão

## Verificações esperadas

- Lint, typecheck e testes de `@repo/mobile`.
- Export das plataformas suportadas.
- Teste integrado com API/PostgreSQL descartável para timeout/reenvio e `409`.
- Verificação de leitor de tela, foco, duplo toque e larguras suportadas.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Resultado verificado

- O cliente gera um UUID v4 somente na confirmação e mantém a mesma chave em
  timeout, falha de rede, response inválida e `OPERACAO_EM_PROCESSAMENTO`.
- Uma edição só libera outra chave depois de resposta HTTP conclusiva. Repetir
  sem editar mantém a chave anterior; iniciar outro cadastro a descarta.
- A trava síncrona bloqueia confirmações concorrentes e a mutation continua com
  `retry: false`, sem fila ou persistência offline.
- `OPERACAO_JA_PROCESSADA` invalida as consultas patrimoniais existentes e
  informa que nenhum novo bem foi criado; os outros conflitos mantêm mensagens
  próprias e o formulário preservado.
- A revisão final também removeu das mensagens de rede da leitura e da correção
  de inventário a garantia indevida de ausência de persistência: elas agora
  informam que não foi possível confirmar o resultado, sem alterar esses
  fluxos.
- Typecheck, ESLint sem erros, 190 testes mobile e exports Expo Android, iOS e
  Web foram aprovados. A suíte integrada de idempotência passou com 5 testes
  após aplicar as 25 migrations em PostgreSQL descartável.

### Limites da validação

O ESLint reportou somente um aviso preexistente no arquivo gerado
`.expo/types/router.d.ts`. Leitor de tela, foco e larguras foram preservados sem
mudança visual, mas não foram revalidados em dispositivo físico nesta execução.
