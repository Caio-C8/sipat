import {
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from "@nestjs/common";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "./database.constants";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "../../environment";

const databaseClientProvider: Provider<DatabaseClient> = {
  provide: DATABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (
    config: ConfigService<EnvironmentVariables, true>,
  ): DatabaseClient => {
    const databaseUrl = config.getOrThrow("DATABASE_URL", {
      infer: true,
    });

    return createDatabaseClient(databaseUrl);
  },
};

@Module({
  providers: [databaseClientProvider],
  exports: [DATABASE_CLIENT],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.database.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
