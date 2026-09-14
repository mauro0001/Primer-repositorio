-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'RESPONSABLE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "escuelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "cargos_institucionales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombreCargo" TEXT NOT NULL,
    "personaNombre" TEXT NOT NULL,
    "personaEmail" TEXT NOT NULL,
    "jefaturaEmail" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "directores_escuela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escuelaId" TEXT NOT NULL,
    "carreraNombre" TEXT NOT NULL,
    "personaNombre" TEXT NOT NULL,
    "personaEmail" TEXT NOT NULL,
    "jefaturaEmail" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "directores_escuela_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "escuelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puntos_control" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "macroproceso" TEXT NOT NULL,
    "tipoFormulario" TEXT NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "evidenciaRequerida" TEXT NOT NULL,
    "tipoResponsable" TEXT NOT NULL,
    "cargoInstitucionalId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "puntos_control_cargoInstitucionalId_fkey" FOREIGN KEY ("cargoInstitucionalId") REFERENCES "cargos_institucionales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campos_requeridos_escuela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escuelaId" TEXT NOT NULL,
    "puntoControlId" TEXT NOT NULL,
    "nombreCampo" TEXT NOT NULL,
    "tipoCampo" TEXT NOT NULL,
    "opcionesLista" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "campos_requeridos_escuela_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "escuelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campos_requeridos_escuela_puntoControlId_fkey" FOREIGN KEY ("puntoControlId") REFERENCES "puntos_control" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proveedores_contratos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreProveedor" TEXT NOT NULL,
    "numeroContrato" TEXT NOT NULL,
    "vigenciaInicio" DATETIME,
    "vigenciaFin" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "registros_cumplimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puntoControlId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cargoInstitucionalId" TEXT,
    "fechaVerificacion" DATETIME NOT NULL,
    "proximaFecha" DATETIME,
    "cumple" TEXT,
    "observacion" TEXT,
    "evidenciaUrl" TEXT,
    "evidenciaNombre" TEXT,
    "escuelaId" TEXT,
    "directorEscuelaId" TEXT,
    "carrera" TEXT,
    "docenteResponsable" TEXT,
    "respuestasDinamicas" TEXT,
    "proveedorContratoId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registros_cumplimiento_puntoControlId_fkey" FOREIGN KEY ("puntoControlId") REFERENCES "puntos_control" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "registros_cumplimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "registros_cumplimiento_cargoInstitucionalId_fkey" FOREIGN KEY ("cargoInstitucionalId") REFERENCES "cargos_institucionales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "registros_cumplimiento_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "escuelas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "registros_cumplimiento_directorEscuelaId_fkey" FOREIGN KEY ("directorEscuelaId") REFERENCES "directores_escuela" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "registros_cumplimiento_proveedorContratoId_fkey" FOREIGN KEY ("proveedorContratoId") REFERENCES "proveedores_contratos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracion_calendario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodicidad" TEXT NOT NULL,
    "mesesVencimiento" TEXT NOT NULL,
    "diaVencimiento" INTEGER NOT NULL DEFAULT 20,
    "diasRecordatorioAntes" INTEGER NOT NULL DEFAULT 7,
    "diasEscalamientoDespues" INTEGER NOT NULL DEFAULT 7,
    "recordatorioActivo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "configuracion_global" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "emailEscalamientoDefault" TEXT NOT NULL DEFAULT 'gestion.operacion@duoc.cl',
    "nombreInstitucion" TEXT NOT NULL DEFAULT 'Duoc UC - Sede Maipu'
);

-- CreateTable
CREATE TABLE "notificaciones_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "puntoControlId" TEXT NOT NULL,
    "claveResponsable" TEXT NOT NULL,
    "periodoClave" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "enviadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "escuelas_nombre_key" ON "escuelas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_institucionales_codigo_key" ON "cargos_institucionales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "puntos_control_codigo_key" ON "puntos_control"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "campos_requeridos_escuela_escuelaId_puntoControlId_nombreCampo_key" ON "campos_requeridos_escuela"("escuelaId", "puntoControlId", "nombreCampo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_calendario_periodicidad_key" ON "configuracion_calendario"("periodicidad");

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_log_tipo_puntoControlId_claveResponsable_periodoClave_key" ON "notificaciones_log"("tipo", "puntoControlId", "claveResponsable", "periodoClave");
