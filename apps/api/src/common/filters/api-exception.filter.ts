import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import {
  type ErroCampo,
  type RespostaErro,
  RespostaErroSchema,
} from "@repo/contracts";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import { randomUUID } from "node:crypto";
import * as z from "zod";
import { type RequisicaoComId } from "../middleware/requisicao-id.middleware";

const MAXIMO_ERROS_CAMPO = 100;
const MAXIMO_CAMPO = 200;
const MAXIMO_MENSAGEM = 500;

type ErroHttpGenerico = Pick<RespostaErro, "codigo" | "mensagem">;

const ERROS_HTTP: Readonly<Partial<Record<number, ErroHttpGenerico>>> = {
  [HttpStatus.BAD_REQUEST]: {
    codigo: "REQUISICAO_INVALIDA",
    mensagem: "A requisição informada é inválida.",
  },
  [HttpStatus.UNAUTHORIZED]: {
    codigo: "NAO_AUTENTICADO",
    mensagem: "Autenticação necessária.",
  },
  [HttpStatus.FORBIDDEN]: {
    codigo: "ACESSO_NEGADO",
    mensagem: "Você não possui permissão para realizar essa operação.",
  },
  [HttpStatus.NOT_FOUND]: {
    codigo: "RECURSO_NAO_ENCONTRADO",
    mensagem: "O recurso solicitado não foi encontrado.",
  },
  [HttpStatus.METHOD_NOT_ALLOWED]: {
    codigo: "METODO_NAO_PERMITIDO",
    mensagem: "O método HTTP não é permitido para este recurso.",
  },
  [HttpStatus.CONFLICT]: {
    codigo: "CONFLITO",
    mensagem: "A operação conflita com o estado atual do recurso.",
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    codigo: "PAYLOAD_MUITO_GRANDE",
    mensagem: "O conteúdo enviado excede o limite permitido.",
  },
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: {
    codigo: "TIPO_DE_MIDIA_NAO_SUPORTADO",
    mensagem: "O tipo de conteúdo enviado não é suportado.",
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    codigo: "ENTIDADE_NAO_PROCESSAVEL",
    mensagem: "Não foi possível processar os dados informados.",
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    codigo: "MUITAS_REQUISICOES",
    mensagem:
      "Muitas requisições foram realizadas. Tente novamente mais tarde.",
  },
};

function limitarTexto(
  valor: string,
  limite: number,
  valorPadrao: string,
): string {
  const texto = valor.trim();

  return (texto || valorPadrao).slice(0, limite);
}

function formatarCaminho(caminho: readonly PropertyKey[]): string {
  const campo = caminho.map(String).join(".");

  return limitarTexto(campo, MAXIMO_CAMPO, "requisicao");
}

function mapearCodigoZod(codigo: z.core.$ZodIssue["code"]): string {
  switch (codigo) {
    case "invalid_type":
      return "TIPO_INVALIDO";
    case "too_small":
      return "VALOR_MUITO_PEQUENO";
    case "too_big":
      return "VALOR_MUITO_GRANDE";
    case "invalid_format":
      return "FORMATO_INVALIDO";
    case "not_multiple_of":
      return "MULTIPLO_INVALIDO";
    case "unrecognized_keys":
      return "CAMPO_NAO_PERMITIDO";
    case "invalid_union":
      return "VALOR_INVALIDO";
    case "invalid_key":
      return "CHAVE_INVALIDA";
    case "invalid_element":
      return "ELEMENTO_INVALIDO";
    case "invalid_value":
      return "VALOR_INVALIDO";
    case "custom":
      return "REGRA_INVALIDA";
    default:
      return "VALOR_INVALIDO";
  }
}

function mapearIssueZod(issue: z.core.$ZodIssue): ErroCampo {
  const mensagem =
    issue.code === "unrecognized_keys"
      ? "Um ou mais campos informados não são permitidos."
      : issue.message;

  return {
    campo: formatarCaminho(issue.path),
    codigo: mapearCodigoZod(issue.code),
    mensagem: limitarTexto(
      mensagem,
      MAXIMO_MENSAGEM,
      "O valor informado é inválido.",
    ),
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const contextoHttp = host.switchToHttp();
    const request = contextoHttp.getRequest<RequisicaoComId>();
    const response = contextoHttp.getResponse();

    const requisicaoId = this.obterRequisicaoId(request);
    const respostaErro = this.mapearExcecao(exception, requisicaoId);

    if (respostaErro.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.registrarErroInterno(exception, respostaErro);
    }

    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response);
      return;
    }

    httpAdapter.reply(response, respostaErro, respostaErro.status);
  }

  private obterRequisicaoId(request: RequisicaoComId): string {
    const requisicaoId = request.requisicaoId?.trim();

    if (requisicaoId && requisicaoId.length <= 128) {
      return requisicaoId;
    }

    return randomUUID();
  }

  private mapearExcecao(
    exception: unknown,
    requisicaoId: string,
  ): RespostaErro {
    if (exception instanceof ZodValidationException) {
      return this.mapearErroValidacao(exception, requisicaoId);
    }

    if (exception instanceof HttpException) {
      return this.mapearExcecaoHttp(exception, requisicaoId);
    }

    return this.criarErroInterno(requisicaoId);
  }

  private mapearErroValidacao(
    exception: ZodValidationException,
    requisicaoId: string,
  ): RespostaErro {
    const erroZod = exception.getZodError();

    const erros =
      erroZod instanceof z.ZodError
        ? erroZod.issues.map(mapearIssueZod).slice(0, MAXIMO_ERROS_CAMPO)
        : [];

    return {
      status: HttpStatus.BAD_REQUEST,
      sucesso: false,
      codigo: "VALIDACAO_ENTRADA_INVALIDA",
      mensagem: "Os dados informados são inválidos.",
      erros,
      requisicaoId,
    };
  }

  private mapearExcecaoHttp(
    exception: HttpException,
    requisicaoId: string,
  ): RespostaErro {
    const status = exception.getStatus();

    if (
      !Number.isInteger(status) ||
      status < HttpStatus.BAD_REQUEST ||
      status >= HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      return this.criarErroInterno(requisicaoId);
    }

    const respostaDeclarada = this.tentarMapearRespostaDeclarada(
      exception,
      status,
      requisicaoId,
    );

    if (respostaDeclarada) {
      return respostaDeclarada;
    }

    const erroGenerico = ERROS_HTTP[status] ?? {
      codigo: "ERRO_NA_REQUISICAO",
      mensagem: "Não foi possível processar a requisição.",
    };

    return {
      status,
      sucesso: false,
      codigo: erroGenerico.codigo,
      mensagem: erroGenerico.mensagem,
      erros: [],
      requisicaoId,
    };
  }

  private tentarMapearRespostaDeclarada(
    exception: HttpException,
    status: number,
    requisicaoId: string,
  ): RespostaErro | null {
    const corpo = exception.getResponse();

    if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
      return null;
    }

    const resposta = RespostaErroSchema.safeParse({
      status,
      sucesso: false,
      codigo: Reflect.get(corpo, "codigo"),
      mensagem: Reflect.get(corpo, "mensagem"),
      erros: Reflect.get(corpo, "erros") ?? [],
      requisicaoId,
    });

    return resposta.success ? resposta.data : null;
  }

  private criarErroInterno(requisicaoId: string): RespostaErro {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sucesso: false,
      codigo: "ERRO_INTERNO",
      mensagem: "Ocorreu um erro interno.",
      erros: [],
      requisicaoId,
    };
  }

  private registrarErroInterno(
    exception: unknown,
    resposta: RespostaErro,
  ): void {
    const contexto = [
      `codigo=${resposta.codigo}`,
      `requisicaoId=${resposta.requisicaoId}`,
    ].join(" ");

    if (exception instanceof ZodSerializationException) {
      const erroZod = exception.getZodError();

      if (erroZod instanceof z.ZodError) {
        const issues = erroZod.issues
          .slice(0, MAXIMO_ERROS_CAMPO)
          .map((issue) => ({
            codigo: issue.code,
            campo: formatarCaminho(issue.path),
          }));

        this.logger.error(
          `Falha ao serializar resposta. ${contexto} issues=${JSON.stringify(issues)}`,
          exception.stack,
        );

        return;
      }
    }

    if (exception instanceof Error) {
      this.logger.error(`Exceção não tratada. ${contexto}`, exception.stack);

      return;
    }

    this.logger.error(
      `Valor desconhecido lançado como exceção. ${contexto} tipo=${typeof exception}`,
    );
  }
}
