# `STORAGE-001` — Preparar armazenamento local de documentos

**Status:** `concluída`

## Objetivo

Criar a infraestrutura reutilizável que grava documentos no host, fora do
filesystem do container, resolve chaves lógicas com segurança e elimina
arquivos temporários ou órfãos.

## Contexto e referências

- Roadmap: [STORAGE-001](../roadmap.md#storage-001--preparar-armazenamento-local-de-documentos).
- Decisão: [armazenamento local](../file-storage.md).
- Requisitos: [RNF09](../requisitos-SIPAT.md#rnf09-armazenamento-de-documentos-e-anexos).
- API: [segurança de input e output](../apps/api/security/input-and-output.md),
  [performance](../apps/api/performance.md) e
  [workflow](../apps/api/workflow-and-testing.md).

## Escopo

- validar `UPLOADS_ROOT_PATH` na inicialização;
- configurar `UPLOADS_HOST_PATH` nos ambientes e bind mount da API;
- criar porta e adapter de filesystem para gravar, abrir, substituir e remover;
- restringir todas as chaves à raiz e aos diretórios permitidos;
- aplicar staging, compensação e reconciliação idempotente;
- preparar `uploads/notas-fiscais` sem criar rota pública ou estática;
- usar diretórios temporários isolados nos testes.

## Fora do escopo

- CRUD de qualquer entidade;
- S3, storage remoto, CDN ou múltiplos hosts;
- interface Web ou mobile;
- anexos de baixa e manutenção.

## Decisões aprovadas

- desenvolvimento usa `./data/uploads` no host;
- staging e produção usam `UPLOADS_HOST_PATH` absoluto;
- o container acessa `/data/uploads` e a aplicação usa
  `UPLOADS_ROOT_PATH`;
- o banco persiste chaves `uploads/...`, nunca caminhos absolutos;
- arquivos privados não são servidos por `ServeStaticModule`.

## Critérios de aceite

- [x] reiniciar ou recriar o container preserva os arquivos no host;
- [x] configuração inválida impede a inicialização com erro operacional claro;
- [x] path traversal, caminho absoluto e escape por symlink são rejeitados;
- [x] falha de banco ou filesystem aciona compensação sem apagar arquivo válido;
- [x] reconciliação remove temporários vencidos e órfãos após carência;
- [x] logs não expõem caminho físico nem conteúdo.

## Arquivos ou módulos potencialmente afetados

- `.env.development.example`, `.env.staging.example` e
  `.env.production.example`;
- `compose.yaml` e overrides aplicáveis;
- `.gitignore` e `data/uploads/`;
- `apps/api/src/environment.ts` e testes;
- novo módulo ou infraestrutura de armazenamento em `apps/api/src/common/`;
- scripts e testes de reconciliação.

## Verificações esperadas

- validação de Compose para os três ambientes;
- testes unitários de resolução de caminhos, compensação e reconciliação;
- teste de persistência após recriação do container;
- lint, typecheck, testes e build da API;
- `git diff --check` e `corepack pnpm format:check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
