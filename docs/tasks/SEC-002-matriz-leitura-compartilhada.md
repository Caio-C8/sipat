# `SEC-002` — Aplicar a matriz de leitura compartilhada

**Status:** `implementada e validada em 15/11/2026`

## Objetivo

Alinhar requisitos, API e consumidores à matriz em que os dois perfis consultam
os domínios compartilhados, preservando as mutações administrativas e
patrimoniais nos perfis aprovados.

## Contexto e referências

- Roadmap: [roadmap transversal](../roadmap.md#evolução-web-de-usabilidade-e-padronização)
  e [roadmap Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisitos: RF03–RF09, RF11, RF13–RF21 e RNF05 em
  [requisitos](../requisitos-SIPAT.md).
- Decisão de segurança: [identidade e controle de acesso](../security-and-access.md).

## Escopo

- permitir ao Diretor listar e consultar fornecedores, responsáveis, comissões
  e naturezas; manter setores e espécies com a leitura já compartilhada;
- permitir ao Administrador consultar competências, resumos, pendências e
  resultados de depreciação;
- preservar somente para o Diretor cadastro patrimonial, reavaliação,
  depreciação, movimentação, empréstimo, baixa e mutações de inventário;
- preservar manutenção e processos de compra com mutações para ambos;
- preservar usuários exclusivamente para o Administrador;
- garantir todos os relatórios tabulares e PDFs gerados para os dois perfis,
  inclusive o relatório de baixas;
- atualizar testes de Guards, controllers, integração e consumidores Web;
- registrar a matriz final em segurança e acesso sem apresentá-la como
  implementada antes da verificação.

## Fora do escopo

- conceder ao Diretor mutações de cadastros administrativos;
- conceder ao Administrador operações patrimoniais;
- criar edição, exclusão ou estorno que o domínio não possui;
- liberar ao Administrador o documento comprobatório original anexado à baixa;
  o acesso aprovado é ao relatório/PDF gerado de baixas.

## Decisões aprovadas

- autorização é aplicada na API; esconder ações na Web é somente UX;
- `acesso total` significa todas as operações já aprovadas para o domínio;
- endpoints de leitura usam seleção pública mínima e não expõem segredo ou
  credencial;
- a busca global futura herda esta matriz.

## Critérios de aceite

- [x] todos os `GET` aprovados retornam `200` para os dois perfis e `401` sem sessão.
- [x] toda mutação exclusiva continua retornando `403` ao perfil não autorizado.
- [x] o Administrador consulta depreciação sem receber ação de processamento.
- [x] o Diretor consulta os seis catálogos administrativos compartilhados sem
      alterá-los e mantém acesso total aos processos de compra.
- [x] ambos geram todos os relatórios, inclusive baixas, em prévia e PDF.
- [x] documento comprobatório anexado à baixa preserva a política atual.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/{fornecedores,responsaveis,comissoes,naturezas,depreciacoes}/`;
- `apps/api/src/modules/relatorios/` e testes de autorização;
- `apps/web/lib/navigation/system-navigation.ts` e features consumidoras;
- `docs/security-and-access.md`, `docs/requisitos-SIPAT.md` e roadmaps;
- contratos somente se uma response de leitura precisar de evolução aditiva.

## Verificações esperadas

- testes unitários e E2E da API com ambos os perfis, `401` e `403`;
- lint, tipos e testes de contratos, API e Web;
- integração real contra PostgreSQL descartável;
- regressão dos relatórios e do download de documentos privados.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Evidências da entrega

- API: lint, tipos e build aprovados; 435 testes passaram e 139 integrações
  opt-in de outros bancos permaneceram ignoradas. As cinco suítes E2E afetadas
  somaram 31 cenários com `200`, `401` e `403` para a matriz alterada.
- Web: lint, tipos e build de produção aprovados; 122 testes Vitest passaram.
- Integração real: as 28 migrations foram aplicadas em PostgreSQL 17
  descartável e os dois percursos Chromium de cadastros passaram contra API e
  banco reais. O Administrador exerceu mutações e PDFs; o Diretor consultou os
  seis catálogos sem receber controles de mutação e manteve processos de compra.
- O container, os serviços e os uploads temporários usados na validação foram
  removidos ao final. Nenhum banco operacional, staging ou produção foi alterado.
