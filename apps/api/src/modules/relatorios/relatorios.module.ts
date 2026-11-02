import { RelatoriosPdfService } from "./pdf.service";
import { FichaService } from "./ficha.service";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { RelatoriosController } from "./relatorios.controller";
import { RelatoriosService } from "./relatorios.service";
import { RelatoriosRepository } from "./relatorios.repository";
@Module({
  imports: [DatabaseModule],
  controllers: [RelatoriosController],
  providers: [
    RelatoriosService,
    RelatoriosRepository,
    FichaService,
    RelatoriosPdfService,
  ],
  exports: [RelatoriosService],
})
export class RelatoriosModule {}
