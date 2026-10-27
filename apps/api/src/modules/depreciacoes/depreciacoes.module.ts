import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { DepreciacoesController } from "./depreciacoes.controller";
import { DepreciacoesRepository } from "./depreciacoes.repository";
import { DepreciacoesService } from "./depreciacoes.service";

@Module({
  imports: [DatabaseModule, ComissoesModule],
  controllers: [DepreciacoesController],
  providers: [DepreciacoesRepository, DepreciacoesService],
})
export class DepreciacoesModule {}
