import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

// CSV esperado (encabezados exactos):
// codigo,nombre,macroproceso,tipoFormulario,periodicidad,evidenciaRequerida,cargoCodigo
// tipoFormulario: A, B o C. periodicidad: MENSUAL,TRIMESTRAL,SEMESTRAL,ANUAL,EVENTUAL
// cargoCodigo: solo para tipoFormulario A o C, debe existir en Cargos Institucionales. Vacio para B.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "Falta el contenido CSV" }, { status: 400 });

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Error al leer CSV: ${parsed.errors[0].message}` }, { status: 400 });
  }

  const cargos = await prisma.cargoInstitucional.findMany();
  const cargosPorCodigo = new Map(cargos.map((c) => [c.codigo, c.id]));

  let creados = 0;
  let actualizados = 0;
  const errores: string[] = [];

  for (const [i, fila] of parsed.data.entries()) {
    const codigo = fila.codigo?.trim();
    const tipoFormulario = fila.tipoFormulario?.trim().toUpperCase();
    if (!codigo || !["A", "B", "C"].includes(tipoFormulario)) {
      errores.push(`Fila ${i + 2}: codigo o tipoFormulario invalido`);
      continue;
    }
    const periodicidad = fila.periodicidad?.trim().toUpperCase();
    if (!["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL", "EVENTUAL"].includes(periodicidad)) {
      errores.push(`Fila ${i + 2} (${codigo}): periodicidad invalida "${fila.periodicidad}"`);
      continue;
    }

    let cargoInstitucionalId: string | null = null;
    if (tipoFormulario !== "B") {
      const cargoCodigo = fila.cargoCodigo?.trim();
      cargoInstitucionalId = cargoCodigo ? cargosPorCodigo.get(cargoCodigo) ?? null : null;
      if (cargoCodigo && !cargoInstitucionalId) {
        errores.push(`Fila ${i + 2} (${codigo}): no existe el cargo "${cargoCodigo}" (cargalo primero)`);
        continue;
      }
    }

    try {
      const data = {
        nombre: fila.nombre?.trim() || "",
        macroproceso: fila.macroproceso?.trim() || "",
        tipoFormulario: tipoFormulario as any,
        periodicidad: periodicidad as any,
        evidenciaRequerida: fila.evidenciaRequerida?.trim() || "",
        tipoResponsable: (tipoFormulario === "B" ? "DIRECTOR_ESCUELA" : "CARGO_INSTITUCIONAL") as any,
        cargoInstitucionalId,
      };
      const existente = await prisma.puntoControl.findUnique({ where: { codigo } });
      if (existente) {
        await prisma.puntoControl.update({ where: { codigo }, data });
        actualizados++;
      } else {
        await prisma.puntoControl.create({ data: { codigo, ...data } });
        creados++;
      }
    } catch (e: any) {
      errores.push(`Fila ${i + 2} (${codigo}): ${e.message}`);
    }
  }

  return NextResponse.json({ creados, actualizados, errores });
}
