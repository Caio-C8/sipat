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

## Formulários da primeira entrega

Login e conclusão do primeiro acesso reutilizam diretamente os contratos
compartilhados quando a representação do campo for idêntica. O formulário:

- mantém e-mail após erro recuperável, mas nunca preserva ou registra senha;
- usa `textContentType`/`autoComplete`, capitalização, teclado e ação de retorno
  adequados a e-mail e senha em cada plataforma;
- oferece mostrar/ocultar senha com nome, estado e alvo de toque acessíveis;
- impede submissão duplicada e mantém o botão com estado pending compreensível;
- diferencia validação local, credencial inválida, `429`, sessão expirada e
  indisponibilidade, sem revelar se a conta existe;
- na confirmação da nova senha, associa o erro ao campo correspondente e mantém
  as regras de 15 a 128 pontos de código Unicode já definidas pelo contrato;
- limpa valores sensíveis ao concluir, sair do fluxo ou receber invalidação
  definitiva da sessão.

Não introduza uma biblioteca de formulários somente por esses dois formulários.
A tarefa pode adotá-la se medir necessidade real de foco, performance e
composição e registrar a compatibilidade com o SDK.
