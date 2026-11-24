# Sitio Oficial y Panel Administrativo — Andrés Camilo Vidal Canchón

Aplicación web full-stack en español (`lang="es"`) con sitio público editorial, panel privado protegido mediante cookies `HttpOnly`, integración opcional con Google Sheets vía cuenta de servicio y módulo de auditoría de solo lectura con Gemini API en el servidor.

## Arquitectura implementada

- **Frontend (`src/`)**: React + TypeScript + Tailwind CSS v4 + React Router.
  - Tema automático por hora local: Modo día (`6:00 a. m. – 5:59 p. m.`) y Modo noche (`6:00 p. m. – 5:59 a. m.`).
  - Rutas públicas: `/`, `/vida-personal`, `/vida-politica`, `/proyectos`, `/historia`, `/iniciar-sesion`.
  - Panel privado: `/dashboard` con barra lateral colapsable pulsando el avatar `ACV` y módulos `Inicio / Panel`, `Vida política` (CRUD), `Base de datos`, `Agentes de IA` y `Sitio público`.
- **Backend (`server.ts` + `server/`)**: Express + TypeScript organizado por servicios (`auth`, `sheets`, `ai`, `validation`, `config`).
  - Autenticación con hash `scrypt` + token HMAC-SHA256 en cookie `HttpOnly`, `SameSite=Lax`, más verificación de origen (`Origin`) contra CSRF.
  - Almacenamiento persistente local (`data/store.json`) y fotos subidas en `data/uploads/` (JPG, PNG o WebP, máximo 5 MB).
  - Sincronización opcional con Google Sheets API v4 mediante JWT RSA-SHA256 de cuenta de servicio. La pestaña de información usa `GOOGLE_SHEETS_INFORMATION_SHEET_NAME` (por defecto `Información`) y guarda la URL pública de la foto en `B2` cuando las credenciales están configuradas.

## Estructura de Google Sheets requerida

Si conectas Google Sheets, la primera fila de la hoja debe contener exactamente estos 9 encabezados:

`id`, `section`, `category`, `title`, `period`, `detail`, `status`, `visibility`, `sort_order`

- **Caché y disponibilidad**: El backend cachea la lectura de Google Sheets por 60 segundos y respalda en `data/store.json`. Los cambios guardados en el panel se escriben de inmediato; si Google Sheets falla o no tiene credenciales, el panel reporta la incidencia sin ocultar el error y las rutas públicas continúan filtrando estrictamente `visibility === "publica"`.

## Variables de entorno del servidor

Configura estas variables en `.env` (local, ignorado por Git) o en **Settings → Secrets** del servidor (nunca subas secretos al repositorio):

- `PORT`: Puerto HTTP (por defecto `3000`).
- `APP_URL`: URL pública de la aplicación.
- `SESSION_SECRET`: Cadena aleatoria larga para firmar cookies de sesión.
- `ADMIN_USERNAME`: Usuario administrador inicial en producción.
- `ADMIN_PASSWORD_HASH`: Hash `salt:hash` generado con `scrypt` para producción (o `ADMIN_PASSWORD` en desarrollo).
- `OPENAI_API_KEY`: Clave del servidor para generar respuestas de los agentes personalizados.
- `OPENAI_MODEL`: Modelo de OpenAI para los agentes personalizados (por defecto `gpt-6-luna`).
- `GEMINI_API_KEY`: Clave del servidor para el agente **Auditor Full Stack del sitio Camilo Vidal** y las auditorías programadas.
- `GOOGLE_SHEETS_SPREADSHEET_ID`: ID de la hoja de cálculo.
- `GOOGLE_SHEETS_SHEET_NAME`: Nombre de la pestaña (por defecto `Registros`).
- `GOOGLE_SHEETS_INFORMATION_SHEET_NAME`: Pestaña donde se guarda la URL de la foto (por defecto `Información`).
- `GOOGLE_SHEETS_ACADEMIC_SHEET_NAME`: Pestaña de vida académica (por defecto `Vida académica`).
- `GOOGLE_SHEETS_EMPLOYMENT_SHEET_NAME`: Pestaña de vida laboral (por defecto `Vida laboral`).
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Contenido JSON completo de la cuenta de servicio (opcional si usas email + llave privada).
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Correo `client_email` de la cuenta de servicio.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Clave privada PEM de la cuenta de servicio (con `\n` escapados).

## Instalación y ejecución local

```bash
npm install
npm test
npm run dev
```

Para compilar y ejecutar en modo producción:

```bash
npm run build
npm start
```
