# INVENTARIOS-004 — Localização posterior de bem não localizado

**Status:** concluído

## Objetivo

Registrar, sem duplicar ou sobrescrever o `ItemInventario`, o bem consolidado
como `NAO_LOCALIZADO` que seja encontrado durante a conferência de outro setor
do mesmo inventário.

## Regras aprovadas

- o item original permanece `NAO_LOCALIZADO` e mantém setor, data, usuário e
  justificativa da conclusão original;
- uma entidade separada registra setor encontrado, data, usuário e correção;
- o registro aparece no setor esperado e no setor encontrado, sem alterar a
  população ou o progresso da conferência;
- o resumo do setor separa itens previstos de bens encontrados naquele setor,
  preserva os totais de cada grupo e identifica o setor original e o setor onde
  o bem foi encontrado;
- o filtro `Encontrados aqui` reúne tanto divergências identificadas na primeira
  conferência quanto localizações posteriores, mantendo o mesmo item visível no
  setor original e no setor onde foi encontrado;
- releitura no mesmo setor devolve o resultado existente;
- existe somente uma localização posterior por item no inventário;
- `RETORNO_AO_SETOR_CADASTRADO` resolve sem transferência;
- `TRANSFERENCIA_CADASTRAL` cria a transferência e atualiza o setor atual;
- a finalização usa a confirmação explícita já existente quando houver qualquer
  correção pendente;
- Administrador possui somente leitura; Diretor de Patrimônio registra e
  corrige.

## Escopo técnico

- migration e model Prisma com constraint de estados e unicidade por item;
- extensão dos contratos de item e do resultado de verificação;
- transações serializáveis da API para localizar, registrar e corrigir;
- apresentação e correção no fluxo mobile de conferência e resumo do setor;
- testes de contrato, serviço, autorização, persistência e consumidor mobile.

## Critérios de aceite

- [x] não existe segundo `ItemInventario` para o patrimônio;
- [x] o resultado original `NAO_LOCALIZADO` não é sobrescrito;
- [x] o achado posterior é idempotente no mesmo setor e concorrência não cria
      duas pendências;
- [x] as duas correções preservam histórico e transferência vinculada;
- [x] consultas mostram a ocorrência nos dois setores sem alterar progresso;
- [x] lint, tipos, testes, builds e integração de banco aplicáveis passam.

Concluído em 30 de outubro de 2026. As 21 migrations foram aplicadas desde um
banco PostgreSQL 17 vazio e o teste de inventários validou registro concorrente
idempotente, unicidade, correção com transferência e preservação do item
original. Contratos, API e mobile passaram em lint, tipos e testes; a API
compilou e o mobile foi exportado para Android, iOS e Web.
