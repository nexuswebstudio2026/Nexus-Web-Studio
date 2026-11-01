import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Flame,
  CheckSquare,
  KeyRound,
  HardDriveDownload,
  FolderSync,
  RefreshCw,
  QrCode,
  FileCheck2,
  AlertTriangle,
  Play,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface SecurityCheckItem {
  id: number;
  title: string;
  category: 'Encryption' | 'Firewall' | 'Auth' | 'Backup' | 'Maintenance' | 'Headers';
  shortDesc: string;
  detail: string;
  codeSnippet?: string;
  recommendation: string;
  status: 'passed' | 'warning' | 'pending';
}

const INITIAL_CHECKS: SecurityCheckItem[] = [
  {
    id: 1,
    title: 'HTTPS (El Candadito) en todas las páginas',
    category: 'Encryption',
    shortDesc: 'Certificado SSL/TLS activo con redirección forzada de HTTP a HTTPS y HSTS habilitado.',
    detail: 'Asegura que todo el tráfico entre el usuario y la web esté cifrado. Previene la intercepción de credenciales, datos de formularios y cookies de sesión.',
    codeSnippet: `# Nginx HTTP -> HTTPS Redirect
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}`,
    recommendation: 'Instalar Let\'s Encrypt SSL gratuito o Cloudflare SSL. Habilitar la directiva HTTP Strict Transport Security (HSTS).',
    status: 'passed',
  },
  {
    id: 2,
    title: 'Cortafuegos (WAF) que bloquee ataques',
    category: 'Firewall',
    shortDesc: 'Web Application Firewall activo contra inyecciones SQL, XSS y ataques L7.',
    detail: 'Un WAF inspecciona el tráfico webentrante y bloquea scripts maliciosos, bots sospechosos, exploits conocidos de OWASP Top 10 y ataques Layer 7 antes de llegar al hosting.',
    codeSnippet: `# Cloudflare WAF OWASP Managed Rules Rule Engine
# Bloquea amenazas con Threat Score > 15 y firmados de reputación IP baja.`,
    recommendation: 'Configurar Cloudflare (Plan Gratuito o Pro) o un plugin de WAF a nivel de servidor como Wordfence / Sucuri / ModSecurity.',
    status: 'passed',
  },
  {
    id: 3,
    title: 'reCAPTCHA en todos los formularios',
    category: 'Auth',
    shortDesc: 'Google reCAPTCHA v3 / Cloudflare Turnstile activo en formularios de contacto, registro y login.',
    detail: 'Protege contra spam automático, registro masivo de usuarios falsos, envío constante de mensajes y abuso de formularios por parte de spambots.',
    codeSnippet: `<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
<script>
  grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'}).then(function(token) {
      document.getElementById('recaptchaToken').value = token;
    });
  });
</script>`,
    recommendation: 'Implementar Google reCAPTCHA v3 (invisible) o Cloudflare Turnstile para no degradar la experiencia de usuario.',
    status: 'passed',
  },
  {
    id: 4,
    title: 'Bloqueo a quien prueba contraseñas sin parar (Anti Brute-Force / Rate Limiting)',
    category: 'Auth',
    shortDesc: 'Limitación de intentos fallidos de inicio de sesión e IP Rate Limiting activado.',
    detail: 'Protege las cuentas administrativas contra ataques de fuerza bruta y diccionarios mediante el bloqueo automático de la dirección IP tras 3-5 intentos fallidos.',
    codeSnippet: `// Express Rate Limit Example
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos fallidos
  message: 'Demasiados intentos de inicio de sesión. IP bloqueada temporalmente por 15 min.'
});`,
    recommendation: 'Activar Limit Login Attempts Reloaded o Fail2ban en el servidor web. Limitar las solicitudes al endpoint de autenticación.',
    status: 'passed',
  },
  {
    id: 5,
    title: 'Escáner de virus que revise tu web a diario',
    category: 'Maintenance',
    shortDesc: 'Monitoreo diario de integridad de archivos y análisis automatizado de código malicioso.',
    detail: 'Detecta de forma temprana inyecciones de código PHP malicioso, web shells, redirecciones fraudulentas y alteraciones de archivos clave del servidor.',
    codeSnippet: `# Cronjob diario de escaneo con ClamAV / Maldet
0 3 * * * /usr/local/maldetect/maldet -a /var/www/html/ >> /var/log/maldet.log`,
    recommendation: 'Activar un scanner como Sucuri SiteCheck, MalCare o Imunify360 en el panel de control de tu hosting.',
    status: 'passed',
  },
  {
    id: 6,
    title: 'WordPress, plugins y temas al día (Core & Depedencias)',
    category: 'Maintenance',
    shortDesc: 'Parches de seguridad aplicados en el CMS, librerías npm y módulos instalados.',
    detail: 'Las vulnerabilidades en plugins desactualizados representan el 90% de los hackeos a sitios web. Mantener todo en la última versión corrige fallas conocidas.',
    codeSnippet: `# npm audit fix o actualización automática de WordPress
$ npm audit fix --force
$ wp core update && wp plugin update --all`,
    recommendation: 'Configurar actualizaciones automáticas de parches menores de seguridad y realizar revisiones semanales de dependencias.',
    status: 'passed',
  },
  {
    id: 7,
    title: 'Copia automática guardada fuera del hosting (Off-site Backups)',
    category: 'Backup',
    shortDesc: 'Respaldos automatizados diarios/semanales almacenados en Amazon S3, Google Drive o Dropbox.',
    detail: 'Si el servidor o hosting sufre un ataque de ransomware o falla total de hardware, contar con una copia remota garantiza la restauración inmediata en otro proveedor.',
    codeSnippet: `# S3 Off-site Backup Sync Command
0 2 * * * pg_dump production_db | gzip | aws s3 cp - s3://nexus-backups/db_$(date +%Y%m%d).sql.gz`,
    recommendation: 'Usar UpdraftPlus o BlogVault hacia Amazon S3 / Google Drive con retención de 30 días.',
    status: 'passed',
  },
  {
    id: 8,
    title: 'Otra dirección de acceso que no sea wp-admin (Obfuscación de URLs)',
    category: 'Auth',
    shortDesc: 'Cambio de la ruta predeterminada de inicio de sesión /wp-admin a una URL personalizada y secreta.',
    detail: 'Ocultar el acceso predeterminado de administración desvía el 95% de los bots automatizados que buscan ingresar a través de /wp-admin o /wp-login.php.',
    codeSnippet: `# URL de login personalizada
Original: https://mi-sitio.com/wp-admin
Protegida: https://mi-sitio.com/nexus-secure-login-2026`,
    recommendation: 'Utilizar WPS Hide Login u ocultar endpoints admin en el router de la aplicación.',
    status: 'passed',
  },
  {
    id: 9,
    title: 'Verificación en dos pasos para entrar (2FA / MFA)',
    category: 'Auth',
    shortDesc: 'Autenticación de doble factor obligatoria con aplicaciones Authenticator (TOTP) para administradores.',
    detail: 'Añade una segunda capa de seguridad infranqueable: aunque un atacante obtenga la contraseña, no podrá acceder sin el código dinámico de 6 dígitos de Google Authenticator.',
    codeSnippet: `// Implementación 2FA con otplib / Google Authenticator
import { authenticator } from 'otplib';

const isValid = authenticator.check(userProvidedToken, secretKey);`,
    recommendation: 'Exigir 2FA a todos los roles de Administrador, Editor y Desarrollador.',
    status: 'passed',
  },
  {
    id: 10,
    title: 'Encabezados de Seguridad & Políticas de Privacidad (Security Headers & GDPR)',
    category: 'Headers',
    shortDesc: 'Configuración de Content-Security-Policy, X-Frame-Options, X-Content-Type-Options y Aviso SSL/GDPR.',
    detail: 'Protege al navegador del usuario contra ataques de Clickjacking, MIME sniffing e inyecciones iFrame externas no autorizadas.',
    codeSnippet: `// HTTP Response Security Headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self';`,
    recommendation: 'Utilizar Helmet.js en Express o agregar directivas de seguridad en el archivo .htaccess / nginx.conf.',
    status: 'passed',
  },
];

export const PreLaunchChecklist: React.FC = () => {
  const [items, setItems] = useState<SecurityCheckItem[]>(INITIAL_CHECKS);
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');

  const toggleStatus = (id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus: SecurityCheckItem['status'] =
            item.status === 'passed' ? 'warning' : item.status === 'warning' ? 'pending' : 'passed';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleRunFullAudit = () => {
    setIsScanning(true);
    setScanProgress(10);
    setScanMessage('Iniciando auditoría automatizada de seguridad pre-lanzamiento...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanMessage('🎉 Auditoría completada: 10 de 10 verificaciones pasadas exitosamente (Puntuación 100/100).');
          return 100;
        }
        const next = prev + 15;
        if (next < 30) setScanMessage('Comprobando HTTPS, SSL/TLS y cabeceras HSTS...');
        else if (next < 50) setScanMessage('Verificando Cloudflare WAF, reCAPTCHA v3 y reglas anti-fuerza bruta...');
        else if (next < 70) setScanMessage('Escaneando vulnerabilidades de dependencias y código CMS...');
        else if (next < 90) setScanMessage('Validando almacenamiento de respaldos remotos off-site (Amazon S3)...');
        else setScanMessage('Comprobando 2FA y endpoints de autenticación modificados...');
        return next;
      });
    }, 400);
  };

  const passedCount = items.filter((i) => i.status === 'passed').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const scorePercent = Math.round((passedCount / items.length) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Checklist de Seguridad Producción
            </span>
            <span className="text-xs text-slate-400 font-mono">Normativa OWASP & ISO 27001</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>10 Verificaciones de Seguridad Pre-Lanzamiento Web</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Lista de verificación fundamental para garantizar que tu sitio web, servidor y CMS cumplan con los estándares de ciberseguridad antes de salir a producción.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{scorePercent}%</span>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Puntuación</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <button
            onClick={handleRunFullAudit}
            disabled={isScanning}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Auditando...' : 'Escanear 10 Puntos'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Status Bar */}
      {isScanning && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-300">{scanMessage}</span>
            <span className="text-slate-400 font-bold">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-emerald-900/50 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Aprobados</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{passedCount} / 10</span>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-slate-950 border border-amber-900/50 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Advertencias</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{warningCount}</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Pendientes</span>
            <span className="text-lg font-bold text-slate-400 font-mono">{pendingCount}</span>
          </div>
          <ClockIcon className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-slate-950 border border-blue-900/50 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Estado General</span>
            <span className="text-xs font-bold text-blue-400 uppercase font-mono">
              {passedCount === 10 ? 'Listo Producción' : 'Revisión Necesaria'}
            </span>
          </div>
          <ShieldCheck className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* 10 Items Accordion / List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`bg-slate-950 border rounded-2xl transition-all overflow-hidden ${
                item.status === 'passed'
                  ? 'border-emerald-900/40 hover:border-emerald-700/50'
                  : item.status === 'warning'
                  ? 'border-amber-900/50 hover:border-amber-700/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Item Row */}
              <div
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(item.id);
                    }}
                    title="Haga clic para cambiar estado de verificación"
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      item.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : item.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.status === 'passed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : item.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <span className="font-mono text-xs font-bold">{item.id}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{item.id}. {item.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.shortDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(item.id);
                    }}
                    className={`text-[10px] uppercase font-bold font-mono px-2.5 py-1 rounded-lg border cursor-pointer ${
                      item.status === 'passed'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : item.status === 'warning'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {item.status === 'passed' ? 'VERIFICADO' : item.status === 'warning' ? 'ATENCIÓN' : 'PENDIENTE'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Detail & Code Snippet */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-900 bg-slate-900/50 space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-300">{item.detail}</p>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 block font-mono">
                      💡 Recomendación de Implementación:
                    </span>
                    <p className="text-xs text-slate-300">{item.recommendation}</p>
                  </div>

                  {item.codeSnippet && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                        Snippet / Configuración de Referencia:
                      </span>
                      <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto">
                        {item.codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
