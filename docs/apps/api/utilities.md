# Funções utilitárias

## Regra de posicionamento

Antes de criar uma função utilitária, determine seus consumidores e suas
dependências.

| Uso                                                  | Local recomendado                     |
| ---------------------------------------------------- | ------------------------------------- |
| Apenas um domínio da API                             | `apps/api/src/common/utils/<dominio>` |
| Vários módulos, mas somente a API                    | `apps/api/src/common/utils`           |
| Mais de uma aplicação e sem dependência de framework | `packages/utils`                      |

Uma função não deve ir para `packages/utils` apenas porque pode ser reutilizada
no futuro. Mova-a quando houver um consumidor real em outro app ou quando a
responsabilidade compartilhada estiver claramente definida.

Conversões ligadas a uma representação de persistência não devem ser promovidas
automaticamente para `packages/utils`. Converter uma data de calendário em
`Date`, por exemplo, exige uma política explícita de timezone e pode existir
somente para adaptar um contrato HTTP a um campo Prisma. Enquanto houver apenas
esse consumidor, mantenha a função privada no mapper ou helper do domínio.

## Critérios para `packages/utils`

Uma função compartilhada deve:

- ser independente de NestJS, Express, Prisma e APIs exclusivas do servidor;
- ter entradas e saídas explícitas;
- não acessar variáveis de ambiente ou estado global oculto;
- ser adequada aos runtimes de todos os consumidores;
- possuir testes para os comportamentos reutilizados.

Se a função tratar regras do domínio, considere mantê-la perto do service em
vez de chamá-la de utilitário. `common/utils` não deve se tornar um diretório de
código sem proprietário.

## Processo para agentes

Ao encontrar uma nova função:

1. liste os consumidores atuais;
2. identifique dependências de runtime ou framework;
3. escolha o menor escopo correto;
4. verifique se já existe função equivalente;
5. adicione testes quando a lógica não for trivial.
