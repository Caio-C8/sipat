import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { FornecedoresController } from "./fornecedores.controller";
import { FornecedoresRepository } from "./fornecedores.repository";
import { FornecedoresService } from "./fornecedores.service";

@Module({
  imports: [DatabaseModule],
  controllers: [FornecedoresController],
  providers: [FornecedoresRepository, FornecedoresService],
  exports: [FornecedoresService],
})
export class FornecedoresModule {}
