# Formulários e validação

## Estado atual

O SIPAT ainda não instala React Hook Form ou resolvers. O formulário
`/patrimonios/novo` usa estado local e valida `CriarPatrimonioBodySchema`, pois
esse contrato representa a operação de criação. Escolha outra solução quando
uma entrega concreta exigir gerenciamento adicional; valide compatibilidade
com React e Zod nas versões do projeto.

Independentemente da biblioteca, dados externos devem ser validados no boundary
e a API deve repetir a validação. Validação no navegador melhora a experiência,
mas não autoriza uma operação.

## Contrato não é automaticamente formulário

Não presuma:

```text
estado do formulário = body HTTP = output Zod = model do banco
```

O estado visual pode conter confirmações, strings vazias, datas em texto,
arquivos, previews ou passos intermediários. Quando a representação divergir,
use um schema ou tipo local e faça a conversão explícita para o contrato da
operação.

Quando um schema transforma, aplica default, coerção, preprocess, pipe ou codec,
diferencie `z.input<typeof Schema>` de `z.output<typeof Schema>`.

Também preserve a semântica de:

| Valor               | Significado possível         |
| ------------------- | ---------------------------- |
| propriedade ausente | não informado ou não alterar |
| `undefined`         | ausência implícita           |
| `null`              | limpar ou ausência explícita |
| `""`                | controle textual vazio       |

## Organização sugerida

```text
features/<dominio>/
├── forms/
│   ├── recurso-form.tsx
│   ├── recurso-form.schema.ts
│   └── recurso-form.mapper.ts
└── api/
    └── create-recurso.ts
```

Não crie mapper ou schema local quando o contrato compartilhado atender
exatamente ao formulário. Não coloque a chamada HTTP diretamente no componente
visual; use uma operação com entrada e saída explícitas.

## Submissão e acessibilidade

- impeça submissões duplicadas;
- preserve valores após erro recuperável;
- diferencie erro geral de erro de campo;
- não limpe o formulário antes da confirmação de sucesso;
- associe `label`, descrição e mensagem de erro ao controle;
- use `aria-invalid` e foco visível;
- agrupe campos relacionados com `fieldset` e `legend`;
- mova o foco ao primeiro erro quando isso ajudar a recuperação;
- não use apenas cor, tooltip ou placeholder para explicar um erro.

## Testes

Cubra defaults, valores válidos, erros corrigíveis, transformação de input para
output, campos condicionais, submissão duplicada, reset, teclado e foco. Para
uploads, cubra também tipo, quantidade e tamanho no cliente e repita as regras
de segurança na API.
