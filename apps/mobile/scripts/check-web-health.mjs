const healthUrl =
  process.env.MOBILE_WEB_HEALTH_URL ?? "http://127.0.0.1:8081/health";
const appUrl = process.env.MOBILE_WEB_URL ?? "http://127.0.0.1:8081/";
const deadline = Date.now() + 30_000;

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

    const appResponse = await fetch(appUrl, {
      signal: AbortSignal.timeout(3_000),
    });
    const contentType = appResponse.headers.get("content-type") ?? "";

    if (!appResponse.ok || !contentType.includes("text/html")) {
      throw new Error(
        `A raiz do mobile-web respondeu com HTTP ${appResponse.status} e Content-Type ${JSON.stringify(contentType)}.`,
      );
    }

    console.log(`mobile-web operacional em ${appUrl}`);
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
