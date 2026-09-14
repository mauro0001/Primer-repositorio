"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CampoDinamico = {
  id: string;
  nombreCampo: string;
  tipoCampo: "TEXTO" | "SI_NO" | "LISTA" | "FECHA";
  opcionesLista: string[];
  obligatorio: boolean;
  orden: number;
};

type Cargo = { id: string; nombreCargo: string };
type Direccion = { id: string; escuelaId: string; escuelaNombre: string; carreraNombre: string };
type Proveedor = { id: string; nombreProveedor: string; numeroContrato: string };

export function RegistrarForm({
  punto,
  cargos,
  direcciones,
  proveedores,
  cargoIdPreseleccionado,
  directorIdPreseleccionado,
}: {
  punto: { id: string; tipoFormulario: "A" | "B" | "C"; periodicidad: string };
  cargos: Cargo[];
  direcciones: Direccion[];
  proveedores: Proveedor[];
  cargoIdPreseleccionado?: string;
  directorIdPreseleccionado?: string;
}) {
  const router = useRouter();

  const [fechaVerificacion, setFechaVerificacion] = useState(new Date().toISOString().slice(0, 10));
  const [cumple, setCumple] = useState<"SI" | "NO" | "CON_OBSERVACION">("SI");
  const [observacion, setObservacion] = useState("");
  const [cargoInstitucionalId, setCargoInstitucionalId] = useState(cargoIdPreseleccionado || cargos[0]?.id || "");
  const [directorEscuelaId, setDirectorEscuelaId] = useState(directorIdPreseleccionado || direcciones[0]?.id || "");
  const [carrera, setCarrera] = useState("");
  const [docenteResponsable, setDocenteResponsable] = useState("");
  const [proveedorContratoId, setProveedorContratoId] = useState(proveedores[0]?.id || "");
  const [proximaFechaManual, setProximaFechaManual] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [camposDinamicos, setCamposDinamicos] = useState<CampoDinamico[]>([]);
  const [valoresDinamicos, setValoresDinamicos] = useState<Record<string, string>>({});
  const [cargandoCampos, setCargandoCampos] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const direccionActual = useMemo(
    () => direcciones.find((d) => d.id === directorEscuelaId) || null,
    [directorEscuelaId, direcciones]
  );

  // El corazon del Tipo B: al cambiar de escuela (via el director seleccionado),
  // se consulta la tabla de configuracion y se renderizan los campos que esa
  // escuela exige para este punto de control especifico.
  useEffect(() => {
    if (punto.tipoFormulario !== "B" || !direccionActual) return;
    setCargandoCampos(true);
    setValoresDinamicos({});
    fetch(`/api/campos-escuela?puntoControlId=${punto.id}&escuelaId=${direccionActual.escuelaId}`)
      .then((r) => r.json())
      .then((data: CampoDinamico[]) => setCamposDinamicos(data))
      .finally(() => setCargandoCampos(false));
  }, [punto.id, punto.tipoFormulario, direccionActual]);

  function setValorDinamico(campoId: string, valor: string) {
    setValoresDinamicos((prev) => ({ ...prev, [campoId]: valor }));
  }

  async function subirEvidencia(): Promise<{ url: string; nombre: string } | null> {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir el archivo");
    return data;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const evidencia = await subirEvidencia();

      const body: any = {
        puntoControlId: punto.id,
        fechaVerificacion,
        evidenciaUrl: evidencia?.url,
        evidenciaNombre: evidencia?.nombre,
      };

      if (punto.tipoFormulario === "A" || punto.tipoFormulario === "C") {
        if (!cargoInstitucionalId) throw new Error("No tienes un cargo institucional asignado para este punto.");
        body.cargoInstitucionalId = cargoInstitucionalId;
        body.cumple = cumple;
        body.observacion = observacion;
      }

      if (punto.tipoFormulario === "C") {
        if (!proveedorContratoId) throw new Error("Selecciona el proveedor / contrato.");
        body.proveedorContratoId = proveedorContratoId;
        if (proximaFechaManual) body.proximaFecha = proximaFechaManual;
      }

      if (punto.tipoFormulario === "B") {
        if (!direccionActual) throw new Error("No tienes una escuela asignada para este punto.");
        body.escuelaId = direccionActual.escuelaId;
        body.directorEscuelaId = directorEscuelaId;
        body.carrera = carrera || direccionActual.carreraNombre;
        body.docenteResponsable = docenteResponsable;
        body.respuestasDinamicas = camposDinamicos.map((c) => ({
          campoId: c.id,
          nombreCampo: c.nombreCampo,
          valor: valoresDinamicos[c.id] ?? "",
        }));
      }

      const res = await fetch("/api/registros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el registro");

      setExito(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="card text-center py-8">
        <p className="text-green-700 font-medium">Registro guardado correctamente.</p>
        <p className="text-sm text-slate-500 mt-1">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      {(punto.tipoFormulario === "A" || punto.tipoFormulario === "C") && cargos.length > 1 && (
        <div>
          <label className="label">Cargo / Responsable</label>
          <select className="input" value={cargoInstitucionalId} onChange={(e) => setCargoInstitucionalId(e.target.value)}>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreCargo}
              </option>
            ))}
          </select>
        </div>
      )}

      {punto.tipoFormulario === "B" && direcciones.length > 1 && (
        <div>
          <label className="label">Escuela</label>
          <select className="input" value={directorEscuelaId} onChange={(e) => setDirectorEscuelaId(e.target.value)}>
            {direcciones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.escuelaNombre} ({d.carreraNombre})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Fecha de verificacion</label>
        <input
          type="date"
          required
          className="input"
          value={fechaVerificacion}
          onChange={(e) => setFechaVerificacion(e.target.value)}
        />
      </div>

      {punto.tipoFormulario === "B" && direccionActual && (
        <>
          <div className="text-sm text-slate-500 border-t pt-3">
            Escuela: <b>{direccionActual.escuelaNombre}</b>
          </div>
          <div>
            <label className="label">Carrera</label>
            <input
              className="input"
              value={carrera || direccionActual.carreraNombre}
              onChange={(e) => setCarrera(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Docente responsable</label>
            <input
              className="input"
              required
              value={docenteResponsable}
              onChange={(e) => setDocenteResponsable(e.target.value)}
            />
          </div>

          {cargandoCampos && <p className="text-sm text-slate-400">Cargando campos adicionales de la escuela...</p>}

          {camposDinamicos.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium text-slate-600">
                Campos especificos del protocolo de {direccionActual.escuelaNombre}
              </p>
              {camposDinamicos.map((campo) => (
                <div key={campo.id}>
                  <label className="label">
                    {campo.nombreCampo}
                    {campo.obligatorio ? " *" : ""}
                  </label>
                  <CampoDinamicoInput
                    campo={campo}
                    valor={valoresDinamicos[campo.id] ?? ""}
                    onChange={(v) => setValorDinamico(campo.id, v)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(punto.tipoFormulario === "A" || punto.tipoFormulario === "C") && (
        <div>
          <label className="label">Cumple</label>
          <select className="input" value={cumple} onChange={(e) => setCumple(e.target.value as any)}>
            <option value="SI">Si</option>
            <option value="NO">No</option>
            <option value="CON_OBSERVACION">Con observacion</option>
          </select>
        </div>
      )}

      {punto.tipoFormulario === "C" && (
        <>
          <div>
            <label className="label">Proveedor / Contratista</label>
            {proveedores.length === 0 ? (
              <p className="text-sm text-amber-600">
                No hay proveedores cargados. Pidele al administrador que agregue uno en el panel de administracion.
              </p>
            ) : (
              <select className="input" value={proveedorContratoId} onChange={(e) => setProveedorContratoId(e.target.value)}>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreProveedor} - {p.numeroContrato}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Proxima fecha segun contrato (opcional)</label>
            <input
              type="date"
              className="input"
              value={proximaFechaManual}
              onChange={(e) => setProximaFechaManual(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Si la dejas vacia, se calcula automaticamente segun la periodicidad del punto.
            </p>
          </div>
        </>
      )}

      {(punto.tipoFormulario === "A" || punto.tipoFormulario === "C") && (
        <div>
          <label className="label">Observacion</label>
          <textarea className="input" rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>
      )}

      <div>
        <label className="label">Evidencia (PDF, imagen o Excel)</label>
        <input
          type="file"
          className="input"
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={cargando} className="btn-primary w-full">
        {cargando ? "Guardando..." : "Guardar registro"}
      </button>
    </form>
  );
}

function CampoDinamicoInput({
  campo,
  valor,
  onChange,
}: {
  campo: CampoDinamico;
  valor: string;
  onChange: (v: string) => void;
}) {
  if (campo.tipoCampo === "SI_NO") {
    return (
      <select className="input" required={campo.obligatorio} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona...</option>
        <option value="Si">Si</option>
        <option value="No">No</option>
      </select>
    );
  }
  if (campo.tipoCampo === "LISTA") {
    return (
      <select className="input" required={campo.obligatorio} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona...</option>
        {campo.opcionesLista.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    );
  }
  if (campo.tipoCampo === "FECHA") {
    return (
      <input
        type="date"
        className="input"
        required={campo.obligatorio}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input className="input" required={campo.obligatorio} value={valor} onChange={(e) => onChange(e.target.value)} />
  );
}
