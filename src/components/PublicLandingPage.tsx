import React, { useState } from 'react';
import {
  Code,
  Smartphone,
  Server,
  Database,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Calculator,
  LayoutDashboard,
  Layers,
  Sparkles,
  Award,
  Users,
  Building2,
  Globe,
  Cpu,
  LogIn,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Target,
  Eye,
  Calendar,
  Activity,
  Rocket,
  Coins,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import heroImg from '../assets/images/hero_agency_developer_1793475051788.jpg';
import fintechImg from '../assets/images/project_thumbnail_fintech_1793475053693.jpg';
const logoImg = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';
import { MOCK_PROJECTS } from '../data/mockData';
import { Project } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface PublicLandingPageProps {
  projects?: Project[];
  publicSection: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos';
  onEnterManagementSystem: () => void;
  onOpenPromptGenerator: () => void;
  onOpenLoginModal: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  projects = [],
  publicSection,
  onEnterManagementSystem,
  onOpenPromptGenerator,
  onOpenLoginModal,
}) => {
  // Estimator calculator state
  const [estPlatform, setEstPlatform] = useState<'web' | 'mobile' | 'fullstack'>('fullstack');
  const [estDb, setEstDb] = useState(true);
  const [estAuth, setEstAuth] = useState(true);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  const COP_EXCHANGE_RATE = 4200; // 1 USD = 4,200 COP

  const calculateEstimateUSD = () => {
    let baseUSD = 0;
    if (estPlatform === 'web') baseUSD = 1200;
    else if (estPlatform === 'mobile') baseUSD = 1500;
    else baseUSD = 2200;

    if (estDb) baseUSD += 250;
    if (estAuth) baseUSD += 200;

    return baseUSD;
  };

  const usdValue = calculateEstimateUSD();
  const copValue = usdValue * COP_EXCHANGE_RATE;

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactProjectType, setContactProjectType] = useState('Desarrollo Web & Móvil Full-Stack');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [emailStatusText, setEmailStatusText] = useState('');

  const NEXUS_WHATSAPP_PHONE = '573043470984';

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setIsSubmitting(true);
    setEmailStatusText('Registrando mensaje en la base de datos de Firebase...');

    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const msgSource = publicSection === 'contactanos' ? 'contact_page' : 'home_page';

    const newMessage = {
      id: msgId,
      name: contactName,
      email: contactEmail,
      phone: contactPhone || '',
      projectType: contactProjectType,
      message: contactMessage,
      status: 'unread',
      source: msgSource,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'contact_messages', msgId), newMessage);
      setEmailStatusText('¡Mensaje enviado con éxito! Se ha recibido en la Bandeja de Entrada del Panel de Administración en tiempo real.');
    } catch (err) {
      console.error('Error enviando mensaje a Firebase:', err);
      handleFirestoreError(err, OperationType.WRITE, `contact_messages/${msgId}`);
      setEmailStatusText('Error al enviar el mensaje. Por favor intente nuevamente.');
    }

    setIsSubmitting(false);
    setContactSubmitted(true);

    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
      setEmailStatusText('');
    }, 6000);
  };

  const handleDirectWhatsAppClick = () => {
    const defaultText = `Hola Nexus Web Studio! Quisiera solicitar información para desarrollar un proyecto web/móvil.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${NEXUS_WHATSAPP_PHONE}&text=${encodeURIComponent(defaultText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-16 py-6 animate-in fade-in duration-300">
      
      {/* SECTION 1: INICIO */}
      {(publicSection === 'inicio' || publicSection === undefined) && (
        <>
          {/* Main Hero Header */}
          <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-3xl border border-slate-800 p-8 lg:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                
                {/* Brand Identity Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-lg shadow-indigo-500/30">
                    <img src={logoImg} alt="Nexus Web Studio Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Nexus Web Studio</h2>
                    <span className="text-xs text-indigo-400 font-semibold">Agencia & Estudio de Software Full-Stack</span>
                  </div>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Desarrollo Web & Móvil de Alto Nivel para Empresas
                </h1>

                {/* Slogan */}
                <div className="p-4 bg-indigo-950/40 border-l-4 border-indigo-500 rounded-r-2xl">
                  <p className="text-base text-indigo-200 italic font-medium">
                    "Transformamos visión empresarial en arquitectura digital sofisticada, robusta y escalable con control de acceso por roles."
                  </p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Diseñamos y construimos aplicaciones web interactivas (React 19), apps móviles nativas (iOS & Android), microservicios de backend (Node.js/Express) y bases de datos relacionales (PostgreSQL) con gestión de permisos granulares por usuario.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={onOpenLoginModal}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar al Sistema (Login)</span>
                  </button>

                  <button
                    onClick={handleDirectWhatsAppClick}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp (+57 3043470984)</span>
                  </button>
                </div>
              </div>

              {/* Hero Visual Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl group">
                  <img
                    src={heroImg}
                    alt="Nexus Web Studio Workspace"
                    className="w-full h-80 lg:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                        <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Nexus Web Studio System</p>
                        <p className="text-[10px] text-indigo-400">Plataforma Web & Móvil en Operación</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Capabilities Grid */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl font-extrabold text-white">Arquitectura Tecnológica Integral</h2>
              <p className="text-xs text-slate-400">
                Soluciones completas de desarrollo de software con ingeniería frontend, backend y bases de datos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <Code className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Desarrollo Web Frontend</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interfaces fluidas y modernas en React 19, TypeScript, Tailwind CSS v4 y Vite con componentes accesibles.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Desarrollo Móvil Native</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aplicaciones móviles para iOS (TestFlight) & Android (Play Console) con Swift, React Native y Flutter.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Backend & API Microservicios</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  APIs REST y GraphQL escalables desarrolladas en Node.js, Express y Python FastAPI con seguridad JWT.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-indigo-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">PostgreSQL & Cloud DB</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bases de datos relacionales con Drizzle ORM, índices de alto rendimiento, Redis cache y desplegadas en GCP.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* SECTION 2: NUESTROS PROYECTOS WEB */}
      {(publicSection === 'proyectos' || publicSection === 'inicio') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">Portafolio Destacado</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Nuestros Proyectos Web & Móviles</h2>
            </div>

            <button
              onClick={onEnterManagementSystem}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <span>Ver Proyectos en el Sistema RBAC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Web Projects Grid (Synchronized with Google Cloud Firestore) */}
          {projects.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3 shadow-xl">
              <Database className="w-10 h-10 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Base de Datos de Firestore Conectada</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                No hay proyectos registrados actualmente en la base de datos de Firebase. Si eliminas proyectos, los cambios se reflejan definitivamente en el sitio web.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((prj, idx) => {
                const prjImg = idx === 0 ? fintechImg : heroImg;
                return (
                  <div key={prj.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <img
                        src={prjImg}
                        alt={prj.name}
                        className="w-full h-48 object-cover rounded-2xl border border-slate-800"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-indigo-400 font-bold">[{prj.code}]</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-bold">
                          {prj.type}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{prj.name}</h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {prj.description || 'Solución de ingeniería web y móvil full-stack con base de datos relacional PostgreSQL y control de acceso por roles.'}
                      </p>

                      {/* Dates & Percentage Bar */}
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-800/80 pb-2.5">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-400" /> Fecha de Inicio
                            </span>
                            <span className="font-mono text-xs text-white font-bold block">{prj.startDate}</span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-purple-400" /> Fecha Final / Entrega
                            </span>
                            <span className="font-mono text-xs text-white font-bold block">{prj.deadline}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />
                              Porcentaje Actual del Proyecto
                            </span>
                            <span className="font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                              {prj.progress}%
                            </span>
                          </div>

                          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                              style={{ width: `${prj.progress}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      {prj.techStack.map((tech, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CALCULADORA ESTIMADORA DE PRESUPUESTOS EN VIVO */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-950">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Calculadora Estimadora de Presupuestos en Vivo</h2>
                  <p className="text-xs text-slate-400">
                    Precios transparentes ajustados a moneda local ($ COP Pesos Colombianos y $ USD Dólares).
                  </p>
                </div>
              </div>

              {/* Currency Selector Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setCurrency('COP')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                    currency === 'COP' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Pesos Colombianos ($ COP)</span>
                </button>

                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                    currency === 'USD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Dólares ($ USD)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="md:col-span-7 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Seleccione el Tipo de Solución de Software</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    
                    <button
                      onClick={() => setEstPlatform('web')}
                      className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
                        estPlatform === 'web'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-300">$1,200 USD</span>
                      </div>
                      <p className="font-bold text-xs text-white">Plataforma Web SaaS</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Sistema de gestión de usuarios sin fin</p>
                    </button>

                    <button
                      onClick={() => setEstPlatform('mobile')}
                      className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
                        estPlatform === 'mobile'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-mono text-cyan-300">$1,500 USD</span>
                      </div>
                      <p className="font-bold text-xs text-white">Solamente App Móvil</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Aplicación iOS & Android Native</p>
                    </button>

                    <button
                      onClick={() => setEstPlatform('fullstack')}
                      className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
                        estPlatform === 'fullstack'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-mono text-purple-300">$2,200 USD</span>
                      </div>
                      <p className="font-bold text-xs text-white">Web + App Móvil (Combo)</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Sitio Web + Aplicación Móvil completa</p>
                    </button>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={estDb}
                      onChange={(e) => setEstDb(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>PostgreSQL Database (+ $250 USD)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={estAuth}
                      onChange={(e) => setEstAuth(e.target.checked)}
                      className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gestión de Permisos RBAC (+ $200 USD)</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-3 shadow-xl">
                <span className="text-xs uppercase font-mono text-slate-400 tracking-wider">
                  Presupuesto Estimado en Promedio
                </span>

                {currency === 'COP' ? (
                  <div className="space-y-1">
                    <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      ${copValue.toLocaleString('es-CO')} COP
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Equivalente aproximado a <strong>${usdValue.toLocaleString()} USD</strong>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      ${usdValue.toLocaleString()} USD
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Equivalente en Pesos: <strong>${copValue.toLocaleString('es-CO')} COP</strong>
                    </p>
                  </div>
                )}

                <button
                  onClick={handleDirectWhatsAppClick}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Cotizar por WhatsApp (+57 3043470984)</span>
                </button>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: SOBRE NOSOTROS */}
      {(publicSection === 'nosotros' || publicSection === 'inicio') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-10 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-lg">
                <img src={logoImg} alt="Nexus Web Studio Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Sobre Nexus Web Studio</h2>
                <p className="text-xs text-indigo-400 font-semibold">Agencia & Estudio de Ingeniería Full-Stack</p>
              </div>
            </div>

            <button
              onClick={onOpenLoginModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar al Sistema</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-white">Nuestra Misión</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Empoderar a empresas e instituciones mediante el diseño y desarrollo de aplicaciones web y móviles full-stack con arquitectura limpia, alta velocidad de respuesta, integración de bases de datos relacionales y controles estrictos de seguridad basados en roles.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-white">Nuestra Visión</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Consolidarnos como el estudio de desarrollo de software de referencia en América Latina y el mercado internacional, reconocido por la excelencia en ingeniería, la transparencia en la gestión de proyectos y la innovación tecnológica continua.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">Metodología de Trabajo</span>
              <h3 className="text-xl font-extrabold text-white">¿Cómo Desarrollamos Proyectos Web en Nexus Web Studio?</h3>
              <p className="text-xs text-slate-400">
                Seguimos un ciclo de vida ágil y estructurado garantizando código limpio, seguridad y entregables a tiempo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-purple-400 font-bold">Fase 01</span>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  Descubrimiento & Alcance
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Analizamos los requerimientos del negocio, definimos los módulos necesarios y diseñamos la matriz de roles y permisos RBAC.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-indigo-400 font-bold">Fase 02</span>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Esquema DB & Arquitectura
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Modelamos la base de datos relacional PostgreSQL con Drizzle ORM, diseñamos las APIs REST/GraphQL y la seguridad JWT.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-blue-400 font-bold">Fase 03</span>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-400" />
                  Sprints Ágiles Frontend & Mobile
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Desarrollamos el frontend interactivo en React 19, componentes Tailwind v4 y compilaciones móviles nativas para iOS y Android.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">Fase 04</span>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Pruebas QA & Playwright
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ejecutamos test suites automatizadas E2E con Playwright, pruebas de compatibilidad en dispositivos reales y auditoría de seguridad.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">Fase 05</span>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  Despliegue Cloud & Soporte
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Publicamos en Google Cloud Run y tiendas de apps (TestFlight/Play Store), activando monitoreo y soporte continuo con SLA.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: CONTÁCTANOS CON ENVÍO DIRECTO A BANDEJA DE ENTRADA FIRESTORE */}
      {(publicSection === 'contactanos' || publicSection === 'inicio') && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">Atención Directa & Cotizaciones</span>
            <h2 className="text-2xl font-extrabold text-white">Contáctanos en Nexus Web Studio</h2>
            <p className="text-xs text-slate-400">
              Al enviar tu mensaje, se registrará instantáneamente en la base de datos de Firebase y se reflejará en tiempo real en la Bandeja de Entrada del Panel de Administración.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Contact Form */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Formulario de Contacto Directo</span>
                </h3>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Firebase Sync Activo
                </span>
              </div>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center space-y-3 animate-in fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">¡Mensaje Enviado a la Bandeja de Entrada!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {emailStatusText || 'Tu mensaje se ha recibido en tiempo real en el módulo Bandeja de Entrada del panel de administración.'}
                  </p>
                  <button
                    onClick={handleDirectWhatsAppClick}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mx-auto"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contactar por WhatsApp (+57 3043470984)</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Juan Carlos López"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="juan.lopez@empresa.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+57 300 123 4567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Proyecto</label>
                      <select
                        value={contactProjectType}
                        onChange={(e) => setContactProjectType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="Desarrollo Web & Móvil Full-Stack">Desarrollo Web & Móvil Full-Stack ($2,200 USD / $9.240.000 COP)</option>
                        <option value="Plataforma Web SaaS">Plataforma Web SaaS ($1,200 USD / $5.040.000 COP)</option>
                        <option value="Aplicación Móvil iOS / Android">Solamente Aplicación Móvil ($1,500 USD / $6.300.000 COP)</option>
                        <option value="Sistema de Gestión RBAC">Sistema de Gestión RBAC Personalizado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción del Proyecto / Mensaje *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describa brevemente las características que requiere para su proyecto..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Enviando Correo a Nexus Web Studio...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensaje a Nexus Web Studio</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Details Cards */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Direct WhatsApp Callout */}
              <div className="bg-emerald-950/80 border border-emerald-700/80 p-5 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900 border border-emerald-600 text-white rounded-2xl">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Atención Inmediata por WhatsApp</h3>
                    <p className="text-xs text-emerald-200 font-mono font-bold">+57 3043470984</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  ¿Prefieres chatear directamente? Haz clic abajo para iniciar la conversación por WhatsApp con el equipo oficial de Nexus Web Studio.
                </p>
                <button
                  onClick={handleDirectWhatsAppClick}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Chat de WhatsApp (+57 3043470984)</span>
                </button>
              </div>

              {/* Official Contact Info Card */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-white">Información Oficial de Contacto</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-xl shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Correo Electrónico Corporativo</p>
                      <p className="text-white font-semibold">nexuswebstudio2026@gmail.com</p>
                      <p className="text-[10px] text-slate-500">contacto@nexuswebstudio.dev</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-xl shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Línea Telefónica & WhatsApp Oficial</p>
                      <p className="text-white font-semibold">+57 3043470984</p>
                      <p className="text-[10px] text-slate-500">Atención 24/7 en Colombia e Internacional</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-xl shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Oficinas de Ingeniería</p>
                      <p className="text-white font-semibold">Colombia & Cobertura Internacional</p>
                      <p className="text-[10px] text-slate-500">Desarrollo remoto global & reuniones presenciales</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </section>
      )}

    </div>
  );
};
