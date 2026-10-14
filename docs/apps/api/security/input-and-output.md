# Segurança de input e output

## Validação não é autorização

Schemas Zod verificam formato, presença, limites e transformações declaradas.
Eles não comprovam que o usuário pode executar a operação nem que um registro
pertence a ele.

Depois do parse ainda podem ser necessárias regras no service que dependem de:

- banco de dados;
- identidade autenticada;
- estado atual do recurso;
- tenant ou organização;
- limites do negócio;
- serviços externos.

## Entrada

- aceite somente propriedades declaradas pelo contrato;
- defina limites para strings, arrays, paginação e estruturas aninhadas;
- não repasse o body diretamente para operações Prisma quando campos internos
  puderem ser modificados;
- derive owner, tenant, role, status protegido e campos de auditoria no servidor;
- valide params, query, headers relevantes, arquivos e respostas externas;
- normalize somente quando a semântica estiver definida pelo contrato.

Validação de tipo MIME ou extensão não garante que um arquivo seja seguro.
Uploads podem exigir limite de tamanho, nome gerado pelo servidor, inspeção do
conteúdo, armazenamento não executável e análise adicional conforme o risco.

## URLs e serviços externos

Uma URL bem formada ainda pode apontar para rede interna ou recurso perigoso.
Quando a API realiza requisições fornecidas ou influenciadas pelo cliente:

- restrinja protocolos e destinos;
- considere allowlist quando o contexto permitir;
- defina timeout, tamanho máximo e política de redirecionamento;
- valide novamente a resposta recebida;
- não encaminhe secrets para destinos não confiáveis.

Esses controles reduzem riscos de SSRF e consumo inseguro de APIs.

## Persistência

Prefira APIs parametrizadas do Prisma. Raw queries exigem justificativa,
parametrização e testes específicos; nunca concatene entrada externa em SQL.

O repository continua responsável apenas pela operação de persistência. A
seleção dos campos permitidos e as regras de autorização pertencem aos
contratos, services e policies apropriados.

## Saída

- use schemas de response e mappers como allowlist;
- não serialize models Prisma diretamente por conveniência;
- não exponha hashes, secrets, tokens, campos internos ou relações não previstas;
- avalie autorização por propriedade antes de montar a resposta;
- normalize erros para o contrato público;
- trate dados de integrações como não confiáveis antes de retorná-los.

TypeScript não é uma barreira runtime. O tipo de retorno ajuda o desenvolvimento,
mas a construção explícita do objeto pelo mapper é que reduz exposição acidental.
