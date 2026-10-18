# Testes de segurança

## Durante a feature

Antes de implementar uma rota, registre uma matriz de acesso com rota, estado,
exposição pública, identidade, permissão, regra por recurso, campos sensíveis e
limites especiais. O SIPAT possui somente o health check público; não use essa
exposição como precedente para rotas de domínio. Uma coluna sem decisão deve
ser tratada como pendência, não como autorização implícita.

O `SEC-001` cobre sessão ausente, malformada, inexistente, expirada e revogada,
usuário inativo, os dois perfis, negação sem metadata, `401` versus `403`,
origem e header CSRF. O E2E inicializa os Guards reais e substitui somente a
persistência por um adapter determinístico.

Os testes atuais confirmam que uma origem configurada recebe os headers CORS,
que o preflight respeita os métodos e headers permitidos e que uma origem fora
da allowlist não recebe autorização do navegador. Esses testes não devem ser
interpretados como testes de autorização do recurso.

## Testes mínimos por controle

### Autenticação

- credencial ausente, inválida, expirada e revogada;
- login e renovação emitem credencial de navegador com `HttpOnly` e os atributos
  `Secure`, `SameSite`, `Path`, `Domain` e prefixo definidos pelo ambiente;
- logout expira a credencial no servidor;
- nenhum fluxo exige ler credencial de autenticação por JavaScript;
- proteção CSRF cobre as operações autenticadas que alteram estado;
- rota pública acessível sem relaxar rotas protegidas;
- identidade anexada à requisição sem campos desnecessários;
- respostas sem enumeração indevida de contas.

### Autorização

- identidade sem permissão;
- acesso a ID pertencente a outro usuário ou tenant;
- leitura e alteração de propriedades proibidas;
- tentativa de enviar owner, role ou status protegido no body;
- mudança de estado fora do fluxo permitido.

### Boundary e disponibilidade

- body, query e params inválidos;
- arrays, strings, uploads e paginações no limite e acima dele;
- rate limiting nas rotas críticas;
- timeout e falha de serviço externo;
- URL ou redirecionamento não permitido quando houver chamadas externas.

### Saída e erros

- mapper não retorna campos internos;
- erro não contém stack, SQL, secrets ou payload sensível;
- logs passam pela política de redaction;
- contrato HTTP permanece estável.

## Escopos de teste

- teste unitário para policy, Guard, Interceptor, Filter e mapper;
- teste de integração para autenticação, persistência e configuração;
- teste E2E para composição real e ordem dos componentes globais;
- revisão de dependências e configuração no CI quando as ferramentas forem
  escolhidas pelo projeto.

Use os recursos de override do módulo de testes NestJS apenas quando o objetivo
for isolar uma unidade. Ao validar segurança E2E, inicialize os componentes reais
que formam a barreira avaliada.

## Conclusão

Não marque uma feature como concluída enquanto houver uma rota sem decisão de
acesso, um controle sem teste proporcional ao risco ou uma exceção de segurança
sem justificativa.
