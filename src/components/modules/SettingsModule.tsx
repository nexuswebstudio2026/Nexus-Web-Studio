import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Database,
  ShieldCheck,
  Mail,
  Globe,
  Save,
  CheckCircle2,
  Key,
  Server,
  Lock,
  Smartphone,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { FirebaseCrudModule } from './FirebaseCrudModule';

interface SettingsModuleProps {
  currentUser: UserAccount;
  initialTab?: 'agency' | 'database' | 'security' | 'smtp';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ currentUser, initialTab = 'agency' }) => {
  const [activeTab, setActiveTab] = useState<'agency' | 'database' | 'security' | 'smtp'>(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Agency Form State
  const [agencyName, setAgencyName] = useState('Nexus Web Studio');
  const [agencySlogan, setAgencySlogan] = useState('Full-Stack Web & Mobile Architecture');
  const [agencyPhone, setAgencyPhone] = useState('+57 3043470984');
  const [agencyEmail, setAgencyEmail] = useState('nexuswebstudio2026@gmail.com');
  const [agencyDomain, setAgencyDomain] = useState('nexuswebstudio.dev');

  // Database Form State
  const [projectId, setProjectId] = useState('nexus-web-studio-94ca8');
  const [databaseId, setDatabaseId] = useState('ai-studio-nexuswebmobilest-544574f1-928e-43d1-91b1-c4eda4a2dcc8');
  const [firestoreRegion, setFirestoreRegion] = useState('us-east1');

  // Security Form State
  const [sessionTimeout, setSessionTimeout] = useState('24_hours');
  const [jwtExpiration, setJwtExpiration] = useState('7_days');

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('nexuswebstudio2026@gmail.com');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              Configuración General del Sistema
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.5.0 Production</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Ajustes Globales & Variables de Entorno
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Administre parámetros de agencia, conexiones a Cloud Firestore/PostgreSQL, seguridad RBAC y correo SMTP.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configuración guardada exitosamente</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'agency', label: 'Datos de la Agencia', icon: Building2 },
          { id: 'database', label: 'Bases de Datos & Cloud', icon: Database },
          { id: 'security', label: 'Seguridad & RBAC', icon: ShieldCheck },
          { id: 'smtp', label: 'Correo SMTP & Envíos', icon: Mail },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* TAB 1: AGENCY */}
        {activeTab === 'agency' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Perfil e Identidad Corporativa de la Agencia</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Comercial de la Agencia</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slogan / Eslogan Corporativo</label>
                  <input
                    type="text"
                    value={agencySlogan}
                    onChange={(e) => setAgencySlogan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Línea Oficial WhatsApp</label>
                  <input
                    type="text"
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico Oficial</label>
                  <input
                    type="email"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos de Agencia</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DATABASE (Config + Complete Firebase CRUD Module) */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Configuración de Google Cloud Firestore & PostgreSQL</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project ID de Google Cloud</label>
                  <input
                    type="text"
                    value={projectId}
                    readOnly
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Firestore Database ID</label>
                  <input
                    type="text"
                    value={databaseId}
                    readOnly
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Región del Servidor Cloud</label>
                  <input
                    type="text"
                    value={firestoreRegion}
                    onChange={(e) => setFirestoreRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                  <Server className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Estado de la Base de Datos</p>
                    <p className="text-[11px] text-emerald-400">Sincronización activa vía onSnapshot</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Conexión Cloud</span>
                </button>
              </div>
            </form>

            {/* Embedded Full Firebase CRUD Module */}
            <div className="pt-6 border-t border-slate-800">
              <FirebaseCrudModule currentUser={currentUser} />
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'security' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Políticas de Autenticación, Sesión & Permisos Granulares RBAC</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Persistencia de Sesión</label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="24_hours">Mantener activa hasta Cerrar Sesión (localStorage)</option>
                    <option value="8_hours">Expiración en 8 Horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expiración de Tokens JWT</label>
                  <select
                    value={jwtExpiration}
                    onChange={(e) => setJwtExpiration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="7_days">7 Días de Validez</option>
                    <option value="30_days">30 Días de Validez</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Políticas de Seguridad</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: SMTP */}
        {activeTab === 'smtp' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Parámetros del Servidor SMTP de Gmail</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Host SMTP</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Puerto SSL</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usuario Remitente</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Servidor SMTP</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
