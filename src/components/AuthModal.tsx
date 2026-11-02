import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Building,
  Briefcase,
} from 'lucide-react';
import { UserAccount, RoleId } from '../types';
import { SYSTEM_ROLES } from '../data/mockData';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  onRegisterUser,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regRole, setRegRole] = useState<RoleId>('web_dev');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (matchedUser) {
      onLoginSuccess(matchedUser);
      onClose();
    } else {
      const defaultAdmin = users[0];
      onLoginSuccess(defaultAdmin);
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) return;

    const initialPermissions: Record<string, boolean> = {};
    if (regRole === 'admin') {
      users[0].permissions && Object.keys(users[0].permissions).forEach((k) => (initialPermissions[k] = true));
    } else {
      initialPermissions['users.view'] = true;
      if (regRole === 'web_dev') initialPermissions['web.view_sprint'] = true;
      if (regRole === 'accounting') initialPermissions['finance.issue_invoices'] = true;
      if (regRole === 'support') initialPermissions['tickets.reply'] = true;
    }

    const newUserObj = {
      name: regName,
      email: regEmail,
      jobTitle: regJobTitle || 'Ingeniero de Software',
      department: regDepartment || 'Desarrollo',
      role: regRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      permissions: initialPermissions,
    };

    onRegisterUser(newUserObj);
    onClose();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header with Official Logo & Title */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-cyan-500/40 shadow-lg mb-3 bg-white p-1">
            <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Web Studio Logo" className="w-full h-full object-contain rounded-xl" />
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">Nexus Web Studio</h2>
          <p className="text-xs text-cyan-400 font-medium mt-0.5">Acceso al Sistema de Gestión de Proyectos</p>

          {/* Tab Controls */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 mt-4 text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                authMode === 'login' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                authMode === 'register' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrar Usuario
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* LOGIN MODE */}
          {authMode === 'login' && (
            <div className="space-y-4">
              {/* Quick Admin Access Button */}
              <button
                type="button"
                onClick={() => {
                  const adminUser = users.find((u) => u.role === 'admin') || users[0];
                  onLoginSuccess(adminUser);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50 text-purple-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all group shadow-md"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Acceso Rápido Administrador (admin)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                  Super Admin
                </span>
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-mono tracking-wider my-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span>O ingresa tus credenciales</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setLoginError('');
                const inputClean = email.trim().toLowerCase();
                const matchedUser = users.find((u) =>
                  u.email.toLowerCase() === inputClean ||
                  u.name.toLowerCase().includes(inputClean) ||
                  (inputClean === 'admin' && u.role === 'admin')
                );
                if (matchedUser) {
                  onLoginSuccess(matchedUser);
                  onClose();
                } else if (inputClean.includes('admin') || inputClean === '') {
                  const defaultAdmin = users.find((u) => u.role === 'admin') || users[0];
                  onLoginSuccess(defaultAdmin);
                  onClose();
                } else {
                  setLoginError('Usuario o correo no encontrado. Ingrese "admin" o seleccione acceso rápido.');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Usuario o Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="admin o correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot_password');
                        setForgotSuccess(false);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="admin o tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {loginError && <p className="text-xs text-rose-400 font-medium">{loginError}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </button>
              </form>
            </div>
          )}

          {/* REGISTER MODE */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="ej. Ing. Fernando Soto"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="fernando.soto@nexusstudio.dev"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    placeholder="Frontend Engineer"
                    value={regJobTitle}
                    onChange={(e) => setRegJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Rol Deseado</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as RoleId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta e Ingresar</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD MODE */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Enlace Enviado Exitosamente</h3>
                  <p className="text-xs text-slate-300">
                    Se han enviado las instrucciones de recuperación a <strong>{forgotEmail}</strong>.
                  </p>
                  <button
                    onClick={() => setAuthMode('login')}
                    className="mt-2 text-xs font-semibold text-cyan-400 hover:underline block mx-auto"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Ingrese su correo registrado. Le enviaremos un enlace seguro para restablecer su contraseña.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Registrado</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="usuario@nexusstudio.dev"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Enlace de Recuperación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-xs text-slate-400 hover:text-white font-medium text-center block pt-1"
                  >
                    Regresar al Login
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
