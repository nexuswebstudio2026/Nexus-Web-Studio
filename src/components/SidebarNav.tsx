import React, { useState, useEffect } from 'react';
import {
  Building2,
  Inbox,
  DollarSign,
  LifeBuoy,
  Code,
  Smartphone,
  ShieldAlert,
  UserCheck,
  Bot,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  Database,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  MoveVertical,
  X,
} from 'lucide-react';
import { UserAccount, RoleId } from '../types';
import { SYSTEM_ROLES } from '../data/mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

interface SidebarNavProps {
  activeModuleRole: RoleId;
  setActiveModuleRole: (roleId: RoleId) => void;
  currentUser: UserAccount;
  onOpenPermissionMatrix: () => void;
  onLogout: () => void;
  onGoToLanding?: () => void;
  onCloseNav?: () => void;
  onOpenFirebaseCrud?: () => void;
  verticalOffset: number;
  onAdjustOffset: (delta: number) => void;
  sidebarSide: 'left' | 'right';
  onToggleSide: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeModuleRole,
  setActiveModuleRole,
  currentUser,
  onOpenPermissionMatrix,
  onLogout,
  onGoToLanding,
  onCloseNav,
  onOpenFirebaseCrud,
  verticalOffset,
  onAdjustOffset,
  sidebarSide,
  onToggleSide,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [showPosControls, setShowPosControls] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = onSnapshot(
        collection(db, 'contact_messages'),
        (snapshot) => {
          const unread = snapshot.docs.filter((d) => d.data().status === 'unread').length;
          setUnreadInboxCount(unread);
        },
        (err) => console.warn('Sidebar contact_messages notice:', err)
      );
    } catch {}

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleCloseNavigation = () => {
    if (onCloseNav) {
      onCloseNav();
    } else if (onGoToLanding) {
      onGoToLanding();
    }
  };

  const navItems: { id: RoleId; label: string; icon: any; badge?: string }[] = [
    { id: 'admin', label: 'Administración', icon: Building2 },
    { id: 'ai_agents', label: 'Agentes de IA', icon: Bot, badge: 'IA' },
    {
      id: 'inbox',
      label: 'Bandeja de entrada',
      icon: Inbox,
      badge: unreadInboxCount > 0 ? `${unreadInboxCount} N` : undefined,
    },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside
      style={{ top: `${verticalOffset}px` }}
      className={`bg-slate-950 border border-slate-800/90 rounded-3xl flex flex-col justify-between transition-all duration-300 shrink-0 select-none z-30 w-full md:sticky md:h-[calc(100vh-2rem)] shadow-2xl ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div className="p-3.5 space-y-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-center pb-3 border-b border-slate-800/80">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none w-full p-1 rounded-xl hover:bg-slate-900/60 transition-colors"
              title="Clic en el logo para colapsar/expandir el menú"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/50 bg-white p-0.5 shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:border-cyan-300 transition-all">
                <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black tracking-wider uppercase text-white group-hover:text-cyan-300 transition-colors truncate">NEXUS PANEL</span>
                <span className="text-[10px] text-cyan-400 font-semibold truncate">Sistema de Gestión</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center pb-3 border-b border-slate-800/80">
            {/* Logo Centered in Collapsed Mode */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400 bg-white p-0.5 shadow-lg shadow-cyan-500/30 cursor-pointer hover:scale-110 hover:border-cyan-300 transition-all focus:outline-none"
              title="Clic en el logo para expandir el menú"
            >
              <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Logo" className="w-full h-full object-contain rounded-lg" />
            </button>
          </div>
        )}

        {/* Position adjustment toolbar popover */}
        {showPosControls && (
          <div className="p-2.5 bg-slate-900/95 border border-amber-500/40 rounded-2xl space-y-2 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 font-mono">
              <span>POSICIÓN SIDEBAR</span>
              <span>{verticalOffset}px</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => onAdjustOffset(-20)}
                className="py-1 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                title="Subir sidebar (Reducir margen top)"
              >
                <ArrowUp className="w-3 h-3 text-amber-400" />
                <span>Subir</span>
              </button>
              <button
                onClick={() => onAdjustOffset(20)}
                className="py-1 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                title="Bajar sidebar (Aumentar margen top)"
              >
                <ArrowDown className="w-3 h-3 text-amber-400" />
                <span>Bajar</span>
              </button>
              <button
                onClick={onToggleSide}
                className="py-1 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                title="Mover lado (Izquierda / Derecha)"
              >
                <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                <span>{sidebarSide === 'left' ? 'Der.' : 'Izq.'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Nav Items List */}
        <nav className="grid grid-cols-2 sm:flex sm:flex-wrap md:block gap-1.5 md:gap-0 md:space-y-1">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeModuleRole === item.id;
            const isUserDefaultRole = currentUser.role === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === ('website' as RoleId)) {
                    handleCloseNavigation();
                  } else {
                    setActiveModuleRole(item.id);
                  }
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.id === 'firebase_crud' ? 'text-amber-400' : 'text-purple-400'}`} />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && isUserDefaultRole && (
                  <span
                    className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"
                    title="Rol por defecto asignado a tu cuenta"
                  />
                )}

                {!isCollapsed && item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 font-bold ${
                    item.id === 'firebase_crud'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-purple-950 text-cyan-300 border border-purple-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Account Context & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 rounded-b-3xl space-y-2">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Clickable Profile Card -> Configuración & Base de Datos */}
            <div
              onClick={() => {
                if (onOpenFirebaseCrud) {
                  onOpenFirebaseCrud();
                } else {
                  setActiveModuleRole('settings');
                }
              }}
              className="flex items-center gap-2.5 p-2 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 rounded-xl cursor-pointer transition-all group shadow-md"
              title="Haz clic en tu perfil para abrir Configuración y Base de Datos"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover border border-purple-500/40 shrink-0 group-hover:border-purple-400 transition-colors"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate flex items-center justify-between">
                  <span className="truncate">{currentUser.name}</span>
                  <Settings className="w-3 h-3 text-purple-400 shrink-0 ml-1 opacity-80 group-hover:opacity-100" />
                </p>
                <p className="text-[10px] text-purple-300 font-mono truncate">
                  Rol: {SYSTEM_ROLES.find((r) => r.id === currentUser.role)?.name || 'Usuario'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onOpenPermissionMatrix}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                title="Matriz de Permisos RBAC"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Permisos</span>
              </button>

              {onGoToLanding && (
                <button
                  onClick={onGoToLanding}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Ver sitio web público"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sitio Web</span>
                </button>
              )}
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-900/90 to-red-900/90 hover:from-rose-800 hover:to-red-800 border border-rose-700/60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/50 hover:shadow-rose-900/40"
            >
              <LogOut className="w-4 h-4 text-rose-200" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (onOpenFirebaseCrud) onOpenFirebaseCrud();
                else setActiveModuleRole('settings');
              }}
              className="w-full p-2 bg-slate-900 hover:bg-purple-950 border border-slate-800 hover:border-purple-500 text-purple-400 rounded-xl flex items-center justify-center transition-colors"
              title="Abrir Configuración y Base de Datos (Clic en perfil)"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenPermissionMatrix}
              className="w-full p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center transition-colors"
              title="Ver permisos RBAC"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </button>

            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="w-full p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center transition-colors"
                title="Ver sitio web público"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="w-full p-2 bg-rose-900/90 hover:bg-rose-800 border border-rose-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-rose-200" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
