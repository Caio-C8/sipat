# Formulários e validação

## Estado atual

O mobile ainda não possui formulário de domínio nem biblioteca de formulários.
Escolha a solução quando uma feature concreta exigir controle de campos,
performance e composição suficientes para justificar a dependência.

Validação no aparelho melhora a experiência, mas a API sempre repete validação,
autorização e regra de negócio.

## Representações diferentes

Não presuma:

```text
estado do TextInput = body HTTP = output Zod = model Prisma
```

O formulário pode conter string vazia, máscara, data textual, foto, confirmação
ou etapa intermediária. Use schema/tipo local e mapper quando a representação
visual divergir do contrato. Em schemas com transformação, diferencie
`z.input` de `z.output` e preserve a semântica de ausente, `undefined`, `null`
e `""`.

## Organização sugerida

```text
src/features/<dominio>/
├── forms/
│   ├── recurso-form.tsx
│   ├── recurso-form.schema.ts
│   └── recurso-form.mapper.ts
└── api/
    └── create-recurso.ts
```

Não crie schema ou mapper local se o contrato compartilhado representar
exatamente a entrada. A chamada HTTP fica em uma operação, não no componente de
campo.

## UX mobile

- escolha `keyboardType`, `autoCapitalize`, `autoComplete` e `secureTextEntry`
  conforme a semântica;
- mantenha o campo e sua mensagem visíveis acima do teclado;
- ofereça ação Next/Done e ordem de foco coerente;
- não descarte valores após erro recuperável ou retorno de background;
- impeça submissão duplicada e indique pending;
- diferencie erro geral, erro de campo e indisponibilidade de rede;
- não use placeholder como único label;
- confirme ação destrutiva de acordo com o risco.

## Arquivos e câmera

Antes de introduzir upload, defina permissão, quantidade, tipo, tamanho,
compressão, metadados, cancelamento, retomada e limpeza temporária. O cliente
não torna um arquivo seguro; a API repete validação e autorização.

## Testes

Cubra defaults, transformação, campos condicionais, teclado, foco, texto grande,
submissão duplicada, erro de rede, retomada após background e diferenças entre
plataformas relevantes.
