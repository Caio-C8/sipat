import { MovimentacoesModule } from "./modules/movimentacoes/movimentacoes.module";
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { validateEnvironment } from "./environment";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { requisicaoIdMiddleware } from "./common/middleware/requisicao-id.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { PatrimoniosModule } from "./modules/patrimonios/patrimonios.module";
import { ProcessosCompraModule } from "./modules/processos-compra/processos-compra.module";
import { NaturezasModule } from "./modules/naturezas/naturezas.module";
import { ResponsaveisModule } from "./modules/responsaveis/responsaveis.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { ArmazenamentoDocumentosModule } from "./common/storage/armazenamento-documentos.module";
import { EspeciesModule } from "./modules/especies/especies.module";
import { SetoresModule } from "./modules/setores/setores.module";
import { FornecedoresModule } from "./modules/fornecedores/fornecedores.module";
import { NotasFiscaisModule } from "./modules/notas-fiscais/notas-fiscais.module";
import { ComissoesModule } from "./modules/comissoes/comissoes.module";
import { InventariosModule } from "./modules/inventarios/inventarios.module";
import { BaixasModule } from "./modules/baixas/baixas.module";
import { DepreciacoesModule } from "./modules/depreciacoes/depreciacoes.module";
import { ManutencoesModule } from "./modules/manutencoes/manutencoes.module";
import { ReavaliacoesModule } from "./modules/reavaliacoes/reavaliacoes.module";
import { EmprestimosModule } from "./modules/emprestimos/emprestimos.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ArmazenamentoDocumentosModule,
    AuthModule,
    BaixasModule,
    ComissoesModule,
    DepreciacoesModule,
    EspeciesModule,
    EmprestimosModule,
    FornecedoresModule,
    InventariosModule,
    ManutencoesModule,
    MovimentacoesModule,
    NaturezasModule,
    NotasFiscaisModule,
    PatrimoniosModule,
    ProcessosCompraModule,
    ReavaliacoesModule,
    ResponsaveisModule,
    SetoresModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requisicaoIdMiddleware).forRoutes({
      path: "{*rota}",
      method: RequestMethod.ALL,
    });
  }
}
