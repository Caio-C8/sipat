# MOBILE-IDEMPOTENCIA-001 — Proteger cadastro patrimonial no mobile

**Status:** aprovada

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

- [ ] Reenvio incerto usa a mesma chave e cria no máximo um patrimônio.
- [ ] Alterar o conteúdo depois de falha conclusiva gera outra chave.
- [ ] Duplo toque não dispara duas requests.
- [ ] Os três conflitos possuem mensagens claras e acessíveis, sem apagar os
      dados corrigíveis.
- [ ] Renovação de access token não troca chave nem corpo da mutation original.

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

- Depende de `CONTRACTS-016` e `IDEMPOTENCIA-001` verificados.
