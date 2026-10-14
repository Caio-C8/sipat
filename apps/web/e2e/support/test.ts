import { expect, test as base } from "@playwright/test";
import { ApiMock } from "./api-mock";

type Fixtures = {
  apiMock: ApiMock;
};

export const test = base.extend<Fixtures>({
  apiMock: async ({ page }, provide) => {
    const apiMock = new ApiMock(page);

    await apiMock.start();
    await provide(apiMock);

    apiMock.verify();
  },
});

export { expect };
