# Proteção HTTP e contra abuso

## Headers de segurança

Helmet configura um conjunto de headers HTTP de segurança. No Express, deve ser
registrado antes das rotas e de configurações posteriores que dependam da ordem
de middleware. Ajuste CSP e outros headers conforme os consumidores reais; não
copie uma configuração permissiva de exemplo.

Consulte [Helmet no NestJS](https://docs.nestjs.com/security/helmet).

## CORS

CORS controla quais origens de navegador podem ler respostas. Ele não autentica
clientes, não autoriza operações e não impede chamadas feitas fora do navegador.

Defina explicitamente:

- origens por ambiente;
- métodos e headers permitidos;
- uso ou não de credentials;
- cache de preflight.

Evite combinar origem irrestrita com credenciais. Consulte a
[documentação de CORS do NestJS](https://docs.nestjs.com/security/cors).

## CSRF

Avalie CSRF quando o navegador enviar credenciais automaticamente, como cookies
ou sessões. Bearer tokens enviados explicitamente em headers possuem outro
modelo de ameaça, mas continuam exigindo proteção contra XSS e armazenamento
inseguro no cliente.

Não trate CORS como substituto de proteção CSRF. Documente o mecanismo escolhido
em [Integrações](../../../integrations/README.md) e consulte
[CSRF no NestJS](https://docs.nestjs.com/security/csrf).

## Rate limiting e consumo de recursos

Defina limite global e limites mais restritos para autenticação, recuperação de
conta, buscas caras, uploads e integrações pagas. Considere também:

- tamanho de body e arquivos;
- máximo de itens e profundidade de filtros;
- timeouts e cancelamento;
- concorrência;
- custo de chamadas externas;
- armazenamento distribuído quando houver várias instâncias;
- identificação correta do cliente atrás de proxy.

O NestJS fornece integração de throttling, mas os valores precisam vir do
contexto e de testes. Consulte
[Rate limiting](https://docs.nestjs.com/security/rate-limiting).

## Transporte e proxy

Produção deve usar HTTPS no servidor ou proxy responsável pela terminação TLS.
Configure apenas proxies conhecidos como confiáveis antes de usar headers
encaminhados para IP, protocolo ou rate limiting. Registre a topologia por
ambiente na documentação operacional.
