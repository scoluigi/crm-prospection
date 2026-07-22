"use client";

import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { analyzeImportAction, commitImportAction } from "@/app/actions/import";
import { autoDetectMapping, IMPORT_FIELDS, type ColumnMapping } from "@/lib/import-mapping";
import type { ImportAnalysis, ImportResult, RawRow } from "@/services/import";
import type { TeamMember } from "@/services/users";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "preview" | "done";

const VERDICT_STYLES = {
  nouveau: { label: "Nouveau", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  doublon: { label: "Doublon", className: "border-amber-200 bg-amber-50 text-amber-700", icon: XCircle },
  incomplet: { label: "Incomplet", className: "border-rose-200 bg-rose-50 text-rose-700", icon: AlertCircle },
} as const;

export function ImportWizard({ team, currentUserId }: { team: TeamMember[]; currentUserId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [defaultOwnerId, setDefaultOwnerId] = useState(currentUserId);
  const [updateDuplicates, setUpdateDuplicates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        if (cols.length === 0) {
          toast.error("Impossible de lire les colonnes de ce fichier.");
          return;
        }
        setHeaders(cols);
        setRows(res.data);
        setMapping(autoDetectMapping(cols));
        setStep("mapping");
      },
      error: () => toast.error("Le fichier n'a pas pu être lu. Vérifie qu'il s'agit bien d'un CSV."),
    });
  }, []);

  const mappedCompanyOk = useMemo(() => Object.values(mapping).includes("companyName"), [mapping]);

  async function runAnalysis() {
    setLoading(true);
    const res = await analyzeImportAction(rows, mapping);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAnalysis(res.analysis);
    setStep("preview");
  }

  async function runImport() {
    setLoading(true);
    const res = await commitImportAction(rows, mapping, { defaultOwnerId, updateDuplicates });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.result);
    setStep("done");
    router.refresh();
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setAnalysis(null);
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator step={step} />

      {step === "upload" && (
        <Card>
          <CardContent className="py-8">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Upload className="size-5" />
              </span>
              <p className="text-sm font-medium text-slate-700">Dépose ton fichier CSV ici, ou clique pour le choisir</p>
              <p className="text-xs text-slate-400">Export du Google Sheet : Fichier → Télécharger → Valeurs séparées par une virgule (.csv)</p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <FileSpreadsheet className="size-4 text-indigo-500" />
              {fileName} · {rows.length} lignes détectées
            </CardTitle>
            <p className="text-xs text-slate-500">
              Associe chaque colonne du fichier à un champ du CRM. Le mapping a été deviné automatiquement — vérifie-le.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600" title={header}>
                    {header}
                  </span>
                  <Select
                    value={mapping[header] || "ignore"}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [header]: v === "ignore" ? "" : (v as never) }))
                    }
                  >
                    <SelectTrigger className="w-[190px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignorer cette colonne</SelectItem>
                      {IMPORT_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                          {f.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {!mappedCompanyOk && (
              <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="size-3.5 shrink-0" />
                Associe une colonne au champ « Nom de l&apos;entreprise » pour continuer.
              </p>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={reset}>
                Recommencer
              </Button>
              <Button onClick={runAnalysis} disabled={!mappedCompanyOk || loading}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                Analyser l&apos;aperçu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu avant import</CardTitle>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {analysis.counts.nouveau} nouveaux
              </Badge>
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                {analysis.counts.doublon} doublons
              </Badge>
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                {analysis.counts.incomplet} incomplets (ignorés)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {analysis.unknownOwners.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Associé{analysis.unknownOwners.length > 1 ? "s" : ""} non reconnu
                {analysis.unknownOwners.length > 1 ? "s" : ""} dans le fichier : {analysis.unknownOwners.join(", ")}.
                Ces lignes seront attribuées au responsable par défaut choisi ci-dessous.
              </p>
            )}

            <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2">Entreprise</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Téléphone</th>
                    <th className="px-3 py-2">Responsable</th>
                    <th className="px-3 py-2">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.rows.map((row) => {
                    const v = VERDICT_STYLES[row.verdict];
                    return (
                      <tr key={row.index}>
                        <td className="px-3 py-1.5">
                          <Badge className={v.className}>{v.label}</Badge>
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-700">{row.companyName}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.contactName ?? "—"}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.phone ?? "—"}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.ownerName ?? "—"}</td>
                        <td className="px-3 py-1.5 text-slate-400">{row.reason ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Responsable par défaut (si non identifié)
                </label>
                <Select value={defaultOwnerId} onValueChange={setDefaultOwnerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                <Checkbox checked={updateDuplicates} onCheckedChange={(v) => setUpdateDuplicates(Boolean(v))} />
                Compléter les champs vides des doublons existants
              </label>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep("mapping")}>
                Retour au mapping
              </Button>
              <Button onClick={runImport} disabled={loading || analysis.counts.nouveau === 0 && !updateDuplicates}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                Importer {analysis.counts.nouveau} prospect{analysis.counts.nouveau > 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Import terminé</p>
              <p className="mt-1 text-sm text-slate-500">
                {result.created} prospect{result.created > 1 ? "s" : ""} créé{result.created > 1 ? "s" : ""},{" "}
                {result.updated} complété{result.updated > 1 ? "s" : ""}, {result.skipped} ignoré
                {result.skipped > 1 ? "s" : ""}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>
                Importer un autre fichier
              </Button>
              <Button onClick={() => router.push("/prospects")}>Voir les prospects</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Fichier" },
    { key: "mapping", label: "2. Mapping" },
    { key: "preview", label: "3. Aperçu" },
    { key: "done", label: "4. Résultat" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {steps.map((s, idx) => (
        <span
          key={s.key}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium",
            idx === currentIdx
              ? "bg-indigo-600 text-white"
              : idx < currentIdx
                ? "bg-indigo-50 text-indigo-600"
                : "bg-slate-100 text-slate-400",
          )}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
