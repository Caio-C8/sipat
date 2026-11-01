import { Lucide } from "@react-native-vector-icons/lucide";
import type {
  MetaPaginacao,
  PatrimonioDetalhe,
  ProcessoCompraResumo,
  TipoIncorporacao,
} from "@repo/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useRouter, type Href } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { publicAppConfig } from "../../../config/public-app-config";
import { isApiError } from "../../../lib/api/api-error";
import {
  currentSessionIdentity,
  isCurrentSession,
} from "../../../lib/query/session-mutation";
import {
  layout,
  mobilePatrimonios,
  radii,
  spacing,
} from "../../../theme/tokens";
import { useSession } from "../../auth/session/session-context";
import {
  formatCurrency,
  formatIncorporation,
  formatPatrimonioNumber,
} from "../patrimonio-formatters";
import { invalidatePatrimonioCreation } from "../patrimonio-mutation-invalidation";
import {
  createCreatePatrimonioOperations,
  type CreatePatrimonioOperations,
} from "./create-patrimonio-operations";
import { useCreatePatrimonioQueries } from "./use-create-patrimonio-queries";
import {
  EMPTY_CREATE_PATRIMONIO_FORM,
  currencyInputToDecimal,
  effectiveResidual,
  formatCurrencyInput,
  formatDateInput,
  formatIntegerInput,
  formatPercentageInput,
  mapCreatePatrimonioForm,
  monthlyDepreciationPreview,
  validateCreatePatrimonioStep,
  type CreatePatrimonioForm,
  type FormErrors,
} from "./create-patrimonio-form";
import { PatrimonioCreationAttempt } from "./patrimonio-creation-attempt";

type Step = 1 | 2 | 3 | 4;
type Catalog = "species" | "sectors" | "processes";
type Option = Readonly<{ id: string; title: string; subtitle?: string }>;

const CATALOG_LABELS: Readonly<Record<Catalog, string>> = {
  species: "as espécies",
  sectors: "os setores",
  processes: "os processos de compra",
};

const STEP_TITLES = [
  "",
  "Identificação",
  "Classificação e localização",
  "Aquisição e tombamento",
  "Depreciação",
] as const;

const INCORPORATIONS: readonly Readonly<{
  value: TipoIncorporacao;
  label: string;
}>[] = [
  { value: "AQUISICAO", label: "Aquisição" },
  { value: "DOACAO", label: "Doação" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "CESSAO", label: "Cessão" },
  { value: "COMODATO", label: "Comodato" },
  { value: "PERMUTA", label: "Permuta" },
  { value: "PRODUCAO_INTERNA", label: "Produção interna" },
  { value: "OUTROS", label: "Outros" },
];

export function createPatrimonioErrorMessage(error: unknown) {
  if (!isApiError(error)) return "Ocorreu um erro inesperado. Tente novamente.";
  if (error.kind === "timeout")
    return "O cadastro demorou mais que o esperado. Tente novamente.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível confirmar o cadastro. Tente novamente.";
  if (error.status === 401) return "Sua sessão expirou. Entre novamente.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para cadastrar patrimônios.";
  if (error.code === "OPERACAO_JA_PROCESSADA")
    return "O cadastro anterior foi concluído. Nenhum novo patrimônio foi criado.";
  if (error.code === "CHAVE_IDEMPOTENCIA_REUTILIZADA")
    return "Não foi possível reutilizar esta confirmação. Confira os dados e tente novamente.";
  if (error.code === "OPERACAO_EM_PROCESSAMENTO")
    return "O cadastro ainda está em processamento. Tente novamente com os mesmos dados.";
  if (error.code === "NUMERO_SERIE_JA_EXISTENTE")
    return "Já existe um patrimônio com este número de série.";
  if (error.code === "SETOR_INATIVO")
    return "O setor selecionado foi inativado. Escolha outro.";
  if (error.code?.endsWith("_NAO_ENCONTRADO"))
    return "Uma opção selecionada não está mais disponível.";
  return "Não foi possível concluir o cadastro.";
}

export function createPatrimonioCatalogErrorMessage(
  catalog: Catalog,
  error: unknown,
) {
  const label = CATALOG_LABELS[catalog];
  if (!isApiError(error)) return `Não foi possível carregar ${label}.`;
  if (error.kind === "timeout")
    return `O carregamento de ${label} demorou mais que o esperado.`;
  if (error.kind === "network") return `Sem conexão para carregar ${label}.`;
  if (error.kind === "invalid-response")
    return `Não foi possível carregar ${label}. Tente novamente.`;
  if (error.status === 401) return "Sua sessão expirou. Entre novamente.";
  if (error.status === 403)
    return `Seu perfil não tem permissão para consultar ${label}.`;
  return `Não foi possível carregar ${label}.`;
}

function fieldErrorsFromApi(error: unknown) {
  if (!isApiError(error)) return null;
  const mapping: Record<string, Readonly<{ field: string; step: Step }>> = {
    descricao: { field: "description", step: 1 },
    marca: { field: "brand", step: 1 },
    modelo: { field: "model", step: 1 },
    numeroSerie: { field: "serialNumber", step: 1 },
    especieId: { field: "speciesId", step: 2 },
    setorAtualId: { field: "sectorId", step: 2 },
    tipoIncorporacao: { field: "incorporationType", step: 3 },
    processoCompraId: { field: "purchaseProcessId", step: 3 },
    dataTombamento: { field: "registryDate", step: 3 },
    valorIncorporacao: { field: "incorporationValue", step: 3 },
    "parametrosDepreciacao.vidaUtilInicialMeses": {
      field: "usefulLifeMonths",
      step: 4,
    },
    "parametrosDepreciacao.valorResidual": { field: "residual", step: 4 },
    "parametrosDepreciacao.percentualResidual": {
      field: "residual",
      step: 4,
    },
    "parametrosDepreciacao.dataInicio": {
      field: "depreciationStartDate",
      step: 4,
    },
  };
  const errors: Record<string, string> = {};
  let firstStep: Step = 4;
  for (const issue of error.fieldErrors) {
    const target = mapping[issue.campo];
    if (!target) continue;
    errors[target.field] = issue.mensagem;
    if (target.step < firstStep) firstStep = target.step;
  }
  return Object.keys(errors).length ? { errors, step: firstStep } : null;
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  numeric,
  multiline,
}: Readonly<{
  label: string;
  value: string;
  error?: string;
  onChange(value: string): void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        aria-invalid={Boolean(error)}
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={mobilePatrimonios.textSubtle}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.invalid,
        ]}
        value={value}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Derived({
  label,
  value,
  detail,
}: Readonly<{ label: string; value: string; detail?: string }>) {
  return (
    <View style={styles.derived}>
      <Text style={styles.derivedLabel}>{label}</Text>
      <Text style={styles.derivedValue}>{value}</Text>
      {detail ? <Text style={styles.muted}>{detail}</Text> : null}
    </View>
  );
}

function Select({
  label,
  value,
  placeholder,
  error,
  onPress,
}: Readonly<{
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  onPress(): void;
}>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.select, error && styles.invalid]}
      >
        <Text style={[styles.selectText, !value && styles.muted]}>
          {value ?? placeholder}
        </Text>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.textMuted}
          name="chevron-down"
          size={18}
        />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Progress({ step }: Readonly<{ step: Step }>) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressText}>
        <Text style={styles.step}>Etapa {step} de 4</Text>
        <Text style={styles.muted}>{STEP_TITLES[step]}</Text>
      </View>
      <View
        accessibilityLabel={`Etapa ${step} de 4`}
        style={styles.progressRow}
      >
        {([1, 2, 3, 4] as const).map((part) => (
          <View
            key={part}
            style={[styles.progress, part <= step && styles.progressActive]}
          />
        ))}
      </View>
    </View>
  );
}

function processName(process: ProcessoCompraResumo) {
  if (process.numeroProcesso && process.anoProcesso)
    return `Processo ${process.numeroProcesso}/${process.anoProcesso}`;
  if (process.numeroEmpenho && process.anoEmpenho)
    return `Empenho ${process.numeroEmpenho}/${process.anoEmpenho}`;
  return "Processo sem número";
}

function CatalogModal({
  visible,
  title,
  items,
  selected,
  meta,
  loading,
  error,
  onClose,
  onMore,
  onRetry,
  onSelect,
}: Readonly<{
  visible: boolean;
  title: string;
  items: readonly Option[];
  selected?: string;
  meta?: MetaPaginacao;
  loading: boolean;
  error?: string;
  onClose(): void;
  onMore(): void;
  onRetry(): void;
  onSelect(id: string): void;
}>) {
  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Fechar seleção"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.iconButton}
            >
              <Lucide
                accessible={false}
                color={mobilePatrimonios.text}
                name="x"
                size={21}
              />
            </Pressable>
          </View>
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.feedback}>
              {error}
            </Text>
          ) : null}
          <ScrollView contentContainerStyle={styles.options}>
            {items.map((item) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: item.id === selected }}
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={[
                  styles.option,
                  item.id === selected && styles.optionActive,
                ]}
              >
                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.muted}>{item.subtitle}</Text>
                  ) : null}
                </View>
                {item.id === selected ? (
                  <Lucide
                    accessible={false}
                    color={mobilePatrimonios.action}
                    name="check"
                    size={18}
                  />
                ) : null}
              </Pressable>
            ))}
            {error && !loading ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineText}>Tentar novamente</Text>
              </Pressable>
            ) : null}
            {!error && !loading && items.length === 0 ? (
              <Text style={styles.empty}>Nenhuma opção encontrada.</Text>
            ) : null}
            {loading ? (
              <ActivityIndicator
                accessibilityLabel="Carregando opções"
                color={mobilePatrimonios.action}
              />
            ) : null}
            {meta && meta.pagina < meta.ultimaPagina && !loading ? (
              <Pressable
                accessibilityRole="button"
                onPress={onMore}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineText}>Carregar mais</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function RestrictedCreatePatrimonio({
  onConsult,
}: Readonly<{ onConsult(): void }>) {
  return (
    <View style={styles.restricted}>
      <View style={styles.lock}>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.action}
          name="lock-keyhole"
          size={34}
        />
      </View>
      <Text accessibilityRole="header" style={styles.restrictedTitle}>
        Cadastro restrito
      </Text>
      <Text style={styles.restrictedText}>
        Somente o Diretor de Patrimônio pode cadastrar bens. Você ainda pode
        consultar todo o acervo disponível.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onConsult}
        style={styles.primary}
      >
        <Lucide
          accessible={false}
          color="#ffffff"
          name="package-search"
          size={19}
        />
        <Text style={styles.primaryText}>Consultar bens</Text>
      </Pressable>
    </View>
  );
}

function ReviewCard({
  title,
  lines,
  onEdit,
}: Readonly<{ title: string; lines: readonly string[]; onEdit(): void }>) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <Pressable
          accessibilityLabel={`Editar ${title}`}
          accessibilityRole="button"
          onPress={onEdit}
        >
          <Text style={styles.edit}>Editar</Text>
        </Pressable>
      </View>
      {lines.map((line) => (
        <Text key={line} style={styles.reviewLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function Success({
  item,
  onAnother,
}: Readonly<{ item: PatrimonioDetalhe; onAnother(): void }>) {
  return (
    <ScrollView contentContainerStyle={styles.success}>
      <View style={styles.successIcon}>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.success}
          name="check"
          size={38}
        />
      </View>
      <Text
        accessibilityLiveRegion="polite"
        accessibilityRole="header"
        style={styles.successTitle}
      >
        Patrimônio cadastrado!
      </Text>
      <Text style={styles.muted}>O bem foi adicionado ao acervo do setor.</Text>
      <View style={styles.successCard}>
        <Text style={styles.successDescription}>{item.descricao} · Ativo</Text>
        <Text style={styles.derivedLabel}>Número patrimonial</Text>
        <Text style={styles.successNumber}>
          {formatPatrimonioNumber(
            item.numeroPatrimonio,
            item.tipoNumeroPatrimonial,
          )}
        </Text>
        <Text style={styles.reviewLine}>{item.setorAtual.nome}</Text>
        <Text style={styles.reviewLine}>
          Responsável do setor: {item.setorAtual.responsavel.nome}
        </Text>
        <Text style={styles.reviewLine}>
          Valor de incorporação: {formatCurrency(item.valorIncorporacao)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAnother}
        style={styles.primary}
      >
        <Lucide accessible={false} color="#ffffff" name="plus" size={19} />
        <Text style={styles.primaryText}>Cadastrar outro patrimônio</Text>
      </Pressable>
    </ScrollView>
  );
}

function DirectorFlow({
  operations,
}: Readonly<{ operations: CreatePatrimonioOperations }>) {
  const { manager } = useSession();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(EMPTY_CREATE_PATRIMONIO_FORM);
  const [step, setStep] = useState<Step>(1);
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<string>();
  const [created, setCreated] = useState<PatrimonioDetalhe>();
  const creationAttempt = useRef(new PatrimonioCreationAttempt());
  const [catalog, setCatalog] = useState<Catalog>();
  const queries = useCreatePatrimonioQueries(
    manager,
    operations,
    form.purchaseProcessId,
  );
  const creation = useMutation({
    mutationFn: ({
      body,
    }: Readonly<{
      body: ReturnType<typeof mapCreatePatrimonioForm>;
      identityId: string | null;
    }>) =>
      manager.authorizedRequest(
        (token) => operations.create(body, { accessToken: token }),
        false,
      ),
    onSuccess: (_created, variables) =>
      isCurrentSession(manager, variables.identityId)
        ? invalidatePatrimonioCreation(queryClient)
        : undefined,
    retry: false,
  });
  const submitting = creation.isPending;
  const species =
    queries.species.data?.pages.flatMap((page) => page.dados) ?? [];
  const sectors =
    queries.sectors.data?.pages.flatMap((page) => page.dados) ?? [];
  const processes =
    queries.processes.data?.pages.flatMap((page) => page.dados) ?? [];
  const speciesMeta = queries.species.data?.pages.at(-1)?.meta;
  const sectorsMeta = queries.sectors.data?.pages.at(-1)?.meta;
  const processesMeta = queries.processes.data?.pages.at(-1)?.meta;
  const processDetail = queries.processDetail.data;
  const selectedSpecies = species.find((item) => item.id === form.speciesId);
  const selectedSector = sectors.find((item) => item.id === form.sectorId);
  const selectedProcess = processes.find(
    (item) => item.id === form.purchaseProcessId,
  );

  const update = (patch: Partial<CreatePatrimonioForm>) => {
    creationAttempt.current.payloadChanged();
    setForm((current) => ({ ...current, ...patch }));
    setErrors({});
  };

  const next = () => {
    const found = validateCreatePatrimonioStep(form, step);
    if (Object.keys(found).length) return setErrors(found);
    if (step === 4) setReview(true);
    else setStep((step + 1) as Step);
  };

  const submit = async () => {
    const creationKey = creationAttempt.current.start(Crypto.randomUUID);
    if (!creationKey) return;
    setFeedback(undefined);
    creation.reset();
    try {
      const body = mapCreatePatrimonioForm(form, creationKey);
      const identityId = currentSessionIdentity(manager);
      const result = await creation.mutateAsync({ body, identityId });
      if (isCurrentSession(manager, identityId)) setCreated(result);
      creationAttempt.current.complete();
    } catch (error) {
      creationAttempt.current.fail(error);
      if (isApiError(error) && error.code === "OPERACAO_JA_PROCESSADA")
        await invalidatePatrimonioCreation(queryClient);
      const fieldFeedback = fieldErrorsFromApi(error);
      if (fieldFeedback) {
        setErrors(fieldFeedback.errors);
        setStep(fieldFeedback.step);
        setReview(false);
      }
      setFeedback(createPatrimonioErrorMessage(error));
    }
  };

  if (created)
    return (
      <Success
        item={created}
        onAnother={() => {
          creationAttempt.current.complete();
          setCreated(undefined);
          setForm(EMPTY_CREATE_PATRIMONIO_FORM);
          setStep(1);
          setReview(false);
        }}
      />
    );

  const activeCatalogQuery =
    catalog === "species"
      ? queries.species
      : catalog === "sectors"
        ? queries.sectors
        : catalog === "processes"
          ? queries.processes
          : undefined;
  const catalogError =
    catalog && activeCatalogQuery?.error
      ? createPatrimonioCatalogErrorMessage(catalog, activeCatalogQuery.error)
      : catalog === "processes" && queries.processDetail.error
        ? createPatrimonioCatalogErrorMessage(
            "processes",
            queries.processDetail.error,
          )
        : undefined;
  const modal =
    catalog === "species"
      ? {
          title: "Selecionar espécie",
          items: species.map((item) => ({
            id: item.id,
            title: item.nome,
            subtitle: item.natureza.nome,
          })),
          selected: form.speciesId,
          meta: speciesMeta,
        }
      : catalog === "sectors"
        ? {
            title: "Selecionar setor",
            items: sectors.map((item) => ({
              id: item.id,
              title: item.nome,
              subtitle: `${item.responsavel.nome}${item.sala ? ` · ${item.sala}` : ""}`,
            })),
            selected: form.sectorId,
            meta: sectorsMeta,
          }
        : {
            title: "Selecionar processo",
            items: processes.map((item) => ({
              id: item.id,
              title: processName(item),
              subtitle: item.valorTotal
                ? formatCurrency(item.valorTotal)
                : undefined,
            })),
            selected: form.purchaseProcessId,
            meta: processesMeta,
          };

  const selectCatalog = (id: string) => {
    if (catalog === "species") update({ speciesId: id });
    if (catalog === "sectors") update({ sectorId: id });
    if (catalog === "processes") {
      update({ purchaseProcessId: id });
    }
    setCatalog(undefined);
  };

  const stepContent =
    step === 1 ? (
      <>
        <Field
          error={errors.description}
          label="Descrição *"
          multiline
          onChange={(description) => update({ description })}
          placeholder="Ex.: Notebook corporativo"
          value={form.description}
        />
        <View style={styles.columns}>
          <View style={styles.column}>
            <Field
              error={errors.brand}
              label="Marca"
              onChange={(brand) => update({ brand })}
              value={form.brand}
            />
          </View>
          <View style={styles.column}>
            <Field
              error={errors.model}
              label="Modelo"
              onChange={(model) => update({ model })}
              value={form.model}
            />
          </View>
        </View>
        <Field
          error={errors.serialNumber}
          label="Número de série"
          onChange={(serialNumber) => update({ serialNumber })}
          value={form.serialNumber}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.withoutOfficialNumber }}
          onPress={() =>
            update({ withoutOfficialNumber: !form.withoutOfficialNumber })
          }
          style={styles.checkRow}
        >
          <View
            style={[
              styles.checkbox,
              form.withoutOfficialNumber && styles.checked,
            ]}
          >
            {form.withoutOfficialNumber ? (
              <Lucide
                accessible={false}
                color="#ffffff"
                name="check"
                size={14}
              />
            ) : null}
          </View>
          <Text style={styles.checkText}>Bem sem número oficial (S/P)</Text>
        </Pressable>
        <Derived
          label="Número patrimonial"
          value="Gerado automaticamente ao cadastrar"
        />
      </>
    ) : step === 2 ? (
      <>
        <Select
          error={errors.speciesId}
          label="Espécie *"
          onPress={() => setCatalog("species")}
          placeholder="Selecione a espécie"
          value={selectedSpecies?.nome}
        />
        {selectedSpecies ? (
          <Derived
            label="Natureza da espécie"
            value={selectedSpecies.natureza.nome}
          />
        ) : null}
        <Select
          error={errors.sectorId}
          label="Setor *"
          onPress={() => setCatalog("sectors")}
          placeholder="Selecione o setor"
          value={selectedSector?.nome}
        />
        {selectedSector ? (
          <Derived
            detail={selectedSector.sala ?? "Sala não informada"}
            label="Responsável do setor"
            value={selectedSector.responsavel.nome}
          />
        ) : null}
        <Derived label="Situação inicial do bem" value="Ativo" />
      </>
    ) : step === 3 ? (
      <>
        <Text style={styles.label}>Tipo de incorporação *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {INCORPORATIONS.map((item) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: form.incorporationType === item.value,
              }}
              key={item.value}
              onPress={() => update({ incorporationType: item.value })}
              style={[
                styles.chip,
                form.incorporationType === item.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  form.incorporationType === item.value &&
                    styles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Select
          label="Processo de compra (opcional)"
          onPress={() => setCatalog("processes")}
          placeholder="Nenhum processo selecionado"
          value={selectedProcess ? processName(selectedProcess) : undefined}
        />
        {selectedProcess ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              update({ purchaseProcessId: "" });
            }}
            style={styles.removeProcess}
          >
            <Text style={styles.removeProcessText}>Remover processo</Text>
          </Pressable>
        ) : null}
        {processDetail ? (
          <Derived
            detail={
              processDetail.valorTotal
                ? `Total: ${formatCurrency(processDetail.valorTotal)}`
                : "Valor total não informado"
            }
            label="Resumo do processo"
            value={`${processDetail.notas.length} nota(s) fiscal(is)`}
          />
        ) : null}
        <Field
          error={errors.registryDate}
          label="Data de tombamento *"
          numeric
          onChange={(registryDate) =>
            update({ registryDate: formatDateInput(registryDate) })
          }
          placeholder="DD/MM/AAAA"
          value={form.registryDate}
        />
        <Field
          error={errors.incorporationValue}
          label="Valor de incorporação (R$) *"
          numeric
          onChange={(incorporationValue) =>
            update({
              incorporationValue: formatCurrencyInput(
                incorporationValue,
                form.incorporationValue,
              ),
            })
          }
          placeholder="0,00"
          value={form.incorporationValue}
        />
      </>
    ) : (
      <>
        <Derived
          label="Parâmetros obrigatórios"
          value="Depois do cadastro, estes dados só podem ser alterados por uma reavaliação."
        />
        <Derived label="Método" value="Linear · processamento automático" />
        <Field
          error={errors.usefulLifeMonths}
          label="Vida útil inicial (meses) *"
          numeric
          onChange={(usefulLifeMonths) =>
            update({
              usefulLifeMonths: formatIntegerInput(usefulLifeMonths, 4),
            })
          }
          value={form.usefulLifeMonths}
        />
        <Text style={styles.label}>Informar o residual em</Text>
        <View style={styles.segmented}>
          {(["value", "percentage"] as const).map((mode) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: form.residualMode === mode }}
              key={mode}
              onPress={() => update({ residualMode: mode })}
              style={[
                styles.segment,
                form.residualMode === mode && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  form.residualMode === mode && styles.segmentTextActive,
                ]}
              >
                {mode === "value" ? "Valor (R$)" : "Percentual (%)"}
              </Text>
            </Pressable>
          ))}
        </View>
        {form.residualMode === "value" ? (
          <Field
            error={errors.residual}
            label="Valor residual (R$) *"
            numeric
            onChange={(residualValue) =>
              update({
                residualValue: formatCurrencyInput(
                  residualValue,
                  form.residualValue,
                ),
              })
            }
            value={form.residualValue}
          />
        ) : (
          <Field
            error={errors.residual}
            label="Percentual residual (%) *"
            numeric
            onChange={(residualPercentage) =>
              update({
                residualPercentage: formatPercentageInput(residualPercentage),
              })
            }
            value={form.residualPercentage}
          />
        )}
        {effectiveResidual(form) ? (
          <Derived
            label="Valor residual efetivo"
            value={formatCurrency(effectiveResidual(form)!)}
          />
        ) : null}
        <Field
          error={errors.depreciationStartDate}
          label="Início da depreciação *"
          numeric
          onChange={(depreciationStartDate) =>
            update({
              depreciationStartDate: formatDateInput(depreciationStartDate),
            })
          }
          placeholder="DD/MM/AAAA"
          value={form.depreciationStartDate}
        />
        {monthlyDepreciationPreview(form) ? (
          <Text style={styles.preview}>
            Depreciação mensal estimada:{" "}
            {formatCurrency(monthlyDepreciationPreview(form)!)}
          </Text>
        ) : null}
      </>
    );

  const reviewContent =
    review && selectedSpecies && selectedSector ? (
      <>
        <Text style={styles.reviewEyebrow}>REVISÃO · 1 PATRIMÔNIO</Text>
        <ReviewCard
          onEdit={() => {
            setStep(1);
            setReview(false);
          }}
          title="Identificação"
          lines={[
            [form.description, form.brand, form.model]
              .filter(Boolean)
              .join(" · "),
            form.serialNumber
              ? `Série: ${form.serialNumber}`
              : "Série não informada",
            "Número patrimonial gerado ao cadastrar",
          ]}
        />
        <ReviewCard
          onEdit={() => {
            setStep(2);
            setReview(false);
          }}
          title="Classificação e localização"
          lines={[
            `${selectedSpecies.nome} · ${selectedSpecies.natureza.nome}`,
            [
              selectedSector.nome,
              selectedSector.sala,
              selectedSector.responsavel.nome,
            ]
              .filter(Boolean)
              .join(" · "),
          ]}
        />
        <ReviewCard
          onEdit={() => {
            setStep(3);
            setReview(false);
          }}
          title="Aquisição e tombamento"
          lines={[
            [
              formatIncorporation(form.incorporationType),
              selectedProcess ? processName(selectedProcess) : null,
            ]
              .filter(Boolean)
              .join(" · "),
            `Tombamento em ${form.registryDate}`,
            `Valor de incorporação: ${formatCurrency(currencyInputToDecimal(form.incorporationValue)!)}`,
          ]}
        />
        <ReviewCard
          onEdit={() => {
            setStep(4);
            setReview(false);
          }}
          title="Depreciação"
          lines={[
            `Linear · ${form.usefulLifeMonths} meses · Residual: ${formatCurrency(effectiveResidual(form)!)}`,
            `Início em ${form.depreciationStartDate}`,
          ]}
        />
        <Derived
          label="Antes de concluir"
          value="Confira os dados: os parâmetros de depreciação só poderão ser substituídos por uma reavaliação."
        />
      </>
    ) : null;

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          width >= 900 && styles.contentWide,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>CADASTRO</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Cadastrar patrimônio
        </Text>
        <Text style={styles.subtitle}>
          {review
            ? "Confira os dados antes de concluir."
            : "Preencha as informações do bem."}
        </Text>
        {review ? (
          reviewContent
        ) : (
          <>
            <Progress step={step} />
            {stepContent}
          </>
        )}
        {feedback ? (
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {feedback}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.actions}>
        {!review && step > 1 ? (
          <Pressable
            accessibilityLabel="Voltar para a etapa anterior"
            accessibilityRole="button"
            onPress={() => setStep((step - 1) as Step)}
            style={styles.back}
          >
            <Lucide
              accessible={false}
              color={mobilePatrimonios.text}
              name="arrow-left"
              size={21}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: submitting, disabled: submitting }}
          disabled={submitting}
          onPress={review ? () => void submit() : next}
          style={[
            styles.primary,
            styles.actionPrimary,
            submitting && styles.disabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : review ? (
            <Lucide accessible={false} color="#ffffff" name="check" size={19} />
          ) : null}
          <Text style={styles.primaryText}>
            {submitting
              ? "Cadastrando…"
              : review
                ? "Cadastrar patrimônio"
                : step === 4
                  ? "Revisar cadastro"
                  : "Continuar"}
          </Text>
          {!review && !submitting ? (
            <Lucide
              accessible={false}
              color="#ffffff"
              name="arrow-right"
              size={19}
            />
          ) : null}
        </Pressable>
      </View>
      <CatalogModal
        error={catalogError}
        items={modal.items}
        loading={activeCatalogQuery?.isFetching ?? false}
        meta={modal.meta}
        onClose={() => setCatalog(undefined)}
        onMore={() => {
          if (activeCatalogQuery?.hasNextPage)
            void activeCatalogQuery.fetchNextPage();
        }}
        onRetry={() => {
          void activeCatalogQuery?.refetch();
        }}
        onSelect={selectCatalog}
        selected={modal.selected}
        title={modal.title}
        visible={catalog !== undefined}
      />
    </View>
  );
}

export function CreatePatrimonioScreen() {
  const router = useRouter();
  const { state } = useSession();
  const operations = useMemo(
    () => createCreatePatrimonioOperations(publicAppConfig.apiBaseUrl ?? ""),
    [],
  );
  if (state.status !== "authenticated") return null;
  if (state.identity.perfil === "ADMINISTRADOR")
    return (
      <RestrictedCreatePatrimonio
        onConsult={() => router.replace("/bens" as Href)}
      />
    );
  return <DirectorFlow operations={operations} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 720,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    width: "100%",
  },
  contentWide: { paddingHorizontal: spacing.xxxl },
  eyebrow: {
    color: mobilePatrimonios.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: { color: mobilePatrimonios.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: mobilePatrimonios.textMuted, fontSize: 14 },
  progressBlock: { gap: spacing.sm, marginVertical: spacing.sm },
  progressText: { flexDirection: "row", justifyContent: "space-between" },
  step: { color: mobilePatrimonios.action, fontSize: 12, fontWeight: "700" },
  progressRow: { flexDirection: "row", gap: spacing.xs },
  progress: {
    backgroundColor: mobilePatrimonios.border,
    borderRadius: radii.pill,
    flex: 1,
    height: 4,
  },
  progressActive: { backgroundColor: mobilePatrimonios.action },
  field: { gap: spacing.xs },
  label: { color: mobilePatrimonios.text, fontSize: 13 },
  input: {
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: mobilePatrimonios.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  invalid: { borderColor: mobilePatrimonios.danger },
  errorText: { color: mobilePatrimonios.danger, fontSize: 12 },
  columns: { flexDirection: "row", gap: spacing.md },
  column: { flex: 1 },
  select: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  selectText: { color: mobilePatrimonios.text, flex: 1, fontSize: 15 },
  derived: {
    backgroundColor: mobilePatrimonios.neutralSurface,
    borderRadius: radii.md,
    gap: 2,
    padding: spacing.md,
  },
  derivedLabel: { color: mobilePatrimonios.textMuted, fontSize: 11 },
  derivedValue: {
    color: mobilePatrimonios.text,
    fontSize: 14,
    fontWeight: "700",
  },
  muted: { color: mobilePatrimonios.textMuted, fontSize: 12 },
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
  },
  checkbox: {
    alignItems: "center",
    borderColor: mobilePatrimonios.border,
    borderRadius: 5,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checked: {
    backgroundColor: mobilePatrimonios.action,
    borderColor: mobilePatrimonios.action,
  },
  checkText: { color: mobilePatrimonios.text, flex: 1, fontSize: 14 },
  chips: { gap: spacing.sm },
  chip: {
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: mobilePatrimonios.actionSurface,
    borderColor: mobilePatrimonios.action,
  },
  chipText: { color: mobilePatrimonios.textMuted, fontSize: 12 },
  chipTextActive: { color: mobilePatrimonios.action, fontWeight: "700" },
  segmented: { flexDirection: "row", gap: spacing.sm },
  segment: {
    alignItems: "center",
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: mobilePatrimonios.actionSurface,
    borderColor: mobilePatrimonios.action,
  },
  segmentText: { color: mobilePatrimonios.textMuted, fontSize: 13 },
  segmentTextActive: { color: mobilePatrimonios.action, fontWeight: "700" },
  preview: {
    color: mobilePatrimonios.text,
    fontSize: 13,
    marginTop: spacing.xl,
  },
  removeProcess: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
  },
  removeProcessText: {
    color: mobilePatrimonios.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    backgroundColor: mobilePatrimonios.surface,
    borderTopColor: mobilePatrimonios.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  primary: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.action,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  actionPrimary: { flex: 1, maxWidth: 580 },
  primaryText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  back: {
    alignItems: "center",
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 72,
  },
  disabled: { opacity: 0.65 },
  feedback: {
    backgroundColor: mobilePatrimonios.dangerSurface,
    borderRadius: radii.md,
    color: mobilePatrimonios.danger,
    fontSize: 13,
    padding: spacing.md,
  },
  overlay: {
    backgroundColor: mobilePatrimonios.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: mobilePatrimonios.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "82%",
    padding: spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: mobilePatrimonios.text,
    fontSize: 20,
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  options: { gap: spacing.sm, paddingVertical: spacing.md },
  option: {
    alignItems: "center",
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 58,
    padding: spacing.md,
  },
  optionActive: {
    backgroundColor: mobilePatrimonios.actionSurface,
    borderColor: mobilePatrimonios.action,
  },
  optionBody: { flex: 1 },
  optionTitle: {
    color: mobilePatrimonios.text,
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    color: mobilePatrimonios.textMuted,
    padding: spacing.xl,
    textAlign: "center",
  },
  outlineButton: {
    alignItems: "center",
    borderColor: mobilePatrimonios.action,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  outlineText: { color: mobilePatrimonios.action, fontWeight: "700" },
  restricted: {
    alignItems: "center",
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: 560,
    padding: spacing.xxxl,
  },
  lock: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.actionSurface,
    borderRadius: radii.pill,
    height: 76,
    justifyContent: "center",
    marginBottom: spacing.xl,
    width: 76,
  },
  restrictedTitle: {
    color: mobilePatrimonios.text,
    fontSize: 25,
    fontWeight: "800",
  },
  restrictedText: {
    color: mobilePatrimonios.textMuted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  reviewEyebrow: {
    color: mobilePatrimonios.action,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  reviewCard: {
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewTitle: {
    color: mobilePatrimonios.text,
    fontSize: 13,
    fontWeight: "800",
  },
  edit: { color: mobilePatrimonios.action, fontSize: 12, fontWeight: "700" },
  reviewLine: {
    color: mobilePatrimonios.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  success: {
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.md,
    justifyContent: "center",
    maxWidth: 720,
    minHeight: "100%",
    padding: spacing.xl,
    width: "100%",
  },
  successIcon: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.successSurface,
    borderRadius: radii.pill,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  successTitle: {
    color: mobilePatrimonios.text,
    fontSize: 25,
    fontWeight: "800",
  },
  successCard: {
    alignSelf: "stretch",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginVertical: spacing.md,
    padding: spacing.lg,
  },
  successDescription: {
    color: mobilePatrimonios.text,
    fontSize: 14,
    fontWeight: "800",
  },
  successNumber: {
    color: mobilePatrimonios.text,
    fontSize: 24,
    fontWeight: "800",
  },
});
