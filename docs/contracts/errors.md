# Erros de validação

## Objetivo

Um erro de validação deve permitir que o consumidor responda:

1. qual campo está incorreto;
2. qual regra falhou;
3. como corrigir o valor.

Mensagens técnicas do Zod não devem chegar diretamente ao usuário final.

Para formulários, o consumidor deve usar `erros[].campo` para posicionar o
erro, `erros[].codigo` para decisões programáticas e `erros[].mensagem` para o
texto apresentado. A mensagem pode evoluir sem obrigar o frontend a interpretar
frases; o código público é a parte estável para lógica.

## Mensagens globais

Use a configuração global para mensagens genéricas e reutilizáveis:

```ts
z.config({
  customError: (issue) => {
    if (issue.code === "invalid_type") {
      return "Formato ou tipo de dado inválido.";
    }

    return undefined;
  },
});
```

Retornar `undefined` delega a mensagem para a próxima camada de customização.
Consulte a
[documentação oficial de customização de erros](https://zod.dev/error-customization)
antes de definir o mapa definitivo.

Exemplos de categorias globais:

| Categoria     | Mensagem possível                     |
| ------------- | ------------------------------------- |
| tipo inválido | Formato ou tipo de dado inválido.     |
| string curta  | Deve possuir pelo menos X caracteres. |
| string longa  | Deve possuir no máximo X caracteres.  |
| enum inválido | Opção inválida.                       |

A configuração global é apenas um fallback. Quando o schema conhece a
semântica do campo, prefira uma mensagem específica que explique como corrigir
o valor. Por exemplo, “Informe o estoque usando um número inteiro” é mais útil
que “Formato ou tipo de dado inválido”.

## Mensagens específicas

Uma regra específica mantém sua mensagem junto ao schema:

```ts
const TituloSchema = z.string().min(3, {
  error: "O título deve possuir pelo menos 3 caracteres.",
});
```

Evite repetir o nome do campo quando a própria interface já fornece esse
contexto. Para campos comuns, “Este campo é obrigatório.” costuma ser suficiente.

## Contrato de erro da aplicação

Não exponha `ZodError` diretamente como resposta HTTP. Converta-o para um
formato estável da aplicação:

```json
{
  "status": 400,
  "sucesso": false,
  "codigo": "VALIDACAO_ENTRADA_INVALIDA",
  "mensagem": "Os dados informados são inválidos.",
  "erros": [
    {
      "campo": "titulo",
      "codigo": "TOO_SMALL",
      "mensagem": "Este campo é obrigatório."
    }
  ],
  "requisicaoId": "019d0123-4567-789a-bcde-f0123456789a"
}
```

Preserve no mínimo:

- `status`: status HTTP entre 400 e 599;
- `sucesso`: sempre `false`;
- `codigo`: categoria pública e estável do erro;
- `mensagem`: orientação geral legível;
- `erros[].campo`: campo ou posição que pode ser corrigida;
- `erros[].codigo`: categoria estável da falha de campo;
- `erros[].mensagem`: orientação específica para correção;
- `requisicaoId`: identificador que correlaciona resposta e diagnóstico
  interno.

Os códigos públicos usam `SNAKE_CASE` maiúsculo. Códigos internos do Zod, como
`too_small`, precisam ser mapeados para a representação pública acordada; não
devem ser copiados para a resposta sem conversão explícita.

O formatter pode usar as ferramentas de
[formatação de erros do Zod](https://zod.dev/error-formatting), mas o contrato
externo pertence à aplicação e não deve variar acidentalmente após uma
atualização da biblioteca.

## Paths

Para objetos aninhados e arrays, defina uma convenção única. Exemplos possíveis:

```text
documentos.0.nome
documentos[0].nome
```

Escolha uma representação e cubra-a com testes. Refinements devem apontar, quando
possível, para o campo em que o usuário consegue corrigir o problema.

## Frontend

O frontend deve mapear erros por `campo` e apresentar uma mensagem próxima ao
campo correspondente. Erros sem campo específico podem aparecer em uma área
geral do formulário.

Um mesmo campo pode possuir mais de uma issue, por exemplo uma de tipo e outra
de tamanho. Se a interface exibir somente uma mensagem por campo, preserve a
primeira recebida em vez de sobrescrevê-la durante a criação do mapa. A API pode
manter todas as issues no array para consumidores que decidam apresentá-las.

O frontend não deve depender de propriedades internas de `ZodError` recebidas
pela rede. Ele depende apenas do contrato de erro da aplicação.

Controles HTML frequentemente produzem strings mesmo quando representam
números ou booleanos. Essa representação pertence ao contrato do formulário e
deve ser convertida antes da chamada HTTP. O body JSON da API não deve passar a
coagir qualquer string apenas para acomodar o formulário, pois isso altera e
torna ambíguo o contrato externo.

## Conflitos de idempotência

Operações protegidas usam somente estes conflitos HTTP `409`:

| Código                           | Mensagem pública estável                                                   |
| -------------------------------- | -------------------------------------------------------------------------- |
| `OPERACAO_JA_PROCESSADA`         | A operação anterior foi concluída. Nenhuma nova alteração foi feita.       |
| `CHAVE_IDEMPOTENCIA_REUTILIZADA` | A chave de idempotência já foi utilizada com outra operação ou conteúdo.   |
| `OPERACAO_EM_PROCESSAMENTO`      | A operação ainda está em processamento. Tente novamente com a mesma chave. |

Quando o conflito inclui erro de campo, `erros[].campo` deve ser
`chaveIdempotencia`, com o mesmo código e a mesma mensagem do envelope. A
resposta não inclui o resultado anterior, IDs técnicos ou outro envelope. O
consumidor decide a experiência pelo `codigo`, sem interpretar a mensagem.

## Logs e dados sensíveis

Não registre indiscriminadamente o payload inválido. Por padrão, o Zod não inclui
o input nas issues para reduzir o risco de exposição acidental de dados
sensíveis. Ative esse comportamento somente com necessidade e política de
redação claras.

Nunca inclua em logs ou respostas:

- senhas e tokens;
- cookies ou cabeçalhos de autorização;
- documentos pessoais completos;
- conteúdo sigiloso enviado em formulários.

A API é responsável por aplicar esse contrato em seu Exception Filter sem
expor detalhes internos. Regras de classificação, logging e redaction estão em
[Secrets, logs e erros](../apps/api/security/secrets-logging-and-errors.md).
