# Referências

## Ordem de confiança

Ao confirmar comportamento de APIs ou tomar decisões técnicas:

1. documentação oficial do Zod;
2. documentação oficial do NestJS;
3. documentação oficial do Next.js;
4. documentação oficial das demais integrações;
5. issues e discussions dos projetos;
6. experiência da comunidade;
7. artigos e posts.

Fontes secundárias ajudam a identificar trade-offs, mas não substituem a
documentação da versão adotada.

## Zod 4

- [Documentação principal](https://zod.dev/)
- [API](https://zod.dev/api)
- [Guia de migração para Zod 4](https://zod.dev/v4/changelog)
- [Customização de erros](https://zod.dev/error-customization)
- [Formatação de erros](https://zod.dev/error-formatting)
- [Codecs](https://zod.dev/codecs)
- [Metadata e registries](https://zod.dev/metadata)
- [JSON Schema](https://zod.dev/json-schema)

Assuntos que exigem atenção especial no guia de migração:

- input `unknown` em `z.coerce.*`;
- mudanças de `.default()`;
- defaults dentro de propriedades opcionais;
- `z.strictObject()`;
- `z.enum()` no lugar de `z.nativeEnum()`;
- parâmetro unificado `error`;
- nova assinatura genérica de `ZodType`.

## NestJS

- [Pipes](https://docs.nestjs.com/pipes)
- [Validação](https://docs.nestjs.com/techniques/validation)

Pipes são executados antes do route handler e são o ponto previsto para
validação e transformação. O `ValidationPipe` oficial usa
`class-validator`/`class-transformer`; a integração com Zod neste projeto
será um Pipe personalizado.

## Next.js

- [`transpilePackages`](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Server Actions e mutations](https://nextjs.org/docs/app/getting-started/updating-data)

## Codex

- [Instruções com AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

O Codex combina instruções da raiz até o diretório de trabalho. Por isso, as
regras gerais ficam no `AGENTS.md` da raiz e apontam para esta documentação
detalhada, em vez de copiá-la.
