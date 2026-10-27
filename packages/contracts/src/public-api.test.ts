import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CABECALHO_CSRF,
  AuthMeResponseSchema,
  AlterarSenhaBodySchema,
  AlterarSituacaoUsuarioSchema,
  AlterarUsuarioSchema,
  ConsultarUsuarioResponseSchema,
  CriarUsuarioResponseSchema,
  CriarUsuarioSchema,
  ErroCampoSchema,
  IdentidadeAutenticadaSchema,
  ListarUsuariosQuerySchema,
  ListarUsuariosResponseSchema,
  LoginBodySchema,
  LoginResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  RedefinirSenhaBodySchema,
  SenhaSchema,
  SolicitarRedefinicaoSenhaBodySchema,
  SolicitarRedefinicaoSenhaResponseSchema,
  TokenRedefinicaoSenhaSchema,
  MetaPaginacaoSchema,
  PaginacaoQuerySchema,
  PerfilUsuarioSchema,
  PatrimonioDetalheSchema,
  PatrimonioParamsSchema,
  PatrimonioResumoSchema,
  RespostaErroSchema,
  UsuarioDetalheSchema,
  UsuarioParamsSchema,
  UsuarioResumoSchema,
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
  ConsultarPatrimonioResponseSchema,
  StatusPatrimonioSchema,
  SubstituirNumeroPatrimonialBodySchema,
  SubstituirNumeroPatrimonialResponseSchema,
  TipoIncorporacaoSchema,
  TipoNumeroPatrimonialSchema,
  VALOR_CABECALHO_CSRF,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
  AlterarResponsavelSchema,
  AlterarNaturezaSchema,
  AlterarEspecieSchema,
  AlterarSetorSchema,
  AlterarFornecedorSchema,
  CriarResponsavelSchema,
  CriarNaturezaSchema,
  CriarEspecieSchema,
  CriarSetorSchema,
  CriarFornecedorSchema,
  ListarResponsaveisResponseSchema,
  ListarNaturezasResponseSchema,
  ListarEspeciesResponseSchema,
  ListarSetoresResponseSchema,
  ListarFornecedoresResponseSchema,
  AlterarSituacaoResponsavelSchema,
  ResponsavelParamsSchema,
  ListarResponsaveisQuerySchema,
  ResponsavelDetalheSchema,
  NaturezaParamsSchema,
  ListarNaturezasQuerySchema,
  NaturezaDetalheSchema,
  EspecieParamsSchema,
  ListarEspeciesQuerySchema,
  EspecieDetalheSchema,
  AlterarSituacaoSetorSchema,
  SetorParamsSchema,
  ListarSetoresQuerySchema,
  SetorDetalheSchema,
  CnpjFornecedorSchema,
  AlterarSituacaoFornecedorSchema,
  FornecedorParamsSchema,
  ListarFornecedoresQuerySchema,
  FornecedorDetalheSchema,
  AlterarAnexoNotaFiscalResponseSchema,
  AlterarNotaFiscalBodySchema,
  AlterarProcessoCompraBodySchema,
  CriarNotaFiscalMultipartSchema,
  CriarProcessoCompraMultipartSchema,
  ListarNotasFiscaisQuerySchema,
  ListarProcessosCompraQuerySchema,
  NotaFiscalDetalheSchema,
  NotaFiscalParamsSchema,
  ProcessoCompraDetalheSchema,
  ProcessoCompraParamsSchema,
  SubstituirAnexoNotaFiscalMultipartSchema,
  AdicionarMembroComissaoBodySchema,
  AdicionarMembroComissaoResponseSchema,
  AlterarComissaoBodySchema,
  AlterarComissaoResponseSchema,
  AlterarMembroComissaoBodySchema,
  AlterarMembroComissaoResponseSchema,
  ComissaoDetalheSchema,
  ComissaoParamsSchema,
  ComissaoResumoSchema,
  CriarComissaoBodySchema,
  CriarComissaoResponseSchema,
  ConsultarComissaoResponseSchema,
  ListarComissoesQuerySchema,
  ListarComissoesResponseSchema,
  MembroComissaoParamsSchema,
  MembroComissaoResponseSchema,
  TipoMembroComissaoSchema,
  CodigoErroInventarioSchema,
  ConcluirSetorInventarioBodySchema,
  ConcluirSetorInventarioResponseSchema,
  ConsultarInventarioResponseSchema,
  CorrigirItemInventarioBodySchema,
  CorrigirItemInventarioResponseSchema,
  CriarInventarioBodySchema,
  CriarInventarioResponseSchema,
  FinalizarInventarioBodySchema,
  FinalizarInventarioResponseSchema,
  IniciarSetorInventarioBodySchema,
  IniciarSetorInventarioResponseSchema,
  InventarioDetalheSchema,
  InventarioParamsSchema,
  InventarioResumoSchema,
  ItemInventarioParamsSchema,
  ItemInventarioResponseSchema,
  ItemJaVerificadoOutroSetorResponseSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarItensInventarioQuerySchema,
  ListarItensInventarioResponseSchema,
  ListarSetoresInventarioQuerySchema,
  ListarSetoresInventarioResponseSchema,
  SetorInventarioParamsSchema,
  SetorInventarioResumoSchema,
  SituacaoItemInventarioSchema,
  StatusCorrecaoItemInventarioSchema,
  StatusInventarioSchema,
  StatusSetorInventarioSchema,
  StatusVerificacaoItemInventarioSchema,
  TipoCorrecaoItemInventarioSchema,
  VerificarItemInventarioBodySchema,
  VerificarItemInventarioResponseSchema,
  ConcluirPrimeiroAcessoBodySchema,
  BaixaPatrimonioDetalheSchema,
  BaixarPatrimonioDadosSchema,
  BaixarPatrimonioMultipartSchema,
  BaixarPatrimonioResponseSchema,
  CodigoErroBaixaPatrimonioSchema,
  ConsultarBaixaPatrimonioResponseSchema,
  TipoBaixaPatrimonioSchema,
} from "./index";

describe("@repo/contracts — API pública", () => {
  it("exporta os schemas genéricos do baseline", () => {
    const schemas = [
      MetaPaginacaoSchema,
      ErroCampoSchema,
      RespostaErroSchema,
      PaginacaoQuerySchema,
    ];

    for (const schema of schemas) {
      assert.equal(typeof schema.safeParse, "function");
    }

    assert.equal(typeof criarRespostaSucessoSchema, "function");
    assert.equal(typeof criarRespostaSucessoPaginadaSchema, "function");
  });

  it("exporta os contratos de identidade e CSRF pelo entrypoint", () => {
    assert.equal(typeof PerfilUsuarioSchema.safeParse, "function");
    assert.equal(typeof IdentidadeAutenticadaSchema.safeParse, "function");
    assert.equal(CABECALHO_CSRF, "X-SIPAT-CSRF");
    assert.equal(VALOR_CABECALHO_CSRF, "1");
  });

  it("exporta os contratos de autenticação pelo entrypoint", () => {
    for (const schema of [
      SenhaSchema,
      LoginBodySchema,
      LoginResponseSchema,
      AuthMeResponseSchema,
      AlterarSenhaBodySchema,
      ConcluirPrimeiroAcessoBodySchema,
      SolicitarRedefinicaoSenhaBodySchema,
      RedefinirSenhaBodySchema,
      SolicitarRedefinicaoSenhaResponseSchema,
      TokenRedefinicaoSenhaSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos de gestão de usuários pelo entrypoint", () => {
    const schemas = [
      UsuarioParamsSchema,
      ListarUsuariosQuerySchema,
      CriarUsuarioSchema,
      AlterarUsuarioSchema,
      AlterarSituacaoUsuarioSchema,
      UsuarioResumoSchema,
      UsuarioDetalheSchema,
      ListarUsuariosResponseSchema,
      CriarUsuarioResponseSchema,
      ConsultarUsuarioResponseSchema,
    ];

    for (const schema of schemas) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta somente os contratos públicos das operações de patrimônios", () => {
    const schemas = [
      TipoNumeroPatrimonialSchema,
      StatusPatrimonioSchema,
      TipoIncorporacaoSchema,
      PatrimonioParamsSchema,
      CriarPatrimonioBodySchema,
      ListarPatrimoniosQuerySchema,
      SubstituirNumeroPatrimonialBodySchema,
      PatrimonioResumoSchema,
      PatrimonioDetalheSchema,
      ListarPatrimoniosResponseSchema,
      CriarPatrimonioResponseSchema,
      ConsultarPatrimonioResponseSchema,
      SubstituirNumeroPatrimonialResponseSchema,
    ];

    for (const schema of schemas) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos dos cadastros patrimoniais relacionados", () => {
    for (const schema of [
      CriarResponsavelSchema,
      AlterarResponsavelSchema,
      AlterarSituacaoResponsavelSchema,
      ResponsavelParamsSchema,
      ListarResponsaveisQuerySchema,
      ResponsavelDetalheSchema,
      ListarResponsaveisResponseSchema,
      CriarNaturezaSchema,
      AlterarNaturezaSchema,
      NaturezaParamsSchema,
      ListarNaturezasQuerySchema,
      NaturezaDetalheSchema,
      ListarNaturezasResponseSchema,
      CriarEspecieSchema,
      AlterarEspecieSchema,
      EspecieParamsSchema,
      ListarEspeciesQuerySchema,
      EspecieDetalheSchema,
      ListarEspeciesResponseSchema,
      CriarSetorSchema,
      AlterarSetorSchema,
      AlterarSituacaoSetorSchema,
      SetorParamsSchema,
      ListarSetoresQuerySchema,
      SetorDetalheSchema,
      ListarSetoresResponseSchema,
      CnpjFornecedorSchema,
      CriarFornecedorSchema,
      AlterarFornecedorSchema,
      AlterarSituacaoFornecedorSchema,
      FornecedorParamsSchema,
      ListarFornecedoresQuerySchema,
      FornecedorDetalheSchema,
      ListarFornecedoresResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos de processos de compra e notas fiscais", () => {
    for (const schema of [
      ProcessoCompraParamsSchema,
      CriarProcessoCompraMultipartSchema,
      AlterarProcessoCompraBodySchema,
      ListarProcessosCompraQuerySchema,
      ProcessoCompraDetalheSchema,
      NotaFiscalParamsSchema,
      CriarNotaFiscalMultipartSchema,
      AlterarNotaFiscalBodySchema,
      ListarNotasFiscaisQuerySchema,
      NotaFiscalDetalheSchema,
      SubstituirAnexoNotaFiscalMultipartSchema,
      AlterarAnexoNotaFiscalResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos de comissões e integrantes", () => {
    for (const schema of [
      TipoMembroComissaoSchema,
      ComissaoParamsSchema,
      MembroComissaoParamsSchema,
      CriarComissaoBodySchema,
      CriarComissaoResponseSchema,
      ConsultarComissaoResponseSchema,
      AlterarComissaoBodySchema,
      AlterarComissaoResponseSchema,
      AdicionarMembroComissaoBodySchema,
      AdicionarMembroComissaoResponseSchema,
      AlterarMembroComissaoBodySchema,
      AlterarMembroComissaoResponseSchema,
      ListarComissoesQuerySchema,
      MembroComissaoResponseSchema,
      ComissaoResumoSchema,
      ComissaoDetalheSchema,
      ListarComissoesResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos públicos das operações de inventários", () => {
    for (const schema of [
      StatusInventarioSchema,
      StatusSetorInventarioSchema,
      SituacaoItemInventarioSchema,
      StatusVerificacaoItemInventarioSchema,
      StatusCorrecaoItemInventarioSchema,
      TipoCorrecaoItemInventarioSchema,
      CodigoErroInventarioSchema,
      InventarioParamsSchema,
      SetorInventarioParamsSchema,
      ItemInventarioParamsSchema,
      CriarInventarioBodySchema,
      ListarInventariosQuerySchema,
      ListarSetoresInventarioQuerySchema,
      ListarItensInventarioQuerySchema,
      IniciarSetorInventarioBodySchema,
      VerificarItemInventarioBodySchema,
      CorrigirItemInventarioBodySchema,
      ConcluirSetorInventarioBodySchema,
      FinalizarInventarioBodySchema,
      InventarioResumoSchema,
      InventarioDetalheSchema,
      SetorInventarioResumoSchema,
      ItemInventarioResponseSchema,
      ListarInventariosResponseSchema,
      CriarInventarioResponseSchema,
      ConsultarInventarioResponseSchema,
      ListarSetoresInventarioResponseSchema,
      ListarItensInventarioResponseSchema,
      IniciarSetorInventarioResponseSchema,
      VerificarItemInventarioResponseSchema,
      CorrigirItemInventarioResponseSchema,
      ConcluirSetorInventarioResponseSchema,
      FinalizarInventarioResponseSchema,
      ItemJaVerificadoOutroSetorResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos públicos das baixas patrimoniais", () => {
    for (const schema of [
      TipoBaixaPatrimonioSchema,
      CodigoErroBaixaPatrimonioSchema,
      BaixarPatrimonioDadosSchema,
      BaixarPatrimonioMultipartSchema,
      BaixaPatrimonioDetalheSchema,
      BaixarPatrimonioResponseSchema,
      ConsultarBaixaPatrimonioResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });
});
