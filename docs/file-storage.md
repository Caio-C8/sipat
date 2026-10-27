# Armazenamento local de documentos

Este documento é a fonte de verdade para o armazenamento de documentos do
SIPAT no filesystem da máquina que executa o sistema. A primeira consumidora
será a nota fiscal, mas as regras também orientam os campos de anexos de baixa e
manutenção já previstos no schema.

## Escopo e ambientes

Os arquivos não pertencem à camada gravável da imagem ou do container. O
serviço `api` recebe um bind mount de um diretório do host em `/data/uploads`:

| Ambiente        | Diretório no host                       | Diretório visto pela API |
| --------------- | --------------------------------------- | ------------------------ |
| desenvolvimento | `./data/uploads` na raiz do repositório | `/data/uploads`          |
| staging         | valor absoluto de `UPLOADS_HOST_PATH`   | `/data/uploads`          |
| produção        | valor absoluto de `UPLOADS_HOST_PATH`   | `/data/uploads`          |

Em Windows, o valor esperado para staging ou produção pode ser, por exemplo,
`C:/SIPAT/data/uploads`. O diretório deve existir antes da inicialização, ter
permissões restritas à conta que executa o SIPAT e fazer parte do backup
operacional. O processo deve falhar na inicialização quando o caminho não
existir, não for diretório ou não permitir leitura e escrita.

O Compose recebe `UPLOADS_HOST_PATH` do `.env`, monta esse caminho no destino
fixo `/data/uploads` e informa à aplicação `UPLOADS_ROOT_PATH=/data/uploads`.
Quando a API for executada diretamente fora do Docker,
`UPLOADS_ROOT_PATH` deve apontar para o diretório real acessível ao processo.

O diretório `data/uploads` e todo seu conteúdo são dados de runtime e não devem
ser versionados. Apenas um arquivo sentinela vazio, se necessário para preparar
o diretório de desenvolvimento, pode ser mantido no Git.

Bind mounts são adequados aqui porque persistem arquivos diretamente no host,
fora do filesystem efêmero do container. Consulte a
[documentação oficial do Docker](https://docs.docker.com/engine/storage/bind-mounts/).

## Referência persistida

O banco armazena somente uma chave lógica relativa, sempre com separador `/`,
como:

```text
uploads/notas-fiscais/123_20261018_550e8400-e29b-41d4-a716-446655440000.pdf
```

Uma baixa usa o mesmo princípio sob diretório próprio:

```text
uploads/baixas/<patrimonio-id>_<data-UTC-YYYYMMDD>_<uuid>.pdf
```

Não persista `C:/SIPAT`, `/data/uploads`, URLs, origem da Web nem qualquer outro
prefixo dependente do ambiente. O resolver exige o prefixo lógico `uploads/`,
remove somente esse prefixo e resolve o restante sob `UPLOADS_ROOT_PATH`; assim,
a chave `uploads/notas-fiscais/arquivo.pdf` aponta fisicamente para
`/data/uploads/notas-fiscais/arquivo.pdf` no container. Ele rejeita caminho
absoluto, `..`, separador inesperado, symlink que escape da raiz ou chave fora
de um diretório permitido.

Para notas fiscais, o nome é gerado exclusivamente pelo servidor com:

```text
<numero-normalizado>_<data-UTC-YYYYMMDD>_<uuid>.pdf
```

O número participa somente da identificação humana e é reduzido a caracteres
seguros para nome de arquivo. O UUID garante unicidade e o nome original enviado
pelo cliente nunca é usado como caminho.

Para baixas, o servidor usa o `id` do patrimônio, a data UTC de geração e um
UUID. O identificador participa apenas da organização do arquivo; o download
continua sendo autorizado pelo recurso de baixa, nunca pela chave persistida.

## Entrada e validação

Cada nota fiscal aceita zero ou um arquivo. Quando presente, o arquivo deve:

- ser enviado em `multipart/form-data`;
- ter no máximo 10 MiB;
- usar extensão `.pdf`;
- declarar `application/pdf` e possuir assinatura de conteúdo compatível com
  PDF; extensão e MIME informados pelo cliente não bastam isoladamente;
- receber nome gerado pelo servidor e nunca ser executado ou interpretado pelo
  servidor.

Cada baixa aceita igualmente zero ou um PDF de até 10 MiB. O multipart contém
um campo textual `dados`, com o JSON da operação, e no máximo um campo de
arquivo `documento`; portanto, o parser limita `files` a 1, `fields` a 1 e
`parts` a 2. As mesmas validações de extensão, MIME, assinatura e gravação em
disco aplicadas às notas fiscais valem para o documento da baixa.

A criação conjunta de processo aceita no máximo 20 notas e 20 arquivos. O
parser multipart limita `files` a 20, `fields` a um campo `dados` e `parts` a
21; cada parte de arquivo mantém o limite individual de 10 MiB. O upload deve
ser gravado em disco durante a recepção, sem acumular o limite teórico de
200 MiB em memória.

O limite deve ser aplicado durante a recepção do arquivo, antes de mantê-lo por
inteiro em memória. A documentação oficial do NestJS descreve limites, escrita
em disco e streaming em
[File upload and streaming](https://docs.nestjs.com/techniques/file-upload).
As defesas seguem também o
[File Upload Cheat Sheet da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## Entrega autenticada

Os documentos são privados. Não use `ServeStaticModule` nem exponha o diretório
como conteúdo estático. A leitura da primeira consumidora ocorre por:

```text
GET /api/notas-fiscais/:notaFiscalId/anexo
```

A leitura do documento de uma baixa será feita por:

```text
GET /api/patrimonios/:patrimonioId/baixa/anexo
```

A rota passa pelos Guards globais, exige sessão válida e aceita os perfis
`ADMINISTRADOR` e `DIRETOR_PATRIMONIO`. O service carrega a nota, confirma que a
referência persiste no banco, resolve o caminho sob a raiz autorizada e então
entrega o PDF como stream, com `Content-Type: application/pdf`, tamanho quando
conhecido, `Content-Disposition` seguro e política de cache privado adequada.
Arquivo ou registro ausente produz resposta pública sem revelar caminho físico.

Na rota de baixa, os mesmos controles se aplicam, mas somente o perfil
`DIRETOR_PATRIMONIO` pode consultar o recurso nesta entrega. O service carrega a
baixa pelo patrimônio e nunca aceita uma chave lógica enviada pelo cliente.

O NestJS recomenda `StreamableFile` para manter o fluxo do framework e dos
interceptors ao transmitir arquivos; consulte a mesma
[documentação oficial](https://docs.nestjs.com/techniques/file-upload#streaming-files).

Na Web já existente, o rewrite transforma a URL relativa
`/api/backend/notas-fiscais/:notaFiscalId/anexo` na rota da API. Implementar a
interface consumidora continua fora deste roadmap.

## Criação, substituição, remoção e órfãos

Filesystem e PostgreSQL não compartilham uma transação ACID. Portanto, cada
operação deve usar staging, compensação e reconciliação:

1. grave o upload com nome único em área temporária dentro da mesma raiz;
2. valide completamente o conteúdo antes de torná-lo referenciável;
3. mova o arquivo para o destino final por rename no mesmo filesystem;
4. persista a nova chave lógica na transação de banco;
5. se a persistência falhar, remova o arquivo novo;
6. em substituição, remova o arquivo antigo somente depois de a nova referência
   estar persistida;
7. em remoção, limpe a referência no banco antes de excluir o arquivo físico;
8. registre falhas de compensação sem caminho físico ou conteúdo do documento.

Além da compensação imediata, uma rotina idempotente de reconciliação deve
remover arquivos temporários vencidos e arquivos finais sem referência no banco
após período de carência. A rotina compara chaves normalizadas conhecidas e não
segue symlinks. Isso cobre interrupções do processo entre filesystem e banco e
materializa a exigência de não manter arquivos órfãos.

Na criação conjunta de processo e notas, arquivos novos são preparados antes
da transação; qualquer falha invalida toda a operação lógica e dispara a
limpeza dos arquivos já recebidos. Nenhuma response de sucesso pode apontar
para um arquivo inexistente.

Na baixa, o PDF opcional também é preparado antes da transação que cria o
histórico e altera o status do patrimônio. Falha na transação remove o arquivo
novo; como a baixa é imutável, esta entrega não prevê substituição ou remoção
posterior do documento. A reconciliação deve considerar também as chaves
referenciadas por `baixas_patrimoniais` antes de classificar um arquivo como
órfão.

## Operação e limites

- monitore espaço livre e falhas de leitura, escrita, remoção e reconciliação;
- não registre conteúdo, nome original, caminho absoluto ou identificadores
  pessoais em logs e métricas;
- documente backup e restauração conjunta de banco e diretório de uploads;
- uma única instância gravável por diretório é a premissa inicial; múltiplos
  hosts exigem storage compartilhado ou uma nova decisão arquitetural;
- testes usam diretório temporário isolado e nunca o diretório real do operador.
