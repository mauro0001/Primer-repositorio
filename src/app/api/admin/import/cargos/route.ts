import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

// CSV esperado (encabezados exactos): codigo,nombreCargo,personaNombre,personaEmail,jefaturaEmail
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "Falta el contenido CSV" }, { status: 400 });

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Error al leer CSV: ${parsed.errors[0].message}` }, { status: 400 });
  }

  let creados = 0;
  let actualizados = 0;
  const errores: string[] = [];

  for (const [i, fila] of parsed.data.entries()) {
    const codigo = fila.codigo?.trim();
    if (!codigo) {
      errores.push(`Fila ${i + 2}: falta codigo`);
      continue;
    }
    try {
      const data = {
        nombreCargo: fila.nombreCargo?.trim() || "",
        personaNombre: fila.personaNombre?.trim() || "",
        personaEmail: (fila.personaEmail || "").trim().toLowerCase(),
        jefaturaEmail: fila.jefaturaEmail?.trim() || null,
      };
      const existente = await prisma.cargoInstitucional.findUnique({ where: { codigo } });
      if (existente) {
        await prisma.cargoInstitucional.update({ where: { codigo }, data });
        actualizados++;
      } else {
        await prisma.cargoInstitucional.create({ data: { codigo, ...data } });
        creados++;
      }
    } catch (e: any) {
      errores.push(`Fila ${i + 2} (${codigo}): ${e.message}`);
    }
  }

  return NextResponse.json({ creados, actualizados, errores });
}
