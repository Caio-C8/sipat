import {
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";
import { RespostaErroSchema, type RespostaErro } from "@repo/contracts";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import * as z from "zod";
import { ApiExceptionFilter } from "../api-exception.filter";
import { DependenciaConsultaIndisponivelException } from "../../http/dependencia-consulta-indisponivel.exception";

const REQUISICAO_ID = "requisicao-teste";

type RequisicaoTeste = {
  requisicaoId?: string;
};

type HttpAdapterMock = {
  reply: jest.Mock;
  isHeadersSent: jest.Mock;
  end: jest.Mock;
};

function criarArgumentsHost(
  request: RequisicaoTeste,
  response: object,
): ArgumentsHost {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
      getResponse: jest.fn().mockReturnValue(response),
    }),
  } as unknown as ArgumentsHost;
}

describe("ApiExceptionFilter", () => {
  let filter: ApiExceptionFilter;
  let httpAdapter: HttpAdapterMock;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    httpAdapter = {
      reply: jest.fn(),
      isHeadersSent: jest.fn().mockReturnValue(false),
      end: jest.fn(),
    };

    const httpAdapterHost = {
      httpAdapter,
    } as unknown as HttpAdapterHost;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);

    filter = new ApiExceptionFilter(httpAdapterHost);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function executarFiltro(
    exception: unknown,
    request: RequisicaoTeste = {
      requisicaoId: REQUISICAO_ID,
    },
  ): RespostaErro {
    const response = {};
    const host = criarArgumentsHost(request, response);

    filter.catch(exception, host);

    expect(httpAdapter.reply).toHaveBeenCalledTimes(1);

    const chamada = httpAdapter.reply.mock.calls[0];

    if (!chamada) {
      throw new Error("O adaptador HTTP não recebeu nenhuma resposta.");
    }

    expect(chamada[0]).toBe(response);

    const corpo = RespostaErroSchema.parse(chamada[1]);

    expect(chamada[2]).toBe(corpo.status);

    return corpo;
  }

  describe("validação Zod", () => {
    it("converte as issues do Zod para erros de campo", () => {
      const resultado = z
        .strictObject({
          nome: z.string().min(3, {
            error: "O nome deve possuir pelo menos 3 caracteres.",
          }),
        })
        .safeParse({
          nome: "a",
          campoInesperado: true,
        });

      if (resultado.success) {
        throw new Error("O schema deveria rejeitar o valor de teste.");
      }

      const corpo = executarFiltro(new ZodValidationException(resultado.error));

      expect(corpo).toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        sucesso: false,
        codigo: "VALIDACAO_ENTRADA_INVALIDA",
        mensagem: "Os dados informados são inválidos.",
        requisicaoId: REQUISICAO_ID,
      });

      expect(corpo.erros).toEqual(
        expect.arrayContaining([
          {
            campo: "nome",
            codigo: "VALOR_MUITO_PEQUENO",
            mensagem: "O nome deve possuir pelo menos 3 caracteres.",
          },
          {
            campo: "requisicao",
            codigo: "CAMPO_NAO_PERMITIDO",
            mensagem: "Um ou mais campos informados não são permitidos.",
          },
        ]),
      );

      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it("retorna erros vazios quando a exceção não contém um ZodError", () => {
      const corpo = executarFiltro(
        new ZodValidationException(new Error("Erro desconhecido")),
      );

      expect(corpo).toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        codigo: "VALIDACAO_ENTRADA_INVALIDA",
        erros: [],
      });
    });

    it("limita a resposta a 100 erros de campo", () => {
      const valoresInvalidos = Array.from({ length: 101 }, () => 123);
      const resultado = z.array(z.string()).safeParse(valoresInvalidos);

      if (resultado.success) {
        throw new Error("O schema deveria rejeitar o valor de teste.");
      }

      const corpo = executarFiltro(new ZodValidationException(resultado.error));

      expect(corpo.erros).toHaveLength(100);
    });
  });

  describe("exceções HTTP declaradas", () => {
    it("preserva uma resposta pública válida", () => {
      const exception = new HttpException(
        {
          codigo: "EMAIL_JA_UTILIZADO",
          mensagem: "O e-mail informado já está em uso.",
          erros: [
            {
              campo: "email",
              codigo: "VALOR_JA_UTILIZADO",
              mensagem: "Este e-mail já está sendo utilizado.",
            },
          ],
        },
        HttpStatus.CONFLICT,
      );

      const corpo = executarFiltro(exception);

      expect(corpo).toEqual({
        status: HttpStatus.CONFLICT,
        sucesso: false,
        codigo: "EMAIL_JA_UTILIZADO",
        mensagem: "O e-mail informado já está em uso.",
        erros: [
          {
            campo: "email",
            codigo: "VALOR_JA_UTILIZADO",
            mensagem: "Este e-mail já está sendo utilizado.",
          },
        ],
        requisicaoId: REQUISICAO_ID,
      });

      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it("ignora uma resposta declarada que não atende ao contrato", () => {
      const exception = new HttpException(
        {
          codigo: "codigo_invalido",
          mensagem: "Esta mensagem não deve ser exposta.",
          erros: [],
        },
        HttpStatus.NOT_FOUND,
      );

      const corpo = executarFiltro(exception);

      expect(corpo).toMatchObject({
        status: HttpStatus.NOT_FOUND,
        codigo: "RECURSO_NAO_ENCONTRADO",
        mensagem: "O recurso solicitado não foi encontrado.",
        erros: [],
      });

      expect(JSON.stringify(corpo)).not.toContain(
        "Esta mensagem não deve ser exposta.",
      );
    });
  });

  describe("exceções HTTP genéricas", () => {
    it.each([
      [
        HttpStatus.BAD_REQUEST,
        "REQUISICAO_INVALIDA",
        "A requisição informada é inválida.",
      ],
      [HttpStatus.UNAUTHORIZED, "NAO_AUTENTICADO", "Autenticação necessária."],
      [
        HttpStatus.FORBIDDEN,
        "ACESSO_NEGADO",
        "Você não possui permissão para realizar essa operação.",
      ],
      [
        HttpStatus.NOT_FOUND,
        "RECURSO_NAO_ENCONTRADO",
        "O recurso solicitado não foi encontrado.",
      ],
      [
        HttpStatus.METHOD_NOT_ALLOWED,
        "METODO_NAO_PERMITIDO",
        "O método HTTP não é permitido para este recurso.",
      ],
      [
        HttpStatus.CONFLICT,
        "CONFLITO",
        "A operação conflita com o estado atual do recurso.",
      ],
      [
        HttpStatus.PAYLOAD_TOO_LARGE,
        "PAYLOAD_MUITO_GRANDE",
        "O conteúdo enviado excede o limite permitido.",
      ],
      [
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "TIPO_DE_MIDIA_NAO_SUPORTADO",
        "O tipo de conteúdo enviado não é suportado.",
      ],
      [
        HttpStatus.UNPROCESSABLE_ENTITY,
        "ENTIDADE_NAO_PROCESSAVEL",
        "Não foi possível processar os dados informados.",
      ],
      [
        HttpStatus.TOO_MANY_REQUESTS,
        "MUITAS_REQUISICOES",
        "Muitas requisições foram realizadas. Tente novamente mais tarde.",
      ],
    ] as const)(
      "mapeia o status %i para o código %s",
      (status, codigo, mensagem) => {
        const corpo = executarFiltro(
          new HttpException("Mensagem interna", status),
        );

        expect(corpo).toMatchObject({
          status,
          sucesso: false,
          codigo,
          mensagem,
          erros: [],
          requisicaoId: REQUISICAO_ID,
        });

        expect(JSON.stringify(corpo)).not.toContain("Mensagem interna");
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      },
    );

    it("usa o fallback para um status 4xx sem mapeamento específico", () => {
      const corpo = executarFiltro(
        new HttpException("Mensagem interna", HttpStatus.I_AM_A_TEAPOT),
      );

      expect(corpo).toMatchObject({
        status: HttpStatus.I_AM_A_TEAPOT,
        codigo: "ERRO_NA_REQUISICAO",
        mensagem: "Não foi possível processar a requisição.",
        erros: [],
      });
    });

    it.each([399, 499.5, 500, 503, 600])(
      "converte o status inválido ou interno %p para 500",
      (status) => {
        const corpo = executarFiltro(
          new HttpException("Detalhes internos", status),
        );

        expect(corpo).toEqual({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sucesso: false,
          codigo: "ERRO_INTERNO",
          mensagem: "Ocorreu um erro interno.",
          erros: [],
          requisicaoId: REQUISICAO_ID,
        });

        expect(JSON.stringify(corpo)).not.toContain("Detalhes internos");
        expect(loggerErrorSpy).toHaveBeenCalled();
      },
    );

    it("não expõe uma resposta declarada por uma exceção 5xx", () => {
      const exception = new HttpException(
        {
          codigo: "DETALHE_INTERNO",
          mensagem: "Uma informação interna sensível.",
          erros: [],
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      const corpo = executarFiltro(exception);

      expect(corpo).toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: "ERRO_INTERNO",
        mensagem: "Ocorreu um erro interno.",
      });

      expect(JSON.stringify(corpo)).not.toContain("DETALHE_INTERNO");
      expect(JSON.stringify(corpo)).not.toContain(
        "Uma informação interna sensível.",
      );
    });
  });

  describe("exceções não HTTP", () => {
    it("preserva 503 opt-in das consultas, com mensagem fixa sem dados internos", () => {
      const corpo = executarFiltro(
        new DependenciaConsultaIndisponivelException("SQL e caminho interno"),
      );
      expect(corpo).toMatchObject({
        status: 503,
        codigo: "SERVICO_INDISPONIVEL",
      });
      expect(JSON.stringify(corpo)).not.toContain("SQL");
    });
    it("converte um Error desconhecido para erro interno", () => {
      const corpo = executarFiltro(new Error("Não deve aparecer na resposta"));

      expect(corpo).toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: "ERRO_INTERNO",
        mensagem: "Ocorreu um erro interno.",
      });

      expect(JSON.stringify(corpo)).not.toContain(
        "Não deve aparecer na resposta",
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Exceção não tratada."),
        expect.any(String),
      );
    });

    it("trata um valor que não é uma instância de Error", () => {
      const corpo = executarFiltro("erro lançado como string");

      expect(corpo).toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: "ERRO_INTERNO",
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("tipo=string"),
      );
    });
  });

  describe("erro de serialização da resposta", () => {
    it("retorna erro interno e registra apenas código e caminho das issues", () => {
      const resultado = z
        .object({
          dados: z.object({
            preco: z.string(),
          }),
        })
        .safeParse({
          dados: {
            preco: 123,
          },
        });

      if (resultado.success) {
        throw new Error("O schema deveria rejeitar o valor de teste.");
      }

      const corpo = executarFiltro(
        new ZodSerializationException(resultado.error),
      );

      expect(corpo).toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: "ERRO_INTERNO",
        mensagem: "Ocorreu um erro interno.",
      });

      const mensagemLog = String(loggerErrorSpy.mock.calls[0]?.[0]);

      expect(mensagemLog).toContain("Falha ao serializar resposta.");
      expect(mensagemLog).toContain("dados.preco");
      expect(mensagemLog).not.toContain("123");
    });
  });

  describe("identificador da requisição", () => {
    it("preserva um identificador existente", () => {
      const corpo = executarFiltro(
        new HttpException("Inválido", HttpStatus.BAD_REQUEST),
        {
          requisicaoId: " identificador-existente ",
        },
      );

      expect(corpo.requisicaoId).toBe("identificador-existente");
    });

    it("gera um UUID quando o identificador não existe", () => {
      const corpo = executarFiltro(
        new HttpException("Inválido", HttpStatus.BAD_REQUEST),
        {},
      );

      expect(z.uuid().safeParse(corpo.requisicaoId).success).toBe(true);
    });

    it("gera um UUID quando o identificador excede 128 caracteres", () => {
      const corpo = executarFiltro(
        new HttpException("Inválido", HttpStatus.BAD_REQUEST),
        {
          requisicaoId: "a".repeat(129),
        },
      );

      expect(z.uuid().safeParse(corpo.requisicaoId).success).toBe(true);
    });
  });

  describe("resposta já iniciada", () => {
    it("encerra a resposta sem tentar enviar outro corpo", () => {
      const response = {};
      const host = criarArgumentsHost(
        {
          requisicaoId: REQUISICAO_ID,
        },
        response,
      );

      httpAdapter.isHeadersSent.mockReturnValue(true);

      filter.catch(new HttpException("Inválido", HttpStatus.BAD_REQUEST), host);

      expect(httpAdapter.end).toHaveBeenCalledWith(response);
      expect(httpAdapter.reply).not.toHaveBeenCalled();
    });
  });
});
