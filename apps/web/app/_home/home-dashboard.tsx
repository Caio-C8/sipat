import {
  ArrowLeftRight,
  Box,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ClipboardList,
  Clock3,
  Info,
  Landmark,
  MapPin,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import type { ResumoPatrimonialDashboard } from "@/features/patrimonios/api/patrimonio-operations";
import { nomesPerfis } from "@/lib/navigation/system-navigation";

type EstadoResumoPatrimonial =
  | Readonly<{ status: "sucesso"; dados: ResumoPatrimonialDashboard }>
  | Readonly<{ status: "erro" }>;

const quickActions = [
  { label: "Cadastrar bem", icon: Plus },
  { label: "Pesquisar bem", icon: Search },
  { label: "Movimentar bens", icon: ArrowLeftRight },
  { label: "Manutenção", icon: Wrench },
  { label: "Inventário", icon: ClipboardList },
  { label: "Relatórios", icon: ChartNoAxesColumn },
] as const;

const MENSAGEM_NAO_IMPLEMENTADO =
  "Dados ainda não disponíveis — integração não implementada";

const summaryToneClasses = {
  blue: "bg-[#eff5ff] text-[#2864f0]",
  green: "bg-[#e9fbf4] text-[#008e71]",
  orange: "bg-[#fff7ed] text-[#b2571d]",
  purple: "bg-[#f6efff] text-[#8546ec]",
} as const;

const legendToneClasses = {
  blue: "text-[#2864f0]",
  orange: "text-[#b2571d]",
  purple: "text-[#8546ec]",
  muted: "text-[#cbd6e5]",
} as const;

function pluralizarItens(quantidade: number): string {
  return quantidade === 1 ? "item" : "itens";
}

function formatarData(data: Date): { iso: string; texto: string } {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return {
    iso: `${ano}-${mes}-${dia}`,
    texto: new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(data),
  };
}

function criarGradienteSituacoes(
  situacoes: readonly Readonly<{ amount: number; color: string }>[],
): string {
  const total = situacoes.reduce((soma, situacao) => soma + situacao.amount, 0);

  if (total === 0) return "#e7edf5";

  let acumulado = 0;
  const intervalos = situacoes.map(({ amount, color }) => {
    const inicio = (acumulado / total) * 100;
    acumulado += amount;
    return `${color} ${inicio}% ${(acumulado / total) * 100}%`;
  });

  return `conic-gradient(${intervalos.join(", ")})`;
}

function EstadoNaoImplementado() {
  return (
    <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd7e6] bg-[#f8fafc] p-4 text-center text-[10px] text-[#526984] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
      <Info size={18} aria-hidden="true" />
      <p className="m-0">{MENSAGEM_NAO_IMPLEMENTADO}</p>
    </div>
  );
}

export function HomeDashboard({
  identidade,
  resumoPatrimonial,
  dataAtual = new Date(),
}: Readonly<{
  identidade: IdentidadeAutenticada;
  resumoPatrimonial: EstadoResumoPatrimonial;
  dataAtual?: Date;
}>) {
  const perfil = nomesPerfis[identidade.perfil];
  const data = formatarData(dataAtual);
  const dados =
    resumoPatrimonial.status === "sucesso"
      ? resumoPatrimonial.dados
      : undefined;
  const summary = [
    {
      title: "Total de bens",
      value: dados?.total,
      detail: dados
        ? `Inclui ${dados.porStatus.BAIXADO} ${pluralizarItens(dados.porStatus.BAIXADO)} baixados preservados`
        : "Dados indisponíveis no momento",
      icon: Box,
      tone: "blue",
    },
    {
      title: "Bens ativos",
      value: dados?.porStatus.ATIVO,
      detail: dados
        ? "Situação atual dos cadastros"
        : "Dados indisponíveis no momento",
      icon: Check,
      tone: "green",
    },
    {
      title: "Em manutenção",
      value: dados?.porStatus.EM_MANUTENCAO,
      detail: dados
        ? `${dados.porStatus.EM_MANUTENCAO} ${pluralizarItens(dados.porStatus.EM_MANUTENCAO)} nesta situação`
        : "Dados indisponíveis no momento",
      icon: Wrench,
      tone: "orange",
    },
    {
      title: "Em empréstimo",
      value: dados?.porStatus.EMPRESTADO,
      detail: dados
        ? `${dados.porStatus.EMPRESTADO} ${pluralizarItens(dados.porStatus.EMPRESTADO)} nesta situação`
        : "Dados indisponíveis no momento",
      icon: Landmark,
      tone: "purple",
    },
  ] as const;
  const situations = dados
    ? ([
        {
          label: "Ativos",
          amount: dados.porStatus.ATIVO,
          tone: "blue",
          color: "#2860eb",
        },
        {
          label: "Em manutenção",
          amount: dados.porStatus.EM_MANUTENCAO,
          tone: "orange",
          color: "#f59e0b",
        },
        {
          label: "Em empréstimo",
          amount: dados.porStatus.EMPRESTADO,
          tone: "purple",
          color: "#8852ef",
        },
        {
          label: "Baixados",
          amount: dados.porStatus.BAIXADO,
          tone: "muted",
          color: "#cbd6e5",
        },
      ] as const)
    : undefined;

  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]">
      <div className="flex flex-col items-start justify-between gap-4 min-[651px]:flex-row min-[651px]:items-center">
        <div>
          <h1 className="text-xl leading-tight font-bold text-[#111d34] min-[1500px]:text-[27px]">
            Bem-vindo, {identidade.nome}!
          </h1>
          <p className="mt-0.5 text-[10px] leading-tight text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[13px]">
            Acompanhe o patrimônio da Câmara e veja o que precisa da sua
            atenção.
          </p>
        </div>
        <span className="flex min-w-0 items-center gap-2.5 self-stretch rounded-md border border-[#dfe7f1] bg-white px-2.5 py-2 text-[10px] whitespace-nowrap text-[#3f587b] min-[361px]:min-w-[196px] min-[651px]:self-auto max-[1100px]:text-[11px] min-[1500px]:min-w-60 min-[1500px]:px-[13px] min-[1500px]:py-2.5 min-[1500px]:text-xs">
          <CalendarDays size={16} aria-hidden="true" />
          <time dateTime={data.iso}>{data.texto}</time>
        </span>
      </div>

      {resumoPatrimonial.status === "erro" ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-[#f1c7c7] bg-[#fff7f7] px-3 py-2 text-[10px] text-[#8b2c2c] min-[1500px]:text-[11px]"
          role="alert"
        >
          <Info size={18} aria-hidden="true" />
          <p className="m-0">
            Não foi possível carregar os dados patrimoniais. Tente novamente
            mais tarde.
          </p>
        </div>
      ) : null}

      <section
        className="grid grid-cols-1 gap-2 min-[361px]:grid-cols-2 min-[421px]:gap-3.5 min-[801px]:grid-cols-4 min-[1500px]:gap-[18px]"
        aria-label="Resumo dos bens"
      >
        {summary.map(({ title, value, detail, icon: Icon, tone }) => (
          <article
            className="grid min-h-[70px] min-w-0 content-between rounded-lg border border-[#dfe7f1] bg-white px-3 py-2 max-[420px]:p-2.5 min-[1500px]:min-h-[93px] min-[1500px]:px-4 min-[1500px]:pt-[13px] min-[1500px]:pb-2.5"
            key={title}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg min-[1500px]:size-10 [&_svg]:min-[1500px]:size-[23px] ${summaryToneClasses[tone]}`}
              >
                <Icon size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-xs">
                  {title}
                </p>
                <strong className="mt-0.5 block text-xl leading-none text-[#1d3b66] min-[1500px]:text-[27px]">
                  {value ?? "—"}
                </strong>
              </div>
            </div>
            <p className="mt-1 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-3.5 min-[801px]:grid-cols-[1.55fr_1fr] min-[1500px]:gap-[18px]">
        <section
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4"
          aria-labelledby="attention-title"
        >
          <div className="mb-2.5 flex items-start gap-2 min-[1500px]:mb-3.5 min-[1500px]:gap-3">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-lg bg-[#eff5ff] text-[#2860eb] min-[1500px]:size-[29px]">
              <Info size={15} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="attention-title"
                className="text-xs leading-tight font-bold text-[#17243c] max-[1100px]:text-[13px] min-[1500px]:text-base"
              >
                Pendências de atenção
              </h2>
              <p className="mt-0.5 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
                Acompanhamento de registros que precisam de análise.
              </p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>

        <section
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4"
          aria-labelledby="situation-title"
        >
          <div className="mb-2.5 flex items-start gap-2 min-[1500px]:mb-3.5 min-[1500px]:gap-3">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-lg bg-[#eff5ff] text-[#2860eb] min-[1500px]:size-[29px]">
              <ChartNoAxesColumn size={15} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="situation-title"
                className="text-xs leading-tight font-bold text-[#17243c] max-[1100px]:text-[13px] min-[1500px]:text-base"
              >
                Bens por situação
              </h2>
              <p className="mt-0.5 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
                {dados
                  ? `Distribuição atual · ${dados.total} ${pluralizarItens(dados.total)} cadastrados.`
                  : "Distribuição atual dos cadastros."}
              </p>
            </div>
          </div>
          {dados && situations ? (
            <>
              <div className="flex min-h-[120px] flex-wrap items-center gap-3 px-0 min-[421px]:flex-nowrap min-[1101px]:gap-6 min-[1101px]:px-3 min-[1500px]:min-h-40 min-[1500px]:gap-[30px] min-[1500px]:px-[18px]">
                <div
                  className="grid size-[102px] shrink-0 place-items-center rounded-full min-[1500px]:size-[132px]"
                  role="img"
                  aria-label={`${situations[0].amount} ativos, ${situations[1].amount} em manutenção, ${situations[2].amount} em empréstimo e ${situations[3].amount} baixados; ${dados.total} bens no total`}
                  style={{ background: criarGradienteSituacoes(situations) }}
                >
                  <div className="grid size-[73px] content-center justify-items-center rounded-full bg-white min-[1500px]:size-[94px]">
                    <strong className="text-[19px] leading-tight text-[#1c3a66] min-[1500px]:text-[25px]">
                      {dados.total}
                    </strong>
                    <span className="text-[9px] text-[#62748e] min-[1500px]:text-[11px]">
                      bens
                    </span>
                  </div>
                </div>
                <ul className="grid min-w-[130px] max-w-[280px] flex-1 list-none gap-2.5 p-0 min-[1500px]:gap-3">
                  {situations.map(({ label, amount, tone }) => (
                    <li
                      className="flex items-center gap-2 text-[9px] text-[#637792] max-[1100px]:text-[11px] min-[1500px]:text-[11px]"
                      key={label}
                    >
                      <span
                        className={`size-[7px] shrink-0 rounded-full bg-current ${legendToneClasses[tone]}`}
                      />{" "}
                      <span>{label}</span>
                      <strong className="ml-auto text-[10px] text-[#244061] min-[1500px]:text-xs">
                        {amount}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
                {dados.total === 0
                  ? "Nenhum patrimônio cadastrado."
                  : "Bens baixados continuam disponíveis no histórico."}
              </p>
            </>
          ) : (
            <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd7e6] bg-[#f8fafc] p-4 text-center text-[10px] text-[#526984] min-[1500px]:text-[11px]">
              Dados patrimoniais indisponíveis no momento.
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-3.5 min-[801px]:grid-cols-[0.94fr_1.06fr] min-[1500px]:gap-[18px]">
        <section
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4"
          aria-labelledby="sector-title"
        >
          <div className="mb-2.5 flex items-start gap-2 min-[1500px]:mb-3.5 min-[1500px]:gap-3">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-lg bg-[#eff5ff] text-[#2860eb] min-[1500px]:size-[29px]">
              <MapPin size={15} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="sector-title"
                className="text-xs leading-tight font-bold text-[#17243c] max-[1100px]:text-[13px] min-[1500px]:text-base"
              >
                Bens por setor
              </h2>
              <p className="mt-0.5 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
                Distribuição dos bens entre os setores.
              </p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>

        <section
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4"
          aria-labelledby="activities-title"
        >
          <div className="mb-2.5 flex items-start gap-2 min-[1500px]:mb-3.5 min-[1500px]:gap-3">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-lg bg-[#eff5ff] text-[#2860eb] min-[1500px]:size-[29px]">
              <Clock3 size={15} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="activities-title"
                className="text-xs leading-tight font-bold text-[#17243c] max-[1100px]:text-[13px] min-[1500px]:text-base"
              >
                Últimas atividades
              </h2>
              <p className="mt-0.5 text-[9px] text-[#62748e] max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
                Registros recentes do patrimônio.
              </p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>
      </div>

      <section
        className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4"
        aria-labelledby="quick-title"
      >
        <h2
          id="quick-title"
          className="text-xs leading-tight font-bold text-[#1c3962] max-[1100px]:text-[13px] min-[1500px]:text-base"
        >
          Ações rápidas
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-2.5 min-[421px]:grid-cols-2 min-[651px]:grid-cols-3 min-[1101px]:grid-cols-6 min-[1500px]:mt-3.5 min-[1500px]:gap-3.5">
          {quickActions.map(({ label, icon: Icon }) => (
            <button
              className="flex min-h-[29px] min-w-0 cursor-not-allowed items-center gap-2 rounded-md border border-[#dfe7f1] bg-[#f8fafc] px-2.5 py-1 text-left text-[9px] font-bold whitespace-nowrap text-[#24466e] opacity-100 max-[1100px]:text-[11px] min-[1500px]:min-h-10 min-[1500px]:px-[13px] min-[1500px]:py-2 min-[1500px]:text-[11px]"
              key={label}
              type="button"
              disabled
            >
              <Icon className="shrink-0" size={17} aria-hidden="true" />
              <span>{label}</span>
              <small className="ml-auto rounded-full bg-[#e7edf5] px-1.5 py-0.5 text-[8px] font-bold text-[#526984]">
                Em breve
              </small>
            </button>
          ))}
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-3 text-[9px] text-[#60728a] min-[421px]:flex-row max-[1100px]:text-[11px] min-[1500px]:text-[11px]">
        <span>SIPAT · Visão geral</span>
        <span>
          {identidade.nome} · {perfil}
        </span>
      </footer>
    </main>
  );
}
