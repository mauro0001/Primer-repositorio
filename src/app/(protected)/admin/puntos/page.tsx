"use client";

import { FormEvent, useEffect, useState } from "react";
import { CsvImportBox } from "@/components/CsvImportBox";

type Cargo = { id: string; codigo: string; nombreCargo: string; activo: boolean };
type Punto = {
  id: string;
  codigo: string;
  nombre: string;
  macroproceso: string;
  tipoFormulario: "A" | "B" | "C";
  periodicidad: string;
  evidenciaRequerida: string;
  cargoInstitucionalId: string | null;
  cargoInstitucional: Cargo | null;
  activo: boolean;
};

const VACIO = {
  codigo: "",
  nombre: "",
  macroproceso: "",
  tipoFormulario: "A" as "A" | "B" | "C",
  periodicidad: "MENSUAL",
  evidenciaRequerida: "",
  cargoInstitucionalId: "",
};

export default function PuntosPage() {
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  async function cargar() {
    const [rp, rc] = await Promise.all([fetch("/api/admin/puntos"), fetch("/api/admin/cargos")]);
    setPuntos(await rp.json());
    setCargos((await rc.json()).filter((c: Cargo) => c.activo));
  }
  useEffect(() => {
    cargar();
  }, []);

  function editar(p: Punto) {
    setEditandoId(p.id);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      macroproceso: p.macroproceso,
      tipoFormulario: p.tipoFormulario,
      periodicidad: p.periodicidad,
      evidenciaRequerida: p.evidenciaRequerida,
      cargoInstitucionalId: p.cargoInstitucionalId || "",
    });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(VACIO);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = editandoId
        ? await fetch(`/api/admin/puntos/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, activo: true }),
          })
        : await fetch("/api/admin/puntos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cancelar();
      cargar();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function desactivar(id: string) {
    if (!confirm("¿Desactivar este punto de control? Dejara de pedirse a los responsables.")) return;
    await fetch(`/api/admin/puntos/${id}`, { method: "DELETE" });
    cargar();
  }

  const puntosFiltrados = puntos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(filtro.toLowerCase()) || p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-slate-800">Puntos de control ({puntos.length})</h1>
        <CsvImportBox
          endpoint="/api/admin/import/puntos"
          formatoAyuda="CSV: codigo,nombre,macroproceso,tipoFormulario(A/B/C),periodicidad(MENSUAL/TRIMESTRAL/SEMESTRAL/ANUAL/EVENTUAL),evidenciaRequerida,cargoCodigo. cargoCodigo solo para A/C y debe existir (importa Cargos primero). Ideal para cargar los 149 puntos reales de una vez."
          onImportado={cargar}
        />
      </div>

      <form onSubmit={guardar} className="card grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Codigo</label>
          <input
            className="input"
            required
            disabled={!!editandoId}
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Macroproceso</label>
          <input
            className="input"
            required
            value={form.macroproceso}
            onChange={(e) => setForm({ ...form, macroproceso: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nombre del punto de control</label>
          <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="label">Tipo de formulario</label>
          <select
            className="input"
            value={form.tipoFormulario}
            onChange={(e) => setForm({ ...form, tipoFormulario: e.target.value as any })}
          >
            <option value="A">A - Checklist periodico</option>
            <option value="B">B - Registro por escuela (Director de Carrera)</option>
            <option value="C">C - Coordinacion con proveedor</option>
          </select>
        </div>
        <div>
          <label className="label">Periodicidad</label>
          <select className="input" value={form.periodicidad} onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}>
            <option value="MENSUAL">Mensual</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="SEMESTRAL">Semestral</option>
            <option value="ANUAL">Anual</option>
            <option value="EVENTUAL">Eventual (sin calendario fijo)</option>
          </select>
        </div>
        {form.tipoFormulario !== "B" && (
          <div>
            <label className="label">Cargo responsable</label>
            <select
              className="input"
              required
              value={form.cargoInstitucionalId}
              onChange={(e) => setForm({ ...form, cargoInstitucionalId: e.target.value })}
            >
              <option value="">Selecciona un cargo...</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nombreCargo}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Evidencia requerida (descripcion)</label>
          <input
            className="input"
            value={form.evidenciaRequerida}
            onChange={(e) => setForm({ ...form, evidenciaRequerida: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            {editandoId ? "Guardar cambios" : "Agregar punto"}
          </button>
          {editandoId && (
            <button type="button" className="btn-secondary" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <input
        className="input max-w-xs"
        placeholder="Buscar por codigo o nombre..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Codigo</th>
              <th className="py-2 pr-2">Nombre</th>
              <th className="py-2 pr-2">Tipo</th>
              <th className="py-2 pr-2">Periodicidad</th>
              <th className="py-2 pr-2">Responsable</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {puntosFiltrados.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-2 font-mono">{p.codigo}</td>
                <td className="py-2 pr-2">{p.nombre}</td>
                <td className="py-2 pr-2">{p.tipoFormulario}</td>
                <td className="py-2 pr-2">{p.periodicidad.toLowerCase()}</td>
                <td className="py-2 pr-2">{p.tipoFormulario === "B" ? "Directores de Carrera" : p.cargoInstitucional?.nombreCargo || "-"}</td>
                <td className="py-2 pr-2">{p.activo ? "Activo" : "Inactivo"}</td>
                <td className="py-2 flex gap-2">
                  <button className="text-duoc underline" onClick={() => editar(p)}>
                    Editar
                  </button>
                  {p.activo && (
                    <button className="text-red-600 underline" onClick={() => desactivar(p.id)}>
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
