import type { FornecedorDetalhe } from "@repo/contracts";
import { DetalheCadastroSomenteLeitura } from "@/features/cadastros/components/cadastros-telas";
import { formatarCnpj } from "./fornecedor-list";

const formatarData = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value))
    : "Sem alteração registrada";

export function DetalheFornecedor({
  registro,
}: {
  registro: FornecedorDetalhe;
}) {
  return (
    <DetalheCadastroSomenteLeitura
      titulo="Dados do fornecedor"
      campos={[
        { rotulo: "Razão social", valor: registro.razaoSocial },
        {
          rotulo: "Nome fantasia",
          valor: registro.nomeFantasia ?? "Não informado",
        },
        {
          rotulo: "Representante",
          valor: registro.nomeRepresentante ?? "Não informado",
        },
        {
          rotulo: "CNPJ",
          valor: formatarCnpj(registro.cnpj) ?? "Não informado",
        },
        { rotulo: "E-mail", valor: registro.email ?? "Não informado" },
        { rotulo: "Telefone", valor: registro.telefone ?? "Não informado" },
        { rotulo: "Endereço", valor: registro.endereco ?? "Não informado" },
        { rotulo: "Situação", valor: registro.ativo ? "Ativo" : "Inativo" },
        { rotulo: "Criado em", valor: formatarData(registro.createdAt) },
        {
          rotulo: "Última atualização",
          valor: formatarData(registro.updatedAt),
        },
      ]}
    />
  );
}
