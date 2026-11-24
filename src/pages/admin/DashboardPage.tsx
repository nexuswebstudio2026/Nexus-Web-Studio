import { BookOpen, BriefcaseBusiness, Camera, Database, FolderKanban, Globe, Landmark, LayoutDashboard, LogOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { PoliticalRecord, SheetsStatusInfo, SiteSettings } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { AdminDatabaseTab } from './AdminDatabaseTab';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminPoliticalCrudTab } from './AdminPoliticalCrudTab';
import { AdminAcademicCrudTab } from './AdminAcademicCrudTab';
import { AdminEmploymentCrudTab } from './AdminEmploymentCrudTab';
import { AdminProjectsCrudTab } from './AdminProjectsCrudTab';
import { AdminPublicSiteTab } from './AdminPublicSiteTab';
import { SiteFooter } from '../../components/SiteFooter';

type AdminModule = 'inicio' | 'vida_politica' | 'vida_academica' | 'vida_laboral' | 'proyectos' | 'base_datos' | 'sitio_publico';

export function DashboardPage() {
  const { session, loading: authLoading, logout, authFetch } = useAuth();
  const { refreshPublicData } = usePublicData();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [activeModule, setActiveModule] = useState<AdminModule>('inicio');
  const [records, setRecords] = useState<PoliticalRecord[]>([]);
  const [sheetsStatus, setSheetsStatus] = useState<SheetsStatusInfo | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadMessage, setPhotoUploadMessage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadAdminData = useCallback(async (forceSync = false) => {
    setDataError(null);
    try {
      const url = forceSync ? '/api/admin/records?sync=1' : '/api/admin/records';
      const res = await authFetch(url);
      if (res.status === 401) {
        navigate('/iniciar-sesion?motivo=sesion', { replace: true });
        return;
      }
      if (!res.ok) {
        throw new Error('No fue posible cargar los datos del panel.');
      }
      const data = await res.json();
      setRecords(data.records || []);
      setSheetsStatus(data.sheetsStatus || null);
      setSettings(data.settings || null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Error cargando el panel.');
    } finally {
      setLoadingData(false);
    }
  }, [authFetch, navigate]);

  useEffect(() => {
    if (session.authenticated) {
      void loadAdminData(false);
    }
  }, [session.authenticated, loadAdminData]);

  const handleRefreshAll = async () => {
    await Promise.all([loadAdminData(false), refreshPublicData()]);
  };

  const handleSettingsSaved = async (next: SiteSettings) => {
    setSettings(next);
    await refreshPublicData();
  };

  const handleProfilePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setPhotoUploadMessage('Usa una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadMessage('La foto debe pesar máximo 5 MB.');
      return;
    }

    setPhotoUploading(true);
    setPhotoUploadMessage(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
        reader.readAsDataURL(file);
      });
      const response = await authFetch('/api/admin/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la foto.');

      setSettings(data.settings as SiteSettings);
      await refreshPublicData();
      setPhotoUploadMessage(
        data.sheetsWarning
          ? `Foto guardada en el sitio. ${data.sheetsWarning}`
          : 'Foto actualizada en el panel y en el sitio público.'
      );
    } catch (error) {
      setPhotoUploadMessage(error instanceof Error ? error.message : 'Error al cargar la foto.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-sm text-[var(--text-muted)]">
        Verificando credenciales de acceso...
      </div>
    );
  }

  if (!session.authenticated) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  const navItems: { id: AdminModule; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'inicio', label: 'Inicio / Panel', icon: LayoutDashboard },
    { id: 'vida_politica', label: 'Vida política', icon: Landmark },
    { id: 'vida_academica', label: 'Vida académica', icon: BookOpen },
    { id: 'vida_laboral', label: 'Vida laboral', icon: BriefcaseBusiness },
    { id: 'proyectos', label: 'Proyectos', icon: FolderKanban },
    { id: 'base_datos', label: 'Base de datos', icon: Database },
    { id: 'sitio_publico', label: 'Sitio público', icon: Globe },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-ink)]">
      <div className="flex">
      {/* Left Sidebar: toggles exclusively via Camilo's initials avatar (no independent arrow button) */}
      <aside
        aria-label="Navegación del panel privado"
        className={`shrink-0 self-start h-fit border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col transition-[width] duration-200 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Avatar button with Camilo's initials — ONLY toggle control for sidebar */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-expanded={sidebarOpen}
                aria-label={
                  sidebarOpen
                    ? 'Contraer barra lateral del panel'
                    : 'Expandir barra lateral del panel'
                }
                title="Pulsa el avatar para abrir o cerrar la barra lateral"
                className="w-11 h-11 rounded-full overflow-hidden bg-[var(--brand-green)] text-white dark:text-[#0b140f] font-editorial text-base font-semibold tracking-wider flex items-center justify-center shrink-0 border border-[var(--accent-gold)] hover:bg-[var(--brand-green-hover)] transition-colors cursor-pointer"
              >
                {settings?.authorizedPhotoUrl ? (
                  <img src={settings.authorizedPhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  'ACV'
                )}
              </button>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                aria-label={settings?.authorizedPhotoUrl ? 'Cambiar foto de perfil' : 'Cargar foto de perfil'}
                title={settings?.authorizedPhotoUrl ? 'Cambiar foto' : 'Cargar foto'}
                className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full border border-[var(--bg-canvas)] bg-[var(--accent-gold)] text-[#172119] flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-3 h-3" aria-hidden="true" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleProfilePhotoSelected}
              />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-ink)] truncate">
                  Camilo Vidal
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{session.username}</p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="text-[11px] text-[var(--brand-green)] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {photoUploading ? 'Cargando foto…' : settings?.authorizedPhotoUrl ? 'Cambiar foto' : 'Cargar foto'}
                </button>
              </div>
            )}
          </div>
          {photoUploadMessage && (
            <p role="status" className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
              {photoUploadMessage}
            </p>
          )}

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-ink)] border border-[var(--border-hairline)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-ink)]'
                  } ${sidebarOpen ? '' : 'justify-center'}`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-ink)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer border-t border-[var(--border-hairline)] mt-2 pt-4 ${
                sidebarOpen ? '' : 'justify-center'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>Cerrar sesión</span>}
            </button>
          </nav>
        </div>

      </aside>

      {/* Main admin workspace */}
      <div className="flex-1 min-w-0">
        <header className="h-16 px-4 sm:px-6 gap-3 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] flex items-center justify-between">
          <p className="text-xs font-mono-tabular text-[var(--text-muted)] truncate">
            Panel privado / {navItems.find((i) => i.id === activeModule)?.label}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-[var(--text-ink)] hover:text-[var(--brand-green)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="max-w-6xl mx-auto p-6 sm:p-8">
          {loadingData && (
            <div className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
              Cargando información administrativa...
            </div>
          )}

          {dataError && (
            <div
              role="alert"
              className="p-6 rounded-xl border border-[var(--status-error)] bg-[var(--bg-elevated)] text-sm text-[var(--status-error)]"
            >
              {dataError}
            </div>
          )}

          {!loadingData && !dataError && (
            <>
              {activeModule === 'inicio' && settings && (
                <AdminOverviewTab
                  records={records}
                  sheetsStatus={sheetsStatus}
                  settings={settings}
                  onSettingsSaved={handleSettingsSaved}
                />
              )}
              {activeModule === 'vida_politica' && (
                <AdminPoliticalCrudTab records={records} onRefreshAll={handleRefreshAll} />
              )}
              {activeModule === 'vida_academica' && <AdminAcademicCrudTab />}
              {activeModule === 'vida_laboral' && <AdminEmploymentCrudTab />}
              {activeModule === 'proyectos' && <AdminProjectsCrudTab />}
              {activeModule === 'base_datos' && (
                <AdminDatabaseTab
                  authFetch={authFetch}
                />
              )}
              {activeModule === 'sitio_publico' && <AdminPublicSiteTab />}
            </>
          )}
        </main>
      </div>
      </div>
      <SiteFooter session={session} settings={settings} loading={loadingData} error={dataError} />
    </div>
  );
}
