# Cumplimiento SSO — Sede Maipú (Duoc UC)

Aplicación web para digitalizar el cumplimiento de la Matriz de Riesgo Operacional de
la sede: 149 puntos de control, repartidos entre 24 cargos institucionales y 13
Directores de Carrera (en las 6 escuelas de la sede), con formularios de reporte,
adjunto de evidencia, recordatorios automáticos por correo, escalamiento a jefatura
si no hay respuesta, y un panel de administración para gestionar todo sin tocar código.

Esta guía asume que **no tienes experiencia previa como programador/a** y que partes
desde cero. Sigue los pasos en orden. Cada vez que retomes el proyecto en una sesión
nueva, ve directo a la sección [Volver a trabajar en el proyecto](#volver-a-trabajar-en-el-proyecto-cada-vez-que-abras-una-sesión-nueva).

---

## Índice

1. [Qué construye este proyecto](#qué-construye-este-proyecto)
2. [Antes de empezar: instalar lo necesario](#1-antes-de-empezar-instalar-lo-necesario)
3. [Descargar el proyecto](#2-descargar-el-proyecto)
4. [Instalar las dependencias](#3-instalar-las-dependencias)
5. [Configurar el archivo `.env`](#4-configurar-el-archivo-env)
6. [Crear la base de datos y los datos de ejemplo](#5-crear-la-base-de-datos-y-los-datos-de-ejemplo)
7. [Ejecutar la aplicación en tu computador](#6-ejecutar-la-aplicación-en-tu-computador)
8. [Primer inicio de sesión y cambio de contraseña](#7-primer-inicio-de-sesión-y-cambio-de-contraseña)
9. [Cargar los datos reales de la sede](#8-cargar-los-datos-reales-de-la-sede)
10. [Cómo funciona el Tipo B (campos dinámicos por escuela)](#9-cómo-funciona-el-tipo-b-campos-dinámicos-por-escuela)
11. [Configurar el envío de correos](#10-configurar-el-envío-de-correos)
12. [Recordatorios y escalamiento automáticos](#11-recordatorios-y-escalamiento-automáticos)
13. [Desplegar la aplicación en internet](#12-desplegar-la-aplicación-en-internet)
14. [Mantenimiento habitual](#13-mantenimiento-habitual)
15. [Estructura del proyecto](#14-estructura-del-proyecto)
16. [Solución de problemas comunes](#15-solución-de-problemas-comunes)
17. [Seguridad y limitaciones conocidas](#16-seguridad-y-limitaciones-conocidas)

---

## Qué construye este proyecto

- **Login** con correo institucional `@duoc.cl` y contraseña (ver [sección 10](#10-configurar-el-envío-de-correos) para notificaciones).
- **Vista del responsable**: cada persona ve solo los puntos que le corresponden, con
  un semáforo de estado (al día / próximo a vencer / vencido / escalado), y un
  formulario corto para reportar, con adjunto de evidencia.
- **Tipo B (Directores de Carrera)**: al elegir la escuela, el formulario muestra
  automáticamente los campos adicionales que esa escuela exige, sin necesidad de una
  pantalla distinta por escuela.
- **Panel de administración**: editar cargos, directores, campos por escuela, puntos
  de control, calendario de vencimientos y usuarios — todo desde el navegador, sin
  tocar código. Incluye importación masiva por CSV (útil para cargar los 149 puntos
  reales de una sola vez).
- **Notificaciones automáticas** por correo: recordatorio antes del vencimiento y
  escalamiento a la jefatura si no hay respuesta.

---

## 1. Antes de empezar: instalar lo necesario

Necesitas dos programas instalados en tu computador (Windows, Mac o Linux):

### 1.1 Node.js

Es el programa que ejecuta la aplicación.

1. Ve a [https://nodejs.org](https://nodejs.org) y descarga la versión **LTS** (la
   recomendada, no la "Current").
2. Instálalo con las opciones por defecto (siguiente, siguiente, instalar).
3. Para comprobar que quedó instalado, abre una terminal:
   - **Windows**: busca "Símbolo del sistema" o "PowerShell" en el menú de inicio.
   - **Mac**: busca "Terminal" con Spotlight (Cmd + Espacio).
4. Escribe este comando y presiona Enter:
   ```
   node -v
   ```
   Debe mostrar algo como `v20.x.x` o superior (`v18` en adelante sirve).

### 1.2 Un editor de código (opcional pero recomendado)

Instala [Visual Studio Code](https://code.visualstudio.com/) (gratis). Te sirve para
abrir la carpeta del proyecto y editar el archivo `.env` más fácilmente.

### 1.3 Git (opcional)

Si vas a descargar el proyecto desde GitHub, instala [Git](https://git-scm.com/downloads).
Si ya tienes la carpeta del proyecto descargada de otra forma (por ejemplo un .zip),
puedes saltarte este paso.

---

## 2. Descargar el proyecto

Si el proyecto está en un repositorio de GitHub, abre una terminal y ejecuta (cambia
la URL por la de tu repositorio):

```
git clone https://github.com/tu-organizacion/tu-repositorio.git
cd tu-repositorio
```

Si te entregaron la carpeta como un `.zip`, descomprímela y abre una terminal
**dentro de esa carpeta**. En Windows: entra a la carpeta en el Explorador de
archivos, haz clic derecho dentro de ella y elige "Abrir en Terminal". En Mac: abre
Terminal y escribe `cd ` (con un espacio) y luego arrastra la carpeta a la ventana de
Terminal, y presiona Enter.

Para comprobar que estás en el lugar correcto, ejecuta:

```
ls
```

(en Windows también funciona `dir`). Deberías ver archivos como `package.json`,
`README.md`, una carpeta `src`, una carpeta `prisma`, etc.

---

## 3. Instalar las dependencias

Todavía en la terminal, dentro de la carpeta del proyecto, ejecuta:

```
npm install
```

Esto descarga todas las piezas de software que la aplicación necesita para funcionar.
Puede tardar uno o dos minutos. Al final deberías ver una línea como
`added 136 packages`. Es normal que aparezcan algunas advertencias ("npm warn"); no
son un error.

---

## 4. Configurar el archivo `.env`

La aplicación necesita un archivo llamado `.env` con la configuración (claves de
seguridad, correo, etc.). Por seguridad, este archivo **nunca se sube al
repositorio** (está en `.gitignore`), así que cada persona que instale el proyecto
debe crear el suyo.

1. En la carpeta del proyecto hay un archivo llamado `.env.example`. Haz una copia de
   ese archivo y llámala `.env` (sin ".example").
   - En la terminal: `cp .env.example .env` (Mac/Linux) o `copy .env.example .env`
     (Windows).
2. Abre el archivo `.env` con VS Code (o el Bloc de notas) y completa los valores:

| Variable | Qué es | Qué poner |
|---|---|---|
| `DATABASE_URL` | Dónde vive la base de datos | Déjalo como está: `file:./dev.db` |
| `NEXTAUTH_URL` | La dirección donde corre la app | En tu computador: `http://localhost:3000`. En producción, la URL real (ver sección 12) |
| `NEXTAUTH_SECRET` | Clave secreta para proteger las sesiones de login | Genera una única y pégala aquí (ver abajo) |
| `DOMINIO_PERMITIDO` | Solo se permite iniciar sesión con este dominio de correo | `duoc.cl` |
| `CRON_SECRET` | Clave secreta para proteger el envío automático de notificaciones | Genera una única y pégala aquí (ver abajo) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Datos para enviar correos | Ver [sección 10](#10-configurar-el-envío-de-correos). Puedes dejarlo vacío por ahora: la app funciona igual, solo no enviará correos |
| `MAX_UPLOAD_MB` | Tamaño máximo de archivo adjunto | `10` (puedes subirlo si necesitas) |

**Para generar `NEXTAUTH_SECRET` y `CRON_SECRET`** (dos claves distintas y
aleatorias), ejecuta en la terminal, una vez por cada una:

```
openssl rand -base64 32
```

Si tu Windows no tiene `openssl`, puedes generar una clave aleatoria larga en
<https://generate-secret.vercel.app/32> y pegarla igual — solo debe ser un texto
largo y difícil de adivinar, distinto para cada variable.

Guarda el archivo `.env`.

---

## 5. Crear la base de datos y los datos de ejemplo

Estos comandos crean el archivo de base de datos (SQLite, un archivo local, sin
instalar nada adicional) con todas las tablas que la aplicación necesita, y cargan
datos de ejemplo para que puedas probar el sistema de inmediato.

```
npx prisma migrate dev --name init
```

La primera vez te preguntará el nombre de la migración; si no te lo pregunta (porque
ya lo pasamos con `--name init`) no hay problema. Al final deberías ver un mensaje
"Seed completado" con una cuenta de administrador de prueba:

```
correo:     admin@duoc.cl
contrasena: CambiarClave123!
```

**Guarda estos datos**, los vas a usar en el paso 7. Si en algún momento quieres
volver a ejecutar solo la carga de datos de ejemplo (sin recrear la base de datos),
usa:

```
npm run seed
```

---

## 6. Ejecutar la aplicación en tu computador

```
npm run dev
```

Espera a que aparezca `✓ Ready`. Luego abre tu navegador (Chrome, Edge, etc.) y ve a:

```
http://localhost:3000
```

Deberías ver la pantalla de inicio de sesión. Para detener la aplicación, vuelve a la
terminal y presiona `Ctrl + C`.

---

## 7. Primer inicio de sesión y cambio de contraseña

1. Inicia sesión con `admin@duoc.cl` / `CambiarClave123!` (del paso 5).
2. Ve al menú **Usuarios** (arriba).
3. Te recomendamos crear tu propia cuenta de administrador con tu correo real
   `@duoc.cl`, asignarle el rol **Administrador**, y luego usar "Resetear clave" en
   la cuenta `admin@duoc.cl` para ponerle una contraseña nueva que solo tú conozcas
   (o desactivarla una vez que tengas tu propia cuenta).

Desde aquí también crearás una cuenta para cada persona que deba iniciar sesión
(cada cargo institucional y cada Director de Carrera). El correo de la cuenta debe
**coincidir exactamente** con el correo que aparece en "Cargos" o "Directores" para
que el sistema le muestre sus puntos asignados.

---

## 8. Cargar los datos reales de la sede

Los datos que vienen cargados por defecto (cargos, puntos de control, directores)
están marcados con **"(EJEMPLO)"** — son solo para que pruebes el sistema. Tienes dos
formas de reemplazarlos por los datos reales:

### Opción A: uno por uno, desde el panel

En **Cargos**, **Directores** y **Campos por escuela** hay un formulario para agregar
cada fila manualmente. Útil para ajustes puntuales o si prefieres ir con calma.

### Opción B: importación masiva por CSV (recomendado para los 149 puntos)

Cada pantalla del panel tiene un botón **"Importar desde CSV"**. Un CSV es una
planilla simple (se puede crear y editar en Excel: al guardar, elige "Guardar como" →
formato **CSV**). El formato exacto de columnas para cada tabla:

**Cargos institucionales** (`/admin/cargos`):
```
codigo,nombreCargo,personaNombre,personaEmail,jefaturaEmail
SSO-01,Coordinador SSO,Juan Pérez,juan.perez@duoc.cl,jefatura.sso@duoc.cl
```

**Directores de Escuela** (`/admin/directores`) — `escuelaNombre` debe coincidir
exactamente con el nombre de una de las 6 escuelas ya creadas:
```
escuelaNombre,carreraNombre,personaNombre,personaEmail,jefaturaEmail
Construcción,Construcción Civil,María Soto,maria.soto@duoc.cl,
```

**Puntos de control** (`/admin/puntos`) — el orden recomendado es: primero importa
los Cargos, luego los Puntos (porque el CSV de puntos referencia el `codigo` del
cargo). `cargoCodigo` va vacío para los puntos Tipo B:
```
codigo,nombre,macroproceso,tipoFormulario,periodicidad,evidenciaRequerida,cargoCodigo
PC-001,Revisión de extintores,Seguridad,A,MENSUAL,Foto del checklist,SSO-01
PC-002,Salida a terreno,Académico,B,EVENTUAL,Autorización firmada,
```
`tipoFormulario` es `A`, `B` o `C`. `periodicidad` es `MENSUAL`, `TRIMESTRAL`,
`SEMESTRAL`, `ANUAL` o `EVENTUAL`.

**Campos requeridos por escuela** (`/admin/campos-escuela`) — solo para puntos Tipo
B, define qué le pide cada escuela a ese punto. `puntoCodigo` debe existir (impórtalo
primero como Tipo B):
```
escuelaNombre,puntoCodigo,nombreCampo,tipoCampo,opcionesLista,orden,obligatorio
Construcción,PC-002,N° de participantes,TEXTO,,1,true
Construcción,PC-002,Nivel de riesgo,LISTA,Bajo|Medio|Alto,2,true
Comunicación,PC-002,,,,,
```
`tipoCampo` es `TEXTO`, `SI_NO`, `LISTA` o `FECHA`. `opcionesLista` solo aplica a
`LISTA`, separadas por `|`. Si una escuela no exige ningún campo extra para ese
punto, simplemente no agregues fila para ella.

Cada pantalla de importación te dirá cuántas filas se crearon/actualizaron y
cualquier error línea por línea (por ejemplo, si escribiste mal el nombre de una
escuela).

---

## 9. Cómo funciona el Tipo B (campos dinámicos por escuela)

Este es el corazón del sistema para los Directores de Carrera. Cuando un director
abre un punto Tipo B (por ejemplo "Salida a terreno"):

1. El formulario ya sabe qué escuela(s) dirige esa persona (por su correo).
2. Muestra primero el núcleo fijo: escuela, carrera, docente responsable, fecha.
3. Automáticamente consulta la tabla **Campos requeridos por escuela** para esa
   escuela y ese punto, y agrega debajo un campo de entrada por cada uno (texto,
   sí/no, lista desplegable o fecha, según se haya configurado).
4. Al guardar, todo se guarda junto en un solo registro.

Esto significa que **no hay que programar nada** para agregar, quitar o cambiar los
campos que pide cada escuela — todo se administra desde `/admin/campos-escuela`.

---

## 10. Configurar el envío de correos

La app usa SMTP (el protocolo estándar de envío de correo) a través de la librería
`nodemailer`. Si dejas `SMTP_HOST` vacío en el `.env`, la aplicación funciona
igual, solo que no enviará correos (queda un aviso en la consola). Opciones, de más
simple a más avanzada:

### Opción A: Microsoft 365 / Outlook (recomendado, ya que Duoc usa Microsoft 365)

```
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="tu-correo@duoc.cl"
SMTP_PASSWORD="tu-contrasena-de-outlook"
SMTP_FROM="Cumplimiento SSO Duoc UC <tu-correo@duoc.cl>"
```
Si la cuenta tiene autenticación de dos factores, es posible que debas crear una
"contraseña de aplicación" en la configuración de seguridad de la cuenta Microsoft, o
pedirle a TI que habilite SMTP AUTH para esa cuenta específica.

### Opción B: Gmail con contraseña de aplicación

1. Activa la verificación en dos pasos en la cuenta de Gmail.
2. Genera una "contraseña de aplicación" en https://myaccount.google.com/apppasswords
3. Usa:
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-correo@gmail.com"
SMTP_PASSWORD="la-contrasena-de-aplicacion-de-16-caracteres"
```

### Opción C: un servicio de correo transaccional (Resend, Brevo, etc.)

Más simple de configurar y con mejor entregabilidad si vas a enviar muchos correos.
Crea una cuenta gratuita, y usa las credenciales SMTP que te entreguen (mismo
formato de variables).

---

## 11. Recordatorios y escalamiento automáticos

Las reglas (día del mes, días de aviso previo, días para escalar) están en
`/admin/calendario` y son 100% editables desde ahí — nada está fijo en el código.

Por defecto: vencimiento el día 20 del mes correspondiente, recordatorio 7 días antes
(día 13), escalamiento a jefatura 7 días después si no hay respuesta (día 27).

### Probarlo manualmente

Con el servidor corriendo (`npm run dev`), en otra terminal ejecuta:

```
npm run check-vencimientos
```

Esto revisa todos los puntos y envía los correos que correspondan (evita duplicados:
puedes ejecutarlo varias veces al día sin que reenvíe lo mismo).

### Automatizarlo

Necesitas que algo ejecute esa revisión todos los días. Hay dos formas:

**Si despliegas en un hosting con "Cron Jobs" (recomendamos Railway, ver sección
12):** programa una tarea diaria que ejecute `npm run check-vencimientos`, o que
llame a la URL:
```
https://tu-dominio.com/api/cron/notificaciones
```
con el header `x-cron-secret: EL_VALOR_DE_CRON_SECRET` (el mismo que pusiste en
`.env`).

**Si tu hosting no soporta tareas programadas (cron):** puedes usar un servicio
externo gratuito como [cron-job.org](https://cron-job.org) que llame a esa misma URL
todos los días a la hora que definas.

---

## 12. Desplegar la aplicación en internet

Para que el equipo la use desde sus celulares, necesitas subirla a un "hosting"
(un servidor en internet). Recomendamos **Railway** por ser el más simple: en un solo
servicio puedes tener la aplicación, la base de datos y los archivos de evidencia
guardados de forma persistente (no se borran entre reinicios), y admite tareas
programadas (cron) sin configuración adicional.

### Opción recomendada: Railway

1. Crea una cuenta en [railway.app](https://railway.app) (puedes entrar con GitHub).
2. Sube el proyecto a un repositorio de GitHub si aún no lo está.
3. En Railway: **New Project → Deploy from GitHub repo** y elige tu repositorio.
4. En la pestaña **Variables** del servicio, agrega las mismas variables que tienes
   en tu `.env` local (con `NEXTAUTH_URL` apuntando al dominio que te dé Railway, por
   ejemplo `https://tu-proyecto.up.railway.app`).
5. En **Settings → Volumes**, agrega un volumen persistente montado en `/app/prisma`
   (para que la base de datos SQLite no se pierda) y otro en `/app/public/uploads`
   (para que los archivos de evidencia no se pierdan).
6. Railway detecta automáticamente que es un proyecto Next.js y ejecuta
   `npm run build` y `npm start` (ya configurados en `package.json`, incluyendo la
   migración de base de datos).
7. Para las notificaciones automáticas, en Railway puedes agregar un **Cron Job**
   (Settings → Cron Schedule) con el comando `npm run check-vencimientos`, programado
   por ejemplo todos los días a las 9:00 (`0 9 * * *`).

### Alternativa: Vercel (si prefieres algo aún más conocido)

Vercel es excelente para Next.js pero **no guarda archivos en disco de forma
persistente** ni SQLite entre despliegues. Si usas Vercel necesitas:
- Cambiar la base de datos a **PostgreSQL** (por ejemplo, una base gratuita en
  [neon.tech](https://neon.tech)): en `prisma/schema.prisma` cambia
  `provider = "sqlite"` por `provider = "postgresql"`, actualiza `DATABASE_URL` en
  las variables de entorno de Vercel, y ejecuta `npx prisma migrate deploy`.
- Guardar los archivos de evidencia en **Vercel Blob** en vez de `public/uploads`
  (requiere un cambio pequeño en `src/app/api/upload/route.ts`).
- Configurar un **Vercel Cron** (archivo `vercel.json`) que llame a
  `/api/cron/notificaciones` una vez al día.

Si no tienes experiencia técnica, **Railway es la opción más simple** porque no
requiere ninguno de estos cambios adicionales.

---

## 13. Mantenimiento habitual

- **Personas que cambian de cargo**: ve a `/admin/cargos` o `/admin/directores`,
  edita la fila y cambia el correo/nombre. No es necesario tocar código ni crear una
  cuenta nueva si la persona ya tenía una cuenta con otro correo — en ese caso,
  además crea o actualiza la cuenta en `/admin/usuarios` con el correo correcto.
- **Cambiar reglas de vencimiento**: `/admin/calendario`.
- **Resetear una contraseña**: `/admin/usuarios` → "Resetear clave".
- **Respaldar los datos** (si usas SQLite): copia el archivo `prisma/dev.db` (local)
  o el contenido del volumen persistente (Railway) periódicamente a un lugar seguro.
- **Actualizar dependencias**: de vez en cuando ejecuta `npm outdated` para ver qué
  hay nuevo, y `npm audit` para ver alertas de seguridad. Antes de actualizar,
  prueba los cambios en tu computador (no directo en producción).

## Volver a trabajar en el proyecto (cada vez que abras una sesión nueva)

1. Abre una terminal en la carpeta del proyecto.
2. `npm install` (solo hace falta si cambiaron las dependencias).
3. `npm run dev`
4. Abre `http://localhost:3000`.

Si trabajas en equipo con control de versiones (Git), recuerda hacer
`git pull` antes de empezar y `git add` / `git commit` / `git push` al terminar tus
cambios.

---

## 14. Estructura del proyecto

```
prisma/
  schema.prisma        Modelo de datos completo (todas las tablas)
  seed.ts               Datos iniciales (ejemplo) y cuenta admin de prueba
src/
  lib/
    auth.ts              Configuración de login (NextAuth)
    permisos.ts           Qué puntos le corresponden a cada usuario
    calendario.ts          Cálculo de vencimientos y semáforo
    estado.ts              Combina permisos + calendario + base de datos
    notificaciones.ts       Lógica de recordatorios y escalamiento
    mailer.ts               Envío de correos (nodemailer)
  app/
    login/                 Pantalla de inicio de sesión
    (protected)/
      dashboard/            Vista del responsable (sus puntos, semáforo)
      registros/             Historial de envíos del usuario
      puntos/[id]/registrar/  Formulario (se adapta a Tipo A, B o C)
      admin/                 Panel de administración completo
    api/                    Todas las rutas del backend (API routes de Next.js)
scripts/
  check-vencimientos.ts   Ejecuta manualmente la revisión de notificaciones
```

---

## 15. Solución de problemas comunes

**"npm: command not found"** → Node.js no quedó instalado correctamente. Repite el
paso 1.1 y reinicia la terminal.

**La página muestra un error al iniciar sesión "Solo se permiten correos @duoc.cl"**
→ Es intencional: solo se puede entrar con correos de ese dominio (configurable en
`DOMINIO_PERMITIDO` en `.env`).

**"No tienes puntos de control asignados todavía"** → El correo de la cuenta con la
que iniciaste sesión no coincide con ningún `personaEmail` en Cargos o Directores.
Revisa que estén escritos exactamente igual (sin espacios, mismas mayúsculas/minúsculas
no importan pero sí la ortografía).

**Subí un archivo de evidencia y no aparece después** → Revisa `MAX_UPLOAD_MB` en
`.env` y el tipo de archivo (se permiten PDF, imágenes, Excel y Word).

**No están llegando los correos** → Revisa la sección 10. Si dejaste `SMTP_HOST`
vacío, es normal que no se envíen (queda registrado en la consola del servidor).

**Quiero borrar todo y empezar de nuevo con la base de datos** → Detén el servidor,
borra el archivo `prisma/dev.db`, y ejecuta de nuevo
`npx prisma migrate dev --name init`.

---

## 16. Seguridad y limitaciones conocidas

- Las contraseñas se guardan encriptadas (bcrypt), nunca en texto plano.
- El acceso está restringido por dominio de correo (`@duoc.cl`) y por rol
  (Administrador vs Responsable) tanto en las páginas como en cada endpoint del
  backend.
- Los archivos de evidencia se guardan en el propio servidor (`public/uploads`);
  si despliegas en un hosting sin almacenamiento persistente (como Vercel sin
  configuración adicional), se perderían al reiniciar — usa Railway (sección 12) o
  agrega almacenamiento externo (Vercel Blob, S3, etc.).
- Next.js recibe actualizaciones de seguridad regularmente. Antes de desplegar en
  producción y luego periódicamente, ejecuta `npm audit` y considera actualizar con
  `npm install next@latest` seguido de pruebas locales, ya que algunas correcciones
  solo están disponibles en versiones mayores nuevas.
- Este proyecto no implementa límite de intentos de inicio de sesión (rate limiting).
  Para un uso institucional interno es un riesgo bajo, pero si expones la aplicación
  públicamente sin restricciones adicionales, considera agregar esa protección.
