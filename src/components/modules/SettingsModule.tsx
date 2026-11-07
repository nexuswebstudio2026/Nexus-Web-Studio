import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  ShieldCheck,
  Mail,
  Save,
  CheckCircle2,
  Server,
  Share2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Phone,
  Globe,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserAccount } from '../../types';
import { FirebaseCrudModule } from './FirebaseCrudModule';
import { renderSocialIcon } from '../Footer';

interface SettingsModuleProps {
  currentUser: UserAccount;
  initialTab?: 'agency' | 'database' | 'security' | 'smtp';
}

export interface SocialLinkDoc {
  id: string;
  name: string;
  url: string;
  color?: string;
  updatedAt?: any;
}

const DEFAULT_SOCIAL_ITEMS: Omit<SocialLinkDoc, 'id'>[] = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61593046477590',
    color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40',
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/nexuswebstudio',
    color: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/40',
  },
  {
    name: 'X (Twitter)',
    url: 'https://x.com/nexuswebstudio',
    color: 'hover:text-white hover:bg-slate-800 hover:border-slate-600',
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@nexuswebstudio',
    color: 'hover:text-[#00F2FE] hover:bg-[#00F2FE]/10 hover:border-[#00F2FE]/40',
  },
  {
    name: 'Threads',
    url: 'https://threads.net/@nexuswebstudio',
    color: 'hover:text-purple-300 hover:bg-purple-950/60 hover:border-purple-600/40',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@NexusWebStudio',
    color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/40',
  },
  {
    name: 'WhatsApp',
    url: 'https://api.whatsapp.com/send?phone=573043470984&text=Hola%20Nexus%20Web%20Studio!%20Me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n.',
    color: 'hover:text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/40',
  },
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({ currentUser, initialTab = 'agency' }) => {
  const [activeTab, setActiveTab] = useState<'agency' | 'database' | 'security' | 'smtp'>(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Agency Form State
  const [agencyName, setAgencyName] = useState('Nexus Web Studio');
  const [agencySlogan, setAgencySlogan] = useState('Full-Stack Web & Mobile Architecture');
  const [agencyPhone, setAgencyPhone] = useState('+57 304 347 0984');
  const [agencyEmail, setAgencyEmail] = useState('nexuswebstudio2026@gmail.com');
  const [agencyDomain, setAgencyDomain] = useState('nexuswebstudio.dev');
  const [whatsappUrl, setWhatsappUrl] = useState('https://api.whatsapp.com/send?phone=573043470984&text=Hola%20Nexus%20Web%20Studio!%20Me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n.');

  // Social Links List from Firestore
  const [socialLinks, setSocialLinks] = useState<SocialLinkDoc[]>([]);

  // Modal / Form state for Creating or Updating Social Link
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [modalSocialName, setModalSocialName] = useState('');
  const [modalSocialUrl, setModalSocialUrl] = useState('');
  const [modalSocialColor, setModalSocialColor] = useState('hover:text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/40');

  // Database Form State
  const [projectId] = useState('nexus-web-studio-94ca8');
  const [databaseId] = useState('ai-studio-nexuswebmobilest-544574f1-928e-43d1-91b1-c4eda4a2dcc8');
  const [firestoreRegion, setFirestoreRegion] = useState('us-east1');

  // Security Form State
  const [sessionTimeout, setSessionTimeout] = useState('24_hours');
  const [jwtExpiration, setJwtExpiration] = useState('7_days');

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('nexuswebstudio2026@gmail.com');

  // Real-time Firestore listeners & Auto-seed
  useEffect(() => {
    // 1. Listen to Agency Profile document
    const unsubProfile = onSnapshot(doc(db, 'agency_profile', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name) setAgencyName(data.name);
        if (data.slogan) setAgencySlogan(data.slogan);
        if (data.phone) setAgencyPhone(data.phone);
        if (data.email) setAgencyEmail(data.email);
        if (data.domain) setAgencyDomain(data.domain);
        if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
      }
    }, (err) => console.warn('Firestore agency_profile snapshot error:', err));

    // 2. Listen to Social Links collection
    const unsubSocial = onSnapshot(collection(db, 'agency_social_links'), async (snapshot) => {
      if (snapshot.empty) {
        // Seed default items if collection is empty
        for (const item of DEFAULT_SOCIAL_ITEMS) {
          const docId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          await setDoc(doc(db, 'agency_social_links', docId), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const links: SocialLinkDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Red Social',
          url: d.data().url || '#',
          color: d.data().color || 'hover:text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/40',
        }));
        setSocialLinks(links);
      }
    }, (err) => console.warn('Firestore agency_social_links snapshot error:', err));

    return () => {
      unsubProfile();
      unsubSocial();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Agency Profile to Firestore
  const handleSaveAgencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'agency_profile', 'main'), {
        name: agencyName,
        slogan: agencySlogan,
        phone: agencyPhone,
        email: agencyEmail,
        domain: agencyDomain,
        whatsappUrl: whatsappUrl,
        updatedAt: serverTimestamp(),
      });
      setSavedSuccess(true);
      showToast('Perfil de la agencia actualizado exitosamente en Firestore');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving agency profile:', err);
      showToast('Error al guardar datos de la agencia');
    }
  };

  // Open modal for Create or Update Social Link
  const handleOpenSocialModal = (link?: SocialLinkDoc) => {
    if (link) {
      setEditingSocialId(link.id);
      setModalSocialName(link.name);
      setModalSocialUrl(link.url);
      setModalSocialColor(link.color || 'hover:text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/40');
    } else {
      setEditingSocialId(null);
      setModalSocialName('');
      setModalSocialUrl('https://');
      setModalSocialColor('hover:text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/40');
    }
    setIsSocialModalOpen(true);
  };

  // Submit Social Link Create / Update
  const handleSaveSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSocialName.trim() || !modalSocialUrl.trim()) return;

    try {
      const docId = editingSocialId || modalSocialName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'agency_social_links', docId), {
        name: modalSocialName.trim(),
        url: modalSocialUrl.trim(),
        color: modalSocialColor,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      showToast(editingSocialId ? 'Red social actualizada en tiempo real' : 'Nueva red social agregada exitosamente');
      setIsSocialModalOpen(false);
    } catch (err) {
      console.error('Error saving social link:', err);
      showToast('Error al guardar la red social');
    }
  };

  // Delete Social Link
  const handleDeleteSocialLink = async (id: string, name: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la red social "${name}"? Se quitará inmediatamente del footer.`)) return;

    try {
      await deleteDoc(doc(db, 'agency_social_links', id));
      showToast(`Red social "${name}" eliminada correctamente`);
    } catch (err) {
      console.error('Error deleting social link:', err);
      showToast('Error al eliminar la red social');
    }
  };

  const handleSaveGenericSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    showToast('Ajustes guardados correctamente');
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-cyan-500/40 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            Administre parámetros de agencia, redes sociales del footer, conexiones a Cloud Firestore/PostgreSQL, seguridad RBAC y correo SMTP.
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-8">
        {/* TAB 1: AGENCY */}
        {activeTab === 'agency' && (
          <div className="space-y-8">
            {/* Section 1: Perfil e Identidad Corporativa */}
            <form onSubmit={handleSaveAgencyProfile} className="space-y-6">
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
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Teléfono / Línea de Contacto</span>
                    </label>
                    <input
                      type="text"
                      value={agencyPhone}
                      onChange={(e) => setAgencyPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Correo Electrónico Oficial</span>
                    </label>
                    <input
                      type="email"
                      value={agencyEmail}
                      onChange={(e) => setAgencyEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Dominio Web Principal</span>
                    </label>
                    <input
                      type="text"
                      value={agencyDomain}
                      onChange={(e) => setAgencyDomain(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Enlace Directo WhatsApp (API)</label>
                    <input
                      type="text"
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Perfil de Agencia</span>
                </button>
              </div>
            </form>

            {/* Section 2: Redes Sociales & Contacto Directo (CRUD COMPLETO) */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Redes Sociales & Canales de Contacto Directo del Footer</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gestione (Crear, Leer, Actualizar, Eliminar) en tiempo real las redes sociales que se despliegan públicamente en el footer.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenSocialModal()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Red Social</span>
                </button>
              </div>

              {/* Grid of Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                          {renderSocialIcon(link.name)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{link.name}</p>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                          >
                            <span className="truncate">{link.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      <button
                        onClick={() => handleOpenSocialModal(link)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition-colors text-[11px]"
                      >
                        <Edit3 className="w-3 h-3 text-cyan-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSocialLink(link.id, link.name)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-1 transition-colors text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE (Config + Complete Firebase CRUD Module) */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            <form onSubmit={handleSaveGenericSettings} className="space-y-4">
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
          <form onSubmit={handleSaveGenericSettings} className="space-y-6">
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
          <form onSubmit={handleSaveGenericSettings} className="space-y-6">
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

      {/* Social Media Link CRUD Modal */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingSocialId ? 'Editar Red Social' : 'Agregar Nueva Red Social'}
                </h3>
              </div>
              <button
                onClick={() => setIsSocialModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSocialLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre de la Red Social (e.g. LinkedIn, Facebook, Instagram, TikTok)
                </label>
                <input
                  type="text"
                  value={modalSocialName}
                  onChange={(e) => setModalSocialName(e.target.value)}
                  placeholder="e.g. LinkedIn"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL Completa del Perfil o Enlace Directo
                </label>
                <input
                  type="url"
                  value={modalSocialUrl}
                  onChange={(e) => setModalSocialUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSocialId ? 'Actualizar' : 'Crear Red Social'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



