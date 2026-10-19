import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ResponsaveisController } from "./responsaveis.controller";
import { ResponsaveisRepository } from "./responsaveis.repository";
import { ResponsaveisService } from "./responsaveis.service";

@Module({
  imports: [DatabaseModule],
  controllers: [ResponsaveisController],
  providers: [ResponsaveisRepository, ResponsaveisService],
  exports: [ResponsaveisService],
})
export class ResponsaveisModule {}
