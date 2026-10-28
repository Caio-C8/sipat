const healthUrl =
  process.env.MOBILE_WEB_HEALTH_URL ?? "http://127.0.0.1:8081/health";
const appUrl = process.env.MOBILE_WEB_URL ?? "http://127.0.0.1:8081/";
const checkUrl = new URL("check", appUrl).toString();
const deadline = Date.now() + 30_000;

const developmentOnlyMarkers = [
  "Ambiente de desenvolvimento",
  "Verificações da infraestrutura",
  "Rotas do aplicativo",
];

async function fetchHtml(url, label) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(3_000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!response.ok || !contentType.includes("text/html")) {
    throw new Error(
      `${label} respondeu com HTTP ${response.status} e Content-Type ${JSON.stringify(contentType)}.`,
    );
  }

  return body;
}

let lastError;
let healthy = false;

while (Date.now() < deadline) {
  try {
    const healthResponse = await fetch(healthUrl, {
      signal: AbortSignal.timeout(3_000),
    });
    const healthBody = await healthResponse.text();

    if (!healthResponse.ok || healthBody.trim() !== "ok") {
      throw new Error(
        `Health check respondeu com HTTP ${healthResponse.status} e corpo ${JSON.stringify(healthBody.trim())}.`,
      );
    }

    const rootBody = await fetchHtml(appUrl, "A raiz protegida do mobile-web");
    const checkBody = await fetchHtml(checkUrl, "A rota /check do mobile-web");
    const exposedMarker = developmentOnlyMarkers.find(
      (marker) => rootBody.includes(marker) || checkBody.includes(marker),
    );

    if (exposedMarker) {
      throw new Error(
        `O export de produção expôs conteúdo exclusivo de development: ${JSON.stringify(exposedMarker)}.`,
      );
    }

    console.log(
      `mobile-web operacional em ${appUrl}; raiz protegida e política de /check verificadas`,
    );
    healthy = true;
    break;
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

if (!healthy) {
  console.error(
    `mobile-web não ficou saudável em 30 segundos: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
  process.exitCode = 1;
}
