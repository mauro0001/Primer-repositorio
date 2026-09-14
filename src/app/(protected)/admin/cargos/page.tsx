"use client";

import { FormEvent, useEffect, useState } from "react";
import { CsvImportBox } from "@/components/CsvImportBox";

type Cargo = {
  id: string;
  codigo: string;
  nombreCargo: string;
  personaNombre: string;
  personaEmail: string;
  jefaturaEmail: string | null;
  activo: boolean;
};

const VACIO = { codigo: "", nombreCargo: "", personaNombre: "", personaEmail: "", jefaturaEmail: "" };

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    const res = await fetch("/api/admin/cargos");
    setCargos(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  function editar(c: Cargo) {
    setEditandoId(c.id);
    setForm({
      codigo: c.codigo,
      nombreCargo: c.nombreCargo,
      personaNombre: c.personaNombre,
      personaEmail: c.personaEmail,
      jefaturaEmail: c.jefaturaEmail || "",
    });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(VACIO);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = editandoId
        ? await fetch(`/api/admin/cargos/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, activo: true }),
          })
        : await fetch("/api/admin/cargos", {
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
    } finally {
      setCargando(false);
    }
  }

  async function desactivar(id: string) {
    if (!confirm("¿Desactivar este cargo? Dejara de aparecer para asignar puntos nuevos.")) return;
    await fetch(`/api/admin/cargos/${id}`, { method: "DELETE" });
    cargar();
  }

  async function reactivar(c: Cargo) {
    await fetch(`/api/admin/cargos/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, activo: true }),
    });
    cargar();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Cargos institucionales (24)</h1>
        <CsvImportBox
          endpoint="/api/admin/import/cargos"
          formatoAyuda="CSV con encabezados: codigo,nombreCargo,personaNombre,personaEmail,jefaturaEmail. Si el codigo ya existe, se actualiza."
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
          <label className="label">Nombre del cargo</label>
          <input
            className="input"
            required
            value={form.nombreCargo}
            onChange={(e) => setForm({ ...form, nombreCargo: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Persona actual</label>
          <input
            className="input"
            required
            value={form.personaNombre}
            onChange={(e) => setForm({ ...form, personaNombre: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Correo de la persona</label>
          <input
            type="email"
            className="input"
            required
            value={form.personaEmail}
            onChange={(e) => setForm({ ...form, personaEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Correo de jefatura (escalamiento, opcional)</label>
          <input
            type="email"
            className="input"
            value={form.jefaturaEmail}
            onChange={(e) => setForm({ ...form, jefaturaEmail: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={cargando} className="btn-primary">
            {editandoId ? "Guardar cambios" : "Agregar cargo"}
          </button>
          {editandoId && (
            <button type="button" className="btn-secondary" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Codigo</th>
              <th className="py-2 pr-2">Cargo</th>
              <th className="py-2 pr-2">Persona</th>
              <th className="py-2 pr-2">Correo</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 pr-2 font-mono">{c.codigo}</td>
                <td className="py-2 pr-2">{c.nombreCargo}</td>
                <td className="py-2 pr-2">{c.personaNombre}</td>
                <td className="py-2 pr-2">{c.personaEmail}</td>
                <td className="py-2 pr-2">{c.activo ? "Activo" : "Inactivo"}</td>
                <td className="py-2 flex gap-2">
                  <button className="text-duoc underline" onClick={() => editar(c)}>
                    Editar
                  </button>
                  {c.activo ? (
                    <button className="text-red-600 underline" onClick={() => desactivar(c.id)}>
                      Desactivar
                    </button>
                  ) : (
                    <button className="text-green-600 underline" onClick={() => reactivar(c)}>
                      Reactivar
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
