# Visão geral do SIPAT

## Identidade

SIPAT é o Sistema de Gestão Patrimonial da Câmara Municipal de Patos de Minas.
O produto busca modernizar o controle dos bens da instituição, centralizar as
informações e preservar a rastreabilidade das operações realizadas ao longo do
ciclo de vida patrimonial.

## Fontes de verdade

O documento versionado de
[requisitos do SIPAT](./requisitos-SIPAT.md) é a fonte de verdade para
requisitos funcionais e não funcionais, regras de negócio, casos de uso,
rastreabilidade e papéis de usuário.

O [protótipo no Figma](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1)
é referência para fluxos e apresentação visual. Uma tela não altera, por si só,
a semântica definida pelos requisitos. Divergências entre protótipo,
documentos externos e requisitos versionados devem ser resolvidas antes da
implementação.

O [roadmap inicial](./roadmap.md) coordena as primeiras entregas de segurança,
usuários e autenticação. As decisões transversais correspondentes estão em
[identidade, sessão e controle de acesso](./security-and-access.md).

## Capacidades previstas

O escopo funcional está organizado nas seguintes áreas:

- autenticação, autorização e gestão de usuários;
- responsáveis, setores e comissões;
- naturezas, espécies e fornecedores;
- processos de compra e documentos fiscais;
- cadastro, consulta e identificação de patrimônios;
- transferência, empréstimo, devolução, manutenção e baixa;
- reavaliação, depreciação e histórico patrimonial;
- inventário por setor e tratamento de divergências;
- relatórios patrimoniais.

A aplicação Web foi prevista para atender atividades administrativas e
operacionais. O aplicativo móvel previsto atende principalmente identificação,
consulta e conferência de bens durante inventários.

## Papéis

Os requisitos distinguem três papéis:

- **Administrador:** gerencia cadastros administrativos e usuários;
- **Diretor de Patrimônio:** executa as operações patrimoniais;
- **Usuário do sistema:** identidade autenticada cujo acesso depende do perfil
  e da situação do cadastro.

A autorização é validada na API. Ocultar controles na interface melhora a
experiência, mas não substitui a verificação de permissão no servidor.

## Estado implementado

O repositório permanece na etapa de infraestrutura inicial do SIPAT:

- a API expõe somente `GET /api/health`, marcado explicitamente como público;
- as demais rotas são autenticadas e autorizadas por perfil por padrão;
- sessões opacas revogáveis são persistidas apenas pelo hash SHA-256 do token;
- métodos mutáveis exigem Origin permitido e `X-SIPAT-CSRF: 1`;
- a Web possui home técnica, health check e proxy para a API;
- o mobile possui tela técnica e consulta direta ao health check da API;
- o schema Prisma representa o domínio patrimonial e a persistência de sessões;
- `@repo/contracts` expõe os contratos genéricos e a identidade/perfis seguros;
- login, logout, criação produtiva de sessões, CRUD de usuários e módulos
  patrimoniais ainda não estão implementados;
- os fluxos patrimoniais do aplicativo móvel ainda não estão implementados.

Os documentos de arquitetura descrevem o padrão a seguir durante a evolução.
Exemplos conceituais não representam funcionalidade já entregue.

## Diretrizes de evolução

- Vincule cada entrega a requisitos e critérios de aceite identificáveis.
- Preserve o histórico patrimonial; operações de negócio não devem apagar os
  registros que sustentam auditoria e rastreabilidade.
- Modele transições como transferência, empréstimo, manutenção, reavaliação,
  depreciação e baixa por operações próprias, não por edição genérica do bem.
- Não presuma que formulário, request, response e model de banco compartilham o
  mesmo formato.
- Defina autenticação, autorização, concorrência, limites e observabilidade
  antes de liberar operações críticas.
- Atualize roadmaps e documentos de estado junto com a implementação.
