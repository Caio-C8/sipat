import { expect, type Page, type Request, type Route } from "@playwright/test";

export type ApiMockRequest = Readonly<{
  method: string;
  path: string;
  url: URL;
  body: unknown;
  headers: Record<string, string>;
}>;

export type ApiMockResponse = Readonly<{
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}>;

type ApiMockResponder = (
  request: ApiMockRequest,
) => ApiMockResponse | Promise<ApiMockResponse>;

type ApiMockHandler = {
  method: string;
  path: string | RegExp;
  remaining: number;
  responder: ApiMockResponder;
};

function pathMatches(matcher: string | RegExp, path: string): boolean {
  if (typeof matcher === "string") {
    return matcher === path;
  }

  matcher.lastIndex = 0;

  return matcher.test(path);
}

function readBody(request: Request): unknown {
  const rawBody = request.postData();

  if (rawBody === null) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function describePath(path: string | RegExp): string {
  return typeof path === "string" ? path : path.toString();
}

export class ApiMock {
  private readonly handlers: ApiMockHandler[] = [];
  private readonly failures: string[] = [];

  constructor(private readonly page: Page) {}

  async start(): Promise<void> {
    await this.page.route("**/api/backend/**", async (route) => {
      await this.handleRoute(route);
    });
  }

  expectGet(
    path: string | RegExp,
    responder: ApiMockResponder,
    times = 1,
  ): void {
    this.register("GET", path, responder, times);
  }

  expectPost(
    path: string | RegExp,
    responder: ApiMockResponder,
    times = 1,
  ): void {
    this.register("POST", path, responder, times);
  }

  expectPatch(
    path: string | RegExp,
    responder: ApiMockResponder,
    times = 1,
  ): void {
    this.register("PATCH", path, responder, times);
  }

  expectDelete(
    path: string | RegExp,
    responder: ApiMockResponder,
    times = 1,
  ): void {
    this.register("DELETE", path, responder, times);
  }

  verify(): void {
    const pending = this.handlers
      .filter((handler) => handler.remaining > 0)
      .map(
        (handler) =>
          `${handler.method} ${describePath(handler.path)}: ${
            handler.remaining
          } request(s) missing`,
      );

    expect(
      {
        failures: this.failures,
        pending,
      },
      "The API mock received unexpected requests or did not receive expected requests.",
    ).toEqual({
      failures: [],
      pending: [],
    });
  }

  private register(
    method: string,
    path: string | RegExp,
    responder: ApiMockResponder,
    times: number,
  ): void {
    if (!Number.isSafeInteger(times) || times <= 0) {
      throw new Error("The expected request count must be a positive integer.");
    }

    this.handlers.push({
      method,
      path,
      responder,
      remaining: times,
    });
  }

  private async handleRoute(route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();

    const path = url.pathname.replace(/^\/api\/backend/, "") || "/";

    const handler = this.handlers.find(
      (candidate) =>
        candidate.remaining > 0 &&
        candidate.method === method &&
        pathMatches(candidate.path, path),
    );

    if (!handler) {
      this.failures.push(`${method} ${path}${url.search}`);

      await this.fulfillUnexpectedRequest(route);

      return;
    }

    handler.remaining -= 1;

    try {
      const response = await handler.responder({
        method,
        path,
        url,
        body: readBody(request),
        headers: request.headers(),
      });

      await this.fulfill(route, response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      this.failures.push(
        `${method} ${path}${url.search}: handler failed: ${message}`,
      );

      await this.fulfillUnexpectedRequest(route);
    }
  }

  private async fulfill(
    route: Route,
    response: ApiMockResponse,
  ): Promise<void> {
    const status = response.status ?? 200;

    const headers: Record<string, string> = {
      "X-Request-Id": "e2e-request",
      ...response.headers,
    };

    if (response.body === undefined) {
      await route.fulfill({
        status,
        headers,
      });

      return;
    }

    await route.fulfill({
      status,
      headers,
      json: response.body,
    });
  }

  private async fulfillUnexpectedRequest(route: Route): Promise<void> {
    await route.fulfill({
      status: 500,
      headers: {
        "X-Request-Id": "e2e-unexpected-request",
      },
      json: {
        status: 500,
        sucesso: false,
        codigo: "REQUEST_E2E_NAO_CONFIGURADA",
        mensagem: "O teste não configurou esta request.",
        erros: [],
        requisicaoId: "e2e-unexpected-request",
      },
    });
  }
}
