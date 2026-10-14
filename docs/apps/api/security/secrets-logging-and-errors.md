# Secrets, logs, criptografia e erros

## Secrets e configuração

- não versione credenciais reais;
- valide a presença e o formato ao iniciar a aplicação;
- use credenciais diferentes por ambiente;
- aplique menor privilégio;
- permita rotação sem alteração de código;
- não exponha secrets para apps cliente ou variáveis públicas do frontend;
- evite valores padrão inseguros em produção.

Quando uma configuração for essencial à segurança, a ausência deve impedir a
inicialização em vez de reduzir silenciosamente a proteção.

## Hashing e criptografia

Hashing e criptografia resolvem problemas diferentes. Senhas devem usar um
algoritmo de hashing apropriado para senhas; dados que precisam ser recuperados
podem exigir criptografia e gestão de chaves.

Não invente algoritmos, formatos ou derivação de chaves. Parâmetros, rotação e
armazenamento devem ser decididos conforme o risco e a infraestrutura. Consulte
[Encryption and hashing no NestJS](https://docs.nestjs.com/security/encryption-and-hashing).

## Logs e observabilidade

Nunca registre indiscriminadamente request, response ou exceção. Redija ou omita:

- senhas, tokens, cookies e headers de autorização;
- chaves de API e secrets;
- dados pessoais e documentos completos;
- conteúdo de arquivos;
- respostas sensíveis de integrações.

Use identificador de correlação e metadados suficientes para investigar falhas
sem copiar o payload. Defina quem acessa os logs e por quanto tempo são retidos.

## Erros públicos

Exception Filters devem converter exceções conhecidas para o contrato público
sem retornar:

- stack trace;
- SQL ou detalhes do Prisma;
- caminhos do servidor;
- secrets ou configuração;
- informações que facilitem enumeração de usuários e recursos.

Registre detalhes internos de maneira segura e retorne ao cliente somente o
necessário para reagir. O formato compartilhado está documentado em
[Erros de contratos](../../../contracts/errors.md).

Evite capturar exceções em todo controller. Exceções não tratadas precisam
alcançar a camada central; um `try/catch` local só deve existir quando houver
recuperação ou tradução específica.
