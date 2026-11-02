import React, { useState } from 'react';
import { LogIn, Menu, X } from 'lucide-react';
import { UserAccount } from '../types';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

interface HeaderBarProps {
  currentView: 'agency_site' | 'management_system' | 'prompt_generator';
  setCurrentView: (view: 'agency_site' | 'management_system' | 'prompt_generator') => void;
  publicSection: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos';
  setPublicSection: (sec: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos') => void;
  currentUser: UserAccount;
  onSwitchUser: (userId: string) => void;
  allUsers: UserAccount[];
  onOpenPermissionMatrix: () => void;
  onOpenLoginModal: () => void;
  onNavigateRoute?: (view: 'agency_site' | 'management_system' | 'prompt_generator', sec?: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos', isIngresar?: boolean) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentView,
  setCurrentView,
  publicSection,
  setPublicSection,
  onOpenLoginModal,
  onNavigateRoute,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos') => {
    setCurrentView('agency_site');
    setPublicSection(section);
    if (onNavigateRoute) {
      onNavigateRoute('agency_site', section);
    }
    setMobileMenuOpen(false);
  };

  const handleIngresarClick = () => {
    onOpenLoginModal();
    if (onNavigateRoute) {
      onNavigateRoute('agency_site', publicSection, true);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Agency Title */}
          <div
            onClick={() => handleNavClick('inicio')}
            className="flex items-center gap-3.5 cursor-pointer group py-1"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-cyan-500/40 shadow-md shadow-cyan-500/10 group-hover:scale-105 group-hover:border-cyan-400 transition-all bg-white p-0.5 shrink-0">
              <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Web Studio Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight group-hover:text-cyan-300 transition-colors">
                Nexus Web Studio
              </span>
              <span className="text-[10px] sm:text-[11px] text-cyan-400 font-medium tracking-wide hidden sm:block mt-0.5">
                Full-Stack Web & Mobile Architecture
              </span>
            </div>
          </div>

          {/* Desktop Clean Nav Items - Flush right edge with content grid */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => handleNavClick('inicio')}
              className={`text-xs sm:text-sm font-semibold transition-colors py-1 relative ${
                currentView === 'agency_site' && publicSection === 'inicio'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Inicio
              {currentView === 'agency_site' && publicSection === 'inicio' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('proyectos')}
              className={`text-xs sm:text-sm font-semibold transition-colors py-1 relative ${
                currentView === 'agency_site' && publicSection === 'proyectos'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Nuestros proyectos web
              {currentView === 'agency_site' && publicSection === 'proyectos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('nosotros')}
              className={`text-xs sm:text-sm font-semibold transition-colors py-1 relative ${
                currentView === 'agency_site' && publicSection === 'nosotros'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sobre nosotros
              {currentView === 'agency_site' && publicSection === 'nosotros' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('contactanos')}
              className={`text-xs sm:text-sm font-semibold transition-colors py-1 relative ${
                currentView === 'agency_site' && publicSection === 'contactanos'
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Contáctanos
              {currentView === 'agency_site' && publicSection === 'contactanos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>

            <button
              onClick={handleIngresarClick}
              className="px-4 sm:px-5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
            <button
              onClick={() => handleNavClick('inicio')}
              className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                currentView === 'agency_site' && publicSection === 'inicio'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavClick('proyectos')}
              className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                currentView === 'agency_site' && publicSection === 'proyectos'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Nuestros proyectos web
            </button>
            <button
              onClick={() => handleNavClick('nosotros')}
              className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                currentView === 'agency_site' && publicSection === 'nosotros'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Sobre nosotros
            </button>
            <button
              onClick={() => handleNavClick('contactanos')}
              className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                currentView === 'agency_site' && publicSection === 'contactanos'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              Contáctanos
            </button>
            <button
              onClick={handleIngresarClick}
              className="w-full text-left px-4 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white flex items-center justify-between"
            >
              <span>Ingresar</span>
              <LogIn className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
