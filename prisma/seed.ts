// Datos iniciales. IMPORTANTE: los cargos, puntos de control, directores y campos
// marcados como "(EJEMPLO)" son solo datos de prueba para que puedas probar el
// sistema de inmediato. Reemplazalos por los datos reales de la Matriz de Riesgo
// Operacional desde el panel de administracion (edicion manual o importando CSV,
// ver README seccion "Cargar los datos reales de la sede").
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---------------------------------------------------------------------
  // 1. Las 6 escuelas reales de la sede Maipu
  // ---------------------------------------------------------------------
  const nombresEscuelas = [
    "Comunicación",
    "Ingeniería MA y RR.NN.",
    "Salud y Bienestar",
    "Construcción",
    "Informática y Telecomunicaciones",
    "Administración y Negocios",
  ];
  const escuelas: Record<string, string> = {};
  for (const [i, nombre] of nombresEscuelas.entries()) {
    const escuela = await prisma.escuela.upsert({
      where: { nombre },
      update: {},
      create: { nombre, orden: i },
    });
    escuelas[nombre] = escuela.id;
  }

  // ---------------------------------------------------------------------
  // 2. Configuracion de calendario por defecto (editable en /admin/calendario)
  // ---------------------------------------------------------------------
  const calendarios = [
    { periodicidad: "MENSUAL", mesesVencimiento: "1,2,3,4,5,6,7,8,9,10,11,12" },
    { periodicidad: "TRIMESTRAL", mesesVencimiento: "3,6,9,12" },
    { periodicidad: "SEMESTRAL", mesesVencimiento: "6,12" },
    { periodicidad: "ANUAL", mesesVencimiento: "12" },
    { periodicidad: "EVENTUAL", mesesVencimiento: "", recordatorioActivo: false },
  ] as const;
  for (const c of calendarios) {
    await prisma.configuracionCalendario.upsert({
      where: { periodicidad: c.periodicidad },
      update: {},
      create: {
        periodicidad: c.periodicidad,
        mesesVencimiento: c.mesesVencimiento,
        diaVencimiento: 20,
        diasRecordatorioAntes: 7,
        diasEscalamientoDespues: 7,
        recordatorioActivo: "recordatorioActivo" in c ? c.recordatorioActivo : true,
      },
    });
  }

  await prisma.configuracionGlobal.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      emailEscalamientoDefault: "gestion.operacion@duoc.cl",
      nombreInstitucion: "Duoc UC - Sede Maipú",
    },
  });

  // ---------------------------------------------------------------------
  // 3. Usuario administrador inicial
  // ---------------------------------------------------------------------
  const passwordAdmin = "CambiarClave123!";
  await prisma.usuario.upsert({
    where: { email: "admin@duoc.cl" },
    update: {},
    create: {
      email: "admin@duoc.cl",
      nombre: "Administrador del sistema",
      rol: "ADMIN",
      passwordHash: await bcrypt.hash(passwordAdmin, 10),
    },
  });

  // ---------------------------------------------------------------------
  // 4. Cargos institucionales de EJEMPLO (reemplazar por los 24 reales)
  // ---------------------------------------------------------------------
  const cargosDemo = [
    { codigo: "SSO-01", nombreCargo: "Coordinador SSO (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "coordinador.sso.demo@duoc.cl" },
    { codigo: "SSGG-01", nombreCargo: "Jefe de Servicios Generales (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "jefe.ssgg.demo@duoc.cl" },
    { codigo: "BIB-01", nombreCargo: "Jefe de Biblioteca (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "jefe.biblioteca.demo@duoc.cl" },
    { codigo: "TI-01", nombreCargo: "Jefe de Informática (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "jefe.ti.demo@duoc.cl" },
  ];
  const cargoIds: Record<string, string> = {};
  for (const c of cargosDemo) {
    const cargo = await prisma.cargoInstitucional.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: c,
    });
    cargoIds[c.codigo] = cargo.id;
  }

  // ---------------------------------------------------------------------
  // 5. Directores de Carrera de EJEMPLO (reemplazar por los 13 reales)
  // ---------------------------------------------------------------------
  const directoresDemo = [
    { escuela: "Comunicación", carreraNombre: "Comunicación Audiovisual (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.comunicacion.demo@duoc.cl" },
    { escuela: "Ingeniería MA y RR.NN.", carreraNombre: "Ingeniería en Prevención de Riesgos (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.prevencion.demo@duoc.cl" },
    { escuela: "Salud y Bienestar", carreraNombre: "Técnico en Enfermería (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.salud.demo@duoc.cl" },
    { escuela: "Construcción", carreraNombre: "Construcción Civil (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.construccion.demo@duoc.cl" },
    { escuela: "Informática y Telecomunicaciones", carreraNombre: "Ingeniería en Informática (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.informatica.demo@duoc.cl" },
    { escuela: "Administración y Negocios", carreraNombre: "Administración de Empresas (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.admin.demo@duoc.cl" },
    // Ejemplo de una escuela con mas de un director/a (una carrera adicional en la misma escuela)
    { escuela: "Administración y Negocios", carreraNombre: "Contabilidad (EJEMPLO)", personaNombre: "Por asignar", personaEmail: "director.contabilidad.demo@duoc.cl" },
  ];
  const directorIds: Record<string, string> = {};
  for (const d of directoresDemo) {
    const existente = await prisma.directorEscuela.findFirst({
      where: { personaEmail: d.personaEmail, escuelaId: escuelas[d.escuela] },
    });
    const director =
      existente ??
      (await prisma.directorEscuela.create({
        data: {
          escuelaId: escuelas[d.escuela],
          carreraNombre: d.carreraNombre,
          personaNombre: d.personaNombre,
          personaEmail: d.personaEmail,
        },
      }));
    directorIds[d.personaEmail] = director.id;
  }

  // ---------------------------------------------------------------------
  // 6. Puntos de control de EJEMPLO (reemplazar por los 149 reales via CSV)
  // ---------------------------------------------------------------------
  const puntosDemo = [
    {
      codigo: "PC-A01",
      nombre: "Revisión de extintores y señalética (EJEMPLO)",
      macroproceso: "Seguridad e infraestructura",
      tipoFormulario: "A",
      periodicidad: "MENSUAL",
      evidenciaRequerida: "Foto o checklist firmado de la revisión",
      tipoResponsable: "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: cargoIds["SSGG-01"],
    },
    {
      codigo: "PC-A02",
      nombre: "Capacitación de brigada de emergencia (EJEMPLO)",
      macroproceso: "Prevención de riesgos",
      tipoFormulario: "A",
      periodicidad: "SEMESTRAL",
      evidenciaRequerida: "Lista de asistencia y certificado",
      tipoResponsable: "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: cargoIds["SSO-01"],
    },
    {
      codigo: "PC-A03",
      nombre: "Respaldo de servidores criticos (EJEMPLO)",
      macroproceso: "Continuidad operacional",
      tipoFormulario: "A",
      periodicidad: "MENSUAL",
      evidenciaRequerida: "Log de respaldo exitoso",
      tipoResponsable: "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: cargoIds["TI-01"],
    },
    {
      codigo: "PC-A04",
      nombre: "Reporte anual de accidentabilidad (EJEMPLO)",
      macroproceso: "Prevención de riesgos",
      tipoFormulario: "A",
      periodicidad: "ANUAL",
      evidenciaRequerida: "Informe consolidado",
      tipoResponsable: "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: cargoIds["SSO-01"],
    },
    // Los 3 puntos Tipo B (nucleo del sistema)
    {
      codigo: "PC-B01",
      nombre: "Salida a terreno",
      macroproceso: "Actividades académicas fuera de sede",
      tipoFormulario: "B",
      periodicidad: "EVENTUAL",
      evidenciaRequerida: "Autorización firmada y protocolo de la escuela",
      tipoResponsable: "DIRECTOR_ESCUELA",
    },
    {
      codigo: "PC-B02",
      nombre: "Mantenimiento de equipos",
      macroproceso: "Infraestructura académica",
      tipoFormulario: "B",
      periodicidad: "SEMESTRAL",
      evidenciaRequerida: "Certificado o informe de mantenimiento",
      tipoResponsable: "DIRECTOR_ESCUELA",
    },
    {
      codigo: "PC-B03",
      nombre: "Inducción de seguridad",
      macroproceso: "Prevención de riesgos",
      tipoFormulario: "B",
      periodicidad: "TRIMESTRAL",
      evidenciaRequerida: "Lista de asistencia a la inducción",
      tipoResponsable: "DIRECTOR_ESCUELA",
    },
    {
      codigo: "PC-C01",
      nombre: "Mantención de ascensores (EJEMPLO)",
      macroproceso: "Infraestructura y proveedores",
      tipoFormulario: "C",
      periodicidad: "TRIMESTRAL",
      evidenciaRequerida: "Certificado de mantención del proveedor",
      tipoResponsable: "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: cargoIds["SSGG-01"],
    },
  ] as const;

  const puntoIds: Record<string, string> = {};
  for (const p of puntosDemo) {
    const punto = await prisma.puntoControl.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: { ...p },
    });
    puntoIds[p.codigo] = punto.id;
  }

  // ---------------------------------------------------------------------
  // 7. Campos requeridos por escuela para los puntos Tipo B (demuestra que
  // cada escuela puede pedir cosas distintas, incluyendo 0 campos extra)
  // ---------------------------------------------------------------------
  const camposDemo = [
    // PC-B01 Salida a terreno
    { punto: "PC-B01", escuela: "Construcción", nombreCampo: "N° de participantes", tipoCampo: "TEXTO", orden: 1 },
    { punto: "PC-B01", escuela: "Construcción", nombreCampo: "Equipo de protección verificado", tipoCampo: "SI_NO", orden: 2 },
    { punto: "PC-B01", escuela: "Construcción", nombreCampo: "Nivel de riesgo de la zona", tipoCampo: "LISTA", opcionesLista: "Bajo|Medio|Alto", orden: 3 },
    { punto: "PC-B01", escuela: "Informática y Telecomunicaciones", nombreCampo: "Empresa/lugar visitado", tipoCampo: "TEXTO", orden: 1 },
    { punto: "PC-B01", escuela: "Salud y Bienestar", nombreCampo: "Centro de práctica", tipoCampo: "TEXTO", orden: 1 },
    { punto: "PC-B01", escuela: "Salud y Bienestar", nombreCampo: "Fecha de retorno estimada", tipoCampo: "FECHA", orden: 2 },
    // Comunicación y Administración y Negocios no exigen campos extra para este punto (0 campos) a proposito.

    // PC-B02 Mantenimiento de equipos
    { punto: "PC-B02", escuela: "Informática y Telecomunicaciones", nombreCampo: "Equipos revisados", tipoCampo: "TEXTO", orden: 1 },
    { punto: "PC-B02", escuela: "Informática y Telecomunicaciones", nombreCampo: "Requiere reposición", tipoCampo: "SI_NO", orden: 2 },
    { punto: "PC-B02", escuela: "Construcción", nombreCampo: "Taller / laboratorio", tipoCampo: "TEXTO", orden: 1 },

    // PC-B03 Inducción de seguridad
    { punto: "PC-B03", escuela: "Salud y Bienestar", nombreCampo: "Tipo de riesgo biológico presente", tipoCampo: "LISTA", opcionesLista: "Ninguno|Bajo|Alto", orden: 1 },
  ] as const;

  for (const c of camposDemo) {
    await prisma.campoRequeridoEscuela.upsert({
      where: {
        escuelaId_puntoControlId_nombreCampo: {
          escuelaId: escuelas[c.escuela],
          puntoControlId: puntoIds[c.punto],
          nombreCampo: c.nombreCampo,
        },
      },
      update: {},
      create: {
        escuelaId: escuelas[c.escuela],
        puntoControlId: puntoIds[c.punto],
        nombreCampo: c.nombreCampo,
        tipoCampo: c.tipoCampo,
        opcionesLista: "opcionesLista" in c ? c.opcionesLista : null,
        orden: c.orden,
        obligatorio: true,
      },
    });
  }

  // ---------------------------------------------------------------------
  // 8. Proveedor de ejemplo para el Tipo C
  // ---------------------------------------------------------------------
  await prisma.proveedorContrato.upsert({
    where: { id: "proveedor-demo-1" },
    update: {},
    create: {
      id: "proveedor-demo-1",
      nombreProveedor: "Ascensores Demo Ltda. (EJEMPLO)",
      numeroContrato: "OC-2026-001",
    },
  });

  console.log("\nSeed completado.");
  console.log("----------------------------------------------------");
  console.log("Cuenta administradora de prueba:");
  console.log("  correo:     admin@duoc.cl");
  console.log(`  contrasena: ${passwordAdmin}`);
  console.log("Cambia esta contrasena (o crea tu propia cuenta admin y desactiva esta)");
  console.log("apenas inicies sesion, desde /admin/usuarios.");
  console.log("----------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
