import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

// CSV esperado (encabezados exactos):
// escuelaNombre,puntoCodigo,nombreCampo,tipoCampo,opcionesLista,orden,obligatorio
// tipoCampo: TEXTO, SI_NO, LISTA o FECHA. opcionesLista solo si tipoCampo=LISTA, separadas por "|".
// obligatorio: true/false (vacio = true).
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "Falta el contenido CSV" }, { status: 400 });

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Error al leer CSV: ${parsed.errors[0].message}` }, { status: 400 });
  }

  const [escuelas, puntos] = await Promise.all([
    prisma.escuela.findMany(),
    prisma.puntoControl.findMany({ where: { tipoFormulario: "B" } }),
  ]);
  const escuelasPorNombre = new Map(escuelas.map((e) => [e.nombre.trim().toLowerCase(), e.id]));
  const puntosPorCodigo = new Map(puntos.map((p) => [p.codigo, p.id]));

  let creados = 0;
  const errores: string[] = [];

  for (const [i, fila] of parsed.data.entries()) {
    const escuelaId = escuelasPorNombre.get((fila.escuelaNombre || "").trim().toLowerCase());
    const puntoControlId = puntosPorCodigo.get((fila.puntoCodigo || "").trim());
    const tipoCampo = fila.tipoCampo?.trim().toUpperCase();

    if (!escuelaId) {
      errores.push(`Fila ${i + 2}: no se encontro la escuela "${fila.escuelaNombre}"`);
      continue;
    }
    if (!puntoControlId) {
      errores.push(`Fila ${i + 2}: no se encontro un punto Tipo B con codigo "${fila.puntoCodigo}"`);
      continue;
    }
    if (!["TEXTO", "SI_NO", "LISTA", "FECHA"].includes(tipoCampo)) {
      errores.push(`Fila ${i + 2}: tipoCampo invalido "${fila.tipoCampo}"`);
      continue;
    }
    if (!fila.nombreCampo) {
      errores.push(`Fila ${i + 2}: falta nombreCampo`);
      continue;
    }

    try {
      await prisma.campoRequeridoEscuela.upsert({
        where: {
          escuelaId_puntoControlId_nombreCampo: {
            escuelaId,
            puntoControlId,
            nombreCampo: fila.nombreCampo.trim(),
          },
        },
        update: {
          tipoCampo: tipoCampo as any,
          opcionesLista: tipoCampo === "LISTA" ? fila.opcionesLista?.trim() || "" : null,
          orden: Number(fila.orden) || 0,
          obligatorio: fila.obligatorio?.trim().toLowerCase() !== "false",
        },
        create: {
          escuelaId,
          puntoControlId,
          nombreCampo: fila.nombreCampo.trim(),
          tipoCampo: tipoCampo as any,
          opcionesLista: tipoCampo === "LISTA" ? fila.opcionesLista?.trim() || "" : null,
          orden: Number(fila.orden) || 0,
          obligatorio: fila.obligatorio?.trim().toLowerCase() !== "false",
        },
      });
      creados++;
    } catch (e: any) {
      errores.push(`Fila ${i + 2}: ${e.message}`);
    }
  }

  return NextResponse.json({ creados, errores });
}
