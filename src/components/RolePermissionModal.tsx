import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Check,
  UserPlus,
  Lock,
  Unlock,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { UserAccount, RoleId } from '../types';
import { SYSTEM_ROLES, PERMISSION_DEFINITIONS } from '../data/mockData';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  activeUser: UserAccount;
  onUpdateUserPermissions: (userId: string, permissions: Record<string, boolean>) => void;
  onUpdateUserRole: (userId: string, role: RoleId) => void;
  onAddUser: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => void;
}

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUser,
  onUpdateUserPermissions,
  onUpdateUserRole,
  onAddUser,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(activeUser.id);
  const [activeTab, setActiveTab] = useState<'matrix' | 'add_user'>('matrix');

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserJobTitle, setNewUserJobTitle] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserRole, setNewUserRole] = useState<RoleId>('web_dev');

  if (!isOpen) return null;

  const targetUser = users.find((u) => u.id === selectedUserId) || activeUser;
  const targetRoleDef = SYSTEM_ROLES.find((r) => r.id === targetUser.role) || SYSTEM_ROLES[0];

  const categories = Array.from(new Set(PERMISSION_DEFINITIONS.map((p) => p.category)));

  const handleTogglePermission = (permissionKey: string) => {
    const updated = {
      ...targetUser.permissions,
      [permissionKey]: !targetUser.permissions[permissionKey],
    };
    onUpdateUserPermissions(targetUser.id, updated);
  };

  const handleSelectAll = (category: string) => {
    const categoryKeys = PERMISSION_DEFINITIONS.filter((p) => p.category === category).map((p) => p.key);
    const updated = { ...targetUser.permissions };
    categoryKeys.forEach((key) => {
      updated[key] = true;
    });
    onUpdateUserPermissions(targetUser.id, updated);
  };

  const handleDeselectAll = (category: string) => {
    const categoryKeys = PERMISSION_DEFINITIONS.filter((p) => p.category === category).map((p) => p.key);
    const updated = { ...targetUser.permissions };
    categoryKeys.forEach((key) => {
      updated[key] = false;
    });
    onUpdateUserPermissions(targetUser.id, updated);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    // Create default permissions based on role
    const initialPermissions: Record<string, boolean> = {};
    PERMISSION_DEFINITIONS.forEach((p) => {
      // Admin gets all, others get specific categories
      if (newUserRole === 'admin') initialPermissions[p.key] = true;
      else if (newUserRole === 'accounting' && p.category.includes('Finanzas')) initialPermissions[p.key] = true;
      else if (newUserRole === 'support' && p.category.includes('Soporte')) initialPermissions[p.key] = true;
      else if (newUserRole === 'web_dev' && p.category.includes('Web')) initialPermissions[p.key] = true;
      else if (newUserRole === 'mobile_dev' && p.category.includes('Móvil')) initialPermissions[p.key] = true;
      else if (newUserRole === 'qa_devops' && p.category.includes('QA')) initialPermissions[p.key] = true;
      else if (newUserRole === 'client' && p.category.includes('Cliente')) initialPermissions[p.key] = true;
      else initialPermissions[p.key] = false;
    });

    onAddUser({
      name: newUserName,
      email: newUserEmail,
      jobTitle: newUserJobTitle || 'Especialista',
      department: newUserDepartment || 'Desarrollo',
      role: newUserRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      permissions: initialPermissions,
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserJobTitle('');
    setNewUserDepartment('');
    setActiveTab('matrix');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 border border-purple-700/40 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gestión de Permisos Granulares (RBAC)
              </h2>
              <p className="text-xs text-slate-400">
                Configure acceso módulo por módulo y controles específicos por usuario en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'border-purple-500 text-purple-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Matriz por Usuario ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('add_user')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'add_user'
                  ? 'border-purple-500 text-purple-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'matrix' ? (
            <>
              {/* Target User Selector Strip */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={targetUser.avatar}
                    alt={targetUser.name}
                    className="w-12 h-12 rounded-xl object-cover border border-purple-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="bg-slate-900 text-white font-semibold text-sm rounded-lg border border-slate-700 px-3 py-1 focus:outline-none focus:border-purple-500"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.jobTitle})
                          </option>
                        ))}
                      </select>

                      <span className={`text-xs px-2 py-0.5 rounded border font-mono ${targetRoleDef.badgeColor}`}>
                        {targetRoleDef.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {targetUser.email} · {targetUser.department}
                    </p>
                  </div>
                </div>

                {/* Primary Role Selector */}
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-xs font-medium text-slate-400">Rol Principal:</span>
                  <select
                    value={targetUser.role}
                    onChange={(e) => onUpdateUserRole(targetUser.id, e.target.value as RoleId)}
                    className="bg-slate-800 text-xs font-medium text-purple-300 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Granular Permission Categories */}
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryPermissions = PERMISSION_DEFINITIONS.filter((p) => p.category === category);
                  const activeCount = categoryPermissions.filter((p) => targetUser.permissions[p.key]).length;

                  return (
                    <div key={category} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <h3 className="text-sm font-bold text-white">{category}</h3>
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-800/60">
                            {activeCount}/{categoryPermissions.length} Activos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            onClick={() => handleSelectAll(category)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Activar Todos
                          </button>
                          <span className="text-slate-600">·</span>
                          <button
                            onClick={() => handleDeselectAll(category)}
                            className="text-slate-500 hover:text-slate-400 font-medium"
                          >
                            Desactivar Todos
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((perm) => {
                          const isEnabled = !!targetUser.permissions[perm.key];
                          return (
                            <div
                              key={perm.key}
                              onClick={() => handleTogglePermission(perm.key)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                isEnabled
                                  ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-500'
                                  : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
                                    {perm.label}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500">[{perm.key}]</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 leading-tight">{perm.description}</p>
                              </div>

                              <button
                                type="button"
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isEnabled ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isEnabled ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Add User Form */
            <form onSubmit={handleCreateUserSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="text-center pb-4">
                <h3 className="text-base font-bold text-white">Añadir Nuevo Usuario al Sistema</h3>
                <p className="text-xs text-slate-400">
                  Cree una cuenta para un nuevo colaborador o cliente con su rol correspondiente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Dra. Lucía Fernández"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="lucia.fernandez@nexusstudio.dev"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    placeholder="ej. Lead Backend Engineer"
                    value={newUserJobTitle}
                    onChange={(e) => setNewUserJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Departamento</label>
                  <input
                    type="text"
                    placeholder="ej. Desarrollo Web"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rol Inicial del Sistema</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as RoleId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Usuario y Asignar Permisos</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Los cambios en permisos se aplican inmediatamente a la interfaz interactiva.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
          >
            Listo / Guardar
          </button>
        </div>

      </div>
    </div>
  );
};
