import { RoleId } from '../types';

export interface NavigationItem {
  id: RoleId;
  label: string;
  badge?: string;
}

export function getModuleTitle(role: RoleId | string): string {
  switch (role) {
    case 'admin':
      return 'Administración';
    case 'ai_agents':
      return 'Agentes de IA';
    case 'inbox':
      return 'Bandeja de entrada';
    case 'settings':
    case 'firebase_crud':
      return 'Configuración';
    case 'accounting':
      return 'Contabilidad';
    case 'support':
      return 'Soporte';
    case 'web_dev':
      return 'Desarrollo Web';
    case 'mobile_dev':
      return 'Desarrollo Móvil';
    case 'qa_devops':
      return 'QA & DevOps';
    case 'client':
      return 'Portal de Cliente';
    default:
      return 'Panel de Gestión';
  }
}

export function computeSidebarClasses(params: {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  sidebarSide: 'left' | 'right';
}): {
  asideClasses: string;
  backdropClasses: string;
} {
  const { isMobileOpen, isCollapsed, sidebarSide } = params;

  const sideBorder = sidebarSide === 'right' ? 'border-l right-0' : 'border-r left-0';
  const slideAnimation = sidebarSide === 'right' ? 'slide-in-from-right' : 'slide-in-from-left';

  const asideClasses = [
    'bg-slate-950',
    'select-none',
    'transition-all',
    'duration-300',
    // Mobile classes:
    isMobileOpen
      ? `fixed inset-y-0 ${sideBorder} z-50 flex flex-col w-[85%] max-w-xs sm:max-w-sm h-full max-h-screen border-slate-800 shadow-2xl overflow-y-auto animate-in ${slideAnimation}`
      : 'hidden',
    // Desktop classes:
    'md:flex',
    'md:relative',
    'md:inset-auto',
    'md:z-30',
    'md:flex-col',
    'md:justify-between',
    'md:sticky',
    'md:h-[calc(100vh-2rem)]',
    'md:rounded-3xl',
    'md:border',
    'md:border-slate-800/90',
    'md:shadow-2xl',
    'md:overflow-visible',
    'md:shrink-0',
    isCollapsed ? 'md:w-20' : 'md:w-64',
  ].join(' ');

  const backdropClasses = isMobileOpen
    ? 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 animate-in fade-in'
    : 'hidden';

  return {
    asideClasses,
    backdropClasses,
  };
}
