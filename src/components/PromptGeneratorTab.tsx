import React, { useState } from 'react';
import {
  Wand2,
  Copy,
  Check,
  Sparkles,
  Layers,
  Shield,
  Code2,
  Laptop,
  Smartphone,
  Database,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { PromptGeneratorConfig, RoleId } from '../types';
import { SYSTEM_ROLES } from '../data/mockData';

export const PromptGeneratorTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<PromptGeneratorConfig>({
    companyName: 'Nexus Web & Mobile Software Studio',
    tagline: 'Desarrollo Web & Móvil Full-Stack de Alto Rendimiento',
    techStack: ['React 19', 'React Native / Flutter', 'Node.js & Express', 'PostgreSQL & Redis', 'Tailwind CSS v4', 'Docker & AWS'],
    selectedRoles: ['admin', 'accounting', 'support', 'web_dev', 'mobile_dev', 'qa_devops', 'client'],
    additionalModules: ['Desarrollo Móvil (iOS/Android)', 'QA & DevOps CI/CD', 'Portal del Cliente Executivo', 'Estimador de Presupuestos'],
    visualStyle: 'dark_glass',
    targetPlatform: 'google_ai_studio',
    includeGranularRbac: true,
    includeEstimator: true,
    includeClientPortal: true,
  });

  const generatedPromptText = `Eres un Ingeniero Principal de Software y Diseñador UX/UI de élite. Crea un sitio web y plataforma SaaS corporativa completa, elegante, moderna, sofisticada, atractiva y profesional para la empresa de desarrollo web y móvil full-stack "${config.companyName}".

El proyecto debe constar de dos áreas perfectamente integradas:
1. SITIO WEB PÚBLICO DE LA AGENCIA:
   - Presentación de la empresa, servicios de desarrollo Web (Frontend, Backend, Base de Datos PostgreSQL/MongoDB) y Desarrollo Móvil (iOS con Swift/React Native y Android con Kotlin/Flutter).
   - Matriz interactiva de tecnologías (Stack tecnológico completo).
   - Portafolio interactivo de proyectos realizados con vistas previas y métricas.
   - Calculadora / Estimador de Presupuestos en vivo para clientes potenciales.

2. SISTEMA DE GESTIÓN DE PROYECTOS CON CONTROL DE ACCESO BASADO EN ROLES (RBAC) Y PERMISOS GRANULARES:
   - Sistema dinámico de autenticación y cambio de usuarios/roles.
   - Si un usuario ingresa como "Administración", se despliega el panel completo con KPIs del negocio, gestión de proyectos clave, lista de usuarios y edición de la Matriz de Permisos Granulares.
   - Si ingresa como "Contabilidad", se despliega únicamente el panel financiero: facturación (Invoices), presupuestos por proyecto, costes de infraestructura y reportes de margen de ganancia.
   - Si ingresa como "Atención al Cliente", se despliega la bandeja de entrada de tickets de soporte, gestión de SLA y chats directos con clientes.
   - Si ingresa como "Desarrollo Web", se muestra el Tablero Kanban de Sprints Web, visor de esquema de Base de Datos y catálogo de endpoints API REST/GraphQL.
   - Si ingresa como "Desarrollo Móvil", se muestran las versiones de TestFlight / Play Console, matriz de testing en dispositivos (iOS/Android) y monitoreo de crashes.
   - Si ingresa como "QA & DevOps", se visualizan los pipelines de integración continua (CI/CD), ejecuciones de suites de pruebas automatizadas y gestión de secretos de servidor.
   - Si ingresa como "Portal del Cliente", se muestra la vista ejecutiva del proyecto contratado, aprobación de entregables y pago de facturas.

REQUISITO CRÍTICO - GESTIÓN DE PERMISOS GRANULAR POR USUARIO:
- Además del rol principal assigned, el sistema debe incluir una Matriz de Permisos Granulares configurable por usuario (ej. banderas booleanas para 'users.manage_roles', 'finance.issue_invoices', 'web.manage_db', 'mobile.push_build', etc.).
- La interfaz debe deshabilitar o restringir dinámicamente cualquier botón o módulo si el usuario activo no posee el permiso específico necesario.

DISEÑO UI/UX & ESTILO VISUAL:
- Estilo visual: ${config.visualStyle === 'dark_glass' ? 'Glassmorphism oscuro sofisticado con tonos Slate 950, acentos Violeta/Índigo, tipografía nítida Sans + Monospace para números tabulares y bordes sutiles de 1px' : 'Limpio, moderno y elegante'}.
- Sin botones planos aburridos. Interacciones suaves, estados vacíos detallados, sin dead clicks y con soporte responsive total para pantallas desde 360px hasta 1440px desktop.

STACK TÉCNICO RECOMENDADO:
- Framework: React 19 + TypeScript + Vite / Next.js.
- Estilos: Tailwind CSS v4.
- Iconos: Lucide React.
- Componentes: Modulares, funcionales y tipados estrictamente.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleRole = (roleId: RoleId) => {
    if (config.selectedRoles.includes(roleId)) {
      if (config.selectedRoles.length > 1) {
        setConfig({
          ...config,
          selectedRoles: config.selectedRoles.filter((r) => r !== roleId),
        });
      }
    } else {
      setConfig({
        ...config,
        selectedRoles: [...config.selectedRoles, roleId],
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/80 border border-purple-700/60 rounded-full text-purple-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Master Prompt Builder & Customizer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Generador de Prompts para Google AI Studio & Google Sites
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Personalice las variables de su empresa de desarrollo web & móvil full-stack y genere el prompt maestro definitivo optimizado para construir aplicaciones completas en Google AI Studio o embeberlas en Google Sites.
            </p>
          </div>

          <button
            onClick={handleCopyPrompt}
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-xl transition-all shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Prompt Maestro Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Prompt Maestro</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Customizer Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>Configuración del Prompt</span>
            </h2>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre de la Empresa</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Platform */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Plataforma Destino</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'google_ai_studio', label: 'Google AI Studio' },
                  { id: 'google_sites', label: 'Google Sites' },
                  { id: 'standalone_spa', label: 'React SPA' },
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setConfig({ ...config, targetPlatform: plat.id as any })}
                    className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all truncate ${
                      config.targetPlatform === plat.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roles Incluidos en el Sistema (RBAC)</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {SYSTEM_ROLES.map((r) => {
                  const isChecked = config.selectedRoles.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleToggleRole(r.id)}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-950/20 border-purple-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-purple-400' : 'bg-slate-700'}`} />
                        <span className="font-semibold">{r.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Theme Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estilo Visual</label>
              <select
                value={config.visualStyle}
                onChange={(e) => setConfig({ ...config, visualStyle: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="dark_glass">Dark Glassmorphism / Neon Accent (Recomendado)</option>
                <option value="modern_clean">Modern Minimalist Clean Light/Dark</option>
                <option value="corporate_slate">Corporate Slate Luxury Executive</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300">Incluir Permisos Granulares por Usuario</span>
                <input
                  type="checkbox"
                  checked={config.includeGranularRbac}
                  onChange={(e) => setConfig({ ...config, includeGranularRbac: e.target.checked })}
                  className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300">Incluir Calculadora Estimadora de Presupuestos</span>
                <input
                  type="checkbox"
                  checked={config.includeEstimator}
                  onChange={(e) => setConfig({ ...config, includeEstimator: e.target.checked })}
                  className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>

          </div>
        </div>

        {/* Right Column: Prompt Output Box & Guide */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white">Prompt Maestro Generado</h2>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto selection:bg-purple-900 selection:text-white">
              {generatedPromptText}
            </div>
          </div>

          {/* Integration Instructions Guide */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Instrucciones de Uso en Google Sites & Google AI Studio</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>En Google AI Studio (Build):</span>
                </div>
                <ol className="list-decimal list-inside text-slate-300 space-y-1.5">
                  <li>Haga clic en el botón <strong>"Copiar Prompt Maestro"</strong> arriba.</li>
                  <li>Pegue el prompt en la caja de conversación de Google AI Studio.</li>
                  <li>Presione Enter. El agente creará el proyecto completo con React 19, Tailwind v4 y los roles.</li>
                </ol>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Laptop className="w-4 h-4" />
                  <span>En Google Sites:</span>
                </div>
                <ol className="list-decimal list-inside text-slate-300 space-y-1.5">
                  <li>En Google Sites, vaya al menú <strong>Insertar &gt; Incorporar (Embed)</strong>.</li>
                  <li>Seleccione la opción <strong>"Mediante URL"</strong> o <strong>"Código de incorporación"</strong>.</li>
                  <li>Pegue el enlace desplegado de su aplicación web o el bloque iframe interactivo.</li>
                </ol>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
