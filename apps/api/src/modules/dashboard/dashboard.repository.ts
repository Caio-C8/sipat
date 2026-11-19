import { Inject, Injectable } from "@nestjs/common";
import type { DashboardOperacional } from "@repo/contracts";
import type { DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import { consultaDashboard } from "./dashboard.query";

@Injectable()
export class DashboardRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
  ) {}

  async consultar(usuarioId: string, dataCorte: string) {
    const [resultado] = await this.database.$queryRaw<
      { dados: DashboardOperacional }[]
    >(consultaDashboard(usuarioId, dataCorte));

    if (!resultado)
      throw new Error("A consulta do dashboard não retornou dados.");
    return resultado.dados;
  }
}
