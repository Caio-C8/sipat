# Autorização

## Camadas de autorização

Uma API pode precisar verificar mais de um nível:

1. **função:** a identidade pode chamar esta operação?
2. **objeto:** pode agir sobre este registro específico?
3. **propriedade:** pode ler ou alterar estes campos?
4. **fluxo:** pode executar esta ação neste estado e frequência?

Verificar somente uma role no controller não cobre todos esses níveis. O
[OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
destaca separadamente falhas de autorização por objeto, propriedade e função.

## Guard ou service

Use Guard quando a decisão puder ser tomada com o contexto da requisição,
metadados da rota e identidade autenticada, por exemplo uma permissão de função.

Use o service ou um policy service quando a autorização depender do recurso
carregado, ownership, tenant, estado ou relacionamento no banco. Evite buscar o
mesmo registro no Guard e novamente no service apenas para aplicar a regra.

Independentemente do local, a autorização deve acontecer antes da alteração ou
exposição do recurso.

## Regras

- negue por padrão quando não houver política aplicável;
- não confie em identificadores, owner IDs, roles ou tenant IDs enviados pelo
  cliente;
- derive o escopo da identidade autenticada e da política do servidor;
- aplique autorização em toda operação que recebe um identificador externo;
- restrinja campos aceitos no input para evitar mass assignment;
- restrinja campos do output por contrato e mapper;
- centralize políticas repetidas em um componente testável;
- diferencie ausência do recurso de acesso negado conforme a política de
  exposição do projeto.

## Matriz de acesso

Documente as decisões junto da feature:

| Rota                  | Pública | Autenticação          | Permissão        | Regra do recurso              | Limite especial |
| --------------------- | ------- | --------------------- | ---------------- | ----------------------------- | --------------- |
| `POST /recursos`      | não     | definida pelo projeto | `recurso:create` | —                             | padrão          |
| `PATCH /recursos/:id` | não     | definida pelo projeto | `recurso:update` | proprietário ou administrador | padrão          |

Os valores são exemplos. Não copie permissões ou roles sem que façam parte do
contexto real.

## Decorators

Decorators como `@Public()` ou `@Permissions()` armazenam metadados; não
protegem rotas sozinhos. Sempre confirme qual Guard lê esses metadados, em qual
escopo ele está registrado e quais testes provam sua aplicação.
