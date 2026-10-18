---
name: versionar-git
description: Analisa alterações Git atuais, separa commits coerentes e gera comandos de versionamento. Use quando o usuário pedir revisão do worktree, agrupamento de commits, mensagens Conventional Commits ou comandos Git; não use automaticamente em tarefas comuns de implementação.
---

# Versionar alterações Git

Analise o estado vivo do repositório e proponha versionamento sem modificar o
worktree, o index ou o histórico.

## Inspeção

1. Confirme o repositório, o terminal atual e qualquer escopo indicado pelo
   usuário.
2. Comece com resultados resumidos:

   ```bash
   git status --short
   git status --porcelain=v2
   git diff --stat
   git diff --cached --stat
   git diff --name-status
   git diff --cached --name-status
   git ls-files --others --exclude-standard
   git branch --show-current
   git log -8 --pretty=format:"%h %s"
   ```

3. Diferencie arquivos staged, unstaged, untracked, removidos e renomeados.
   Consulte a branch e o histórico recente quando isso ajudar a avaliar a base
   ou o padrão local de mensagens.
4. Inspecione somente os diffs e conteúdos necessários para compreender cada
   alteração. Use `git diff -- <caminho>` e
   `git diff --cached -- <caminho>`; não leia o repositório inteiro por padrão.
5. Execute `git diff --check` e `git diff --cached --check`. Trate essas
   verificações como análise de whitespace, não como testes funcionais.
6. Identifique mudanças independentes, arquivos inesperados, conteúdo sensível
   e alterações incidentais. Não presuma que todo o worktree pertence à mesma
   tarefa.

Não revele o conteúdo de credenciais, chaves, tokens ou arquivos de ambiente.
Se um caminho parecer sensível, sinalize o risco sem reproduzir o segredo.

## Agrupamento

- Agrupe por intenção coerente e pelo que os diffs realmente demonstram. Um
  único commit é adequado quando todas as alterações formam uma entrega.
- Use Conventional Commits e siga o idioma e o estilo observados no repositório.
- Prefira staging por arquivos ou diretórios completos com caminhos explícitos.
  Não use `git add .`.
- Se alterações independentes estiverem misturadas no mesmo arquivo, explique o
  conflito. Proponha `git add -p -- <caminho>` somente quando a separação for
  realmente necessária e exigir revisão interativa dos hunks; se o usuário
  preferir arquivos inteiros, mantenha o arquivo em um único commit ou peça que
  ele separe a edição antes.
- Gere sintaxe compatível com o terminal atual. Em PowerShell, coloque caminhos
  com espaços entre aspas e não use comandos exclusivos de Bash.

## Segurança

- Execute apenas comandos Git de leitura durante a análise.
- Nunca execute staging, commit ou push; apenas forneça os comandos para o
  usuário decidir e executar.
- Não execute `git reset`, `git clean`, `git restore`, checkout destrutivo ou
  qualquer comando que descarte ou sobrescreva alterações.
- Não invente arquivos, mudanças, validações ou resultados ausentes do estado
  Git atual.
- Alerte sobre arquivos sensíveis, alterações inesperadas, conflitos de escopo,
  whitespace inválido e limitações da análise.

## Resposta

Para cada commit proposto, apresente:

1. um título `Commit N` e a mensagem no padrão Conventional Commits;
2. resumo breve do objetivo;
3. arquivos correspondentes e observações incidentais;
4. comandos de staging com caminhos explícitos e o comando de commit.

Informe antes dos grupos se já havia alterações staged. Ao final, diferencie as
verificações executadas de testes, lint, typecheck ou build que não foram
realizados.
