# Formulários e validação

## Estado atual

O SIPAT instala React Hook Form e o resolver Zod. O cadastro de naturezas é a
vertical de prova desse padrão; validação visual, mapeamento para o contrato e
operações HTTP continuam separados. Formulários ainda não migrados, como
`/patrimonios/novo` preserva o estado local e os schemas da respectiva operação
até que uma mudança concreta justifique a migração. O formulário de
`/minha-conta/alterar-senha` também mantém estado local, aplica o schema da
operação, usa os campos compartilhados e direciona o foco ao primeiro erro.

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

### Feedback aprovado para a evolução Web

- erro geral ou relevante da API fica acima do formulário, persiste enquanto
  necessário e recebe scroll/foco programático quando aparece;
- erro associado a campo fica somente abaixo do controle, marca
  `aria-invalid` e move o foco ao primeiro campo inválido;
- toast comunica sucesso e falha geral não bloqueante, sem duplicar erro de
  campo nem ser o único local de uma instrução necessária;
- modal usa `Cancelar`; página de criação usa `Limpar`; edição em página usa
  `Restaurar alterações`, com confirmação quando houver perda de dados;
- mensagens públicas descrevem o que o usuário pode fazer e não mencionam API,
  servidor, stack, tabela ou implementação interna;
- inputs monetários mantêm string decimal e duas casas durante a edição;
  inputs inteiros aceitam apenas dígitos e não usam comportamento de incremento
  acidental de `type="number"`.

A fundação foi implementada por
[WEB-UI-001](../../tasks/WEB-UI-001-fundacao-visual-formularios.md); a migração
das demais telas permanece incremental.

## Testes

Cubra defaults, valores válidos, erros corrigíveis, transformação de input para
output, campos condicionais, submissão duplicada, reset, teclado e foco. Para
uploads, cubra também tipo, quantidade e tamanho no cliente e repita as regras
de segurança na API.
