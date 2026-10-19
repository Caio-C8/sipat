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
import { NaturezasModule } from "./modules/naturezas/naturezas.module";
import { ResponsaveisModule } from "./modules/responsaveis/responsaveis.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { ArmazenamentoDocumentosModule } from "./common/storage/armazenamento-documentos.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ArmazenamentoDocumentosModule,
    AuthModule,
    NaturezasModule,
    PatrimoniosModule,
    ResponsaveisModule,
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
