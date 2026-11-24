import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { BuscaController } from "./busca.controller";
import { BuscaRepository } from "./busca.repository";
import { BuscaService } from "./busca.service";

@Module({
  imports: [DatabaseModule],
  controllers: [BuscaController],
  providers: [BuscaRepository, BuscaService],
})
export class BuscaModule {}
