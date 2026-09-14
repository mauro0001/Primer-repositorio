"use client";

import { FormEvent, useEffect, useState } from "react";

type Proveedor = {
  id: string;
  nombreProveedor: string;
  numeroContrato: string;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  activo: boolean;
};

const VACIO = { nombreProveedor: "", numeroContrato: "", vigenciaInicio: "", vigenciaFin: "" };

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/proveedores");
    setProveedores(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(VACIO);
    cargar();
  }

  async function desactivar(id: string) {
    if (!confirm("¿Desactivar este proveedor/contrato?")) return;
    await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Proveedores y contratos (Tipo C)</h1>
        <p className="text-sm text-slate-500">
          Lista de proveedores/contratistas que aparecen para elegir en los puntos de control Tipo C.
        </p>
      </div>

      <form onSubmit={guardar} className="card grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre del proveedor</label>
          <input
            className="input"
            required
            value={form.nombreProveedor}
            onChange={(e) => setForm({ ...form, nombreProveedor: e.target.value })}
          />
        </div>
        <div>
          <label className="label">N° de contrato u orden de trabajo</label>
          <input
            className="input"
            required
            value={form.numeroContrato}
            onChange={(e) => setForm({ ...form, numeroContrato: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Vigencia inicio (opcional)</label>
          <input
            type="date"
            className="input"
            value={form.vigenciaInicio}
            onChange={(e) => setForm({ ...form, vigenciaInicio: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Vigencia fin (opcional)</label>
          <input
            type="date"
            className="input"
            value={form.vigenciaFin}
            onChange={(e) => setForm({ ...form, vigenciaFin: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">
            Agregar proveedor
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Proveedor</th>
              <th className="py-2 pr-2">N° Contrato</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{p.nombreProveedor}</td>
                <td className="py-2 pr-2">{p.numeroContrato}</td>
                <td className="py-2 pr-2">{p.activo ? "Activo" : "Inactivo"}</td>
                <td className="py-2">
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
