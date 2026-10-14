# Integrações

## NestJS

O backend deve validar body, query e params nos boundaries antes de chamar a
camada de aplicação.

A integração usa classes criadas com `createZodDto` e o `ZodValidationPipe` de
`nestjs-zod`:

```text
HTTP request
      ↓
ZodValidationPipe
      ↓
safeParse
   ↙      ↘
erro 400  output validado
              ↓
          controller
              ↓
           service
```

O Pipe e o Interceptor de serialização já estão registrados globalmente no
`AppModule`. Os DTOs ainda precisam ser implementados. O filtro que converte
exceções para `RespostaErroSchema` também está implementado e registrado
globalmente.

Configuração global:

```ts
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";

const providers = [
  {
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  },
];
```

O código definitivo deve:

- usar o formato descrito em [Erros](./errors.md);
- preservar a tipagem do output;
- distinguir body, query e params;
- ser testado com controllers reais;
- não consultar banco durante a validação estrutural.

Pipes são o ponto oficial do NestJS para validação e transformação antes do
route handler. O package `nestjs-zod` conecta os schemas compartilhados aos
metadados runtime exigidos pelo NestJS sem redefinir os contratos na API.

Para validar responses em runtime, use o `ZodSerializerInterceptor` com um DTO
de response declarado por `@ZodResponse`. Esse interceptor valida e serializa o
valor retornado, mas não deve inventar nem adicionar o envelope de sucesso. O
controller continua responsável por retornar exatamente a estrutura definida
em `@repo/contracts`, depois que o mapper converteu os dados do Prisma.

## Next.js

O frontend pode importar contratos realmente compartilhados:

```ts
import { CreateNoticiaSchema } from "@repo/contracts";
```

Usos possíveis:

- validação de formulários;
- Server Actions;
- Route Handlers;
- parsing de parâmetros;
- validação de respostas externas.

O projeto já inclui `@repo/contracts` em `transpilePackages` no Next.js.

### Formulário não é sempre contrato HTTP

Não force equivalência entre estado de UI e payload da API:

```text
UI FileList
    ↓
FormData
    ↓
API File
```

Pode haver:

```text
NoticiaFormSchema
CreateNoticiaBodySchema
```

Esses schemas podem reutilizar primitives, mesmo quando suas representações
completas são diferentes.

### Segurança

Validação no frontend melhora feedback e evita requests obviamente inválidos,
mas não cria uma fronteira de segurança. O backend deve executar sua própria
validação mesmo quando usa exatamente o mesmo schema.

## Aplicativos móveis e outros consumidores

Um app mobile pode consumir contratos agnósticos de plataforma. Não coloque em
`@repo/contracts`:

- APIs exclusivas do DOM;
- componentes React ou React Native;
- Prisma Client;
- bibliotecas server-only;
- objetos que não possam ser serializados no boundary acordado.

Contratos específicos de um único cliente podem permanecer no próprio app e
reutilizar primitives compartilhadas.
