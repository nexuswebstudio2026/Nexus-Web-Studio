import React from 'react';
import {
  ShieldCheck,
  Users,
  AlertCircle,
  UserPlus,
  User,
} from 'lucide-react';
import { UserAccount, Project, RoleId } from '../../types';
import { SYSTEM_ROLES } from '../../data/mockData';

interface AdminModuleProps {
  currentUser: UserAccount;
  users: UserAccount[];
  projects?: Project[];
  onOpenPermissions: () => void;
  onUpdateUserRole: (userId: string, role: RoleId) => void;
  onOpenUserProfile: (user: UserAccount) => void;
  onAddProject?: (newPrj: Omit<Project, 'id'>) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  currentUser,
  users,
  onOpenPermissions,
  onUpdateUserRole,
  onOpenUserProfile,
}) => {
  const canManageRoles = currentUser.permissions['users.manage_roles'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-purple-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Panel de Administración
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión de Usuarios y Permisos del Sistema
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Control de usuarios registrados, asignación de roles primarios y edición de datos de perfil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenUserProfile(currentUser)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-amber-300" />
            <span>Mi Perfil ({currentUser.name})</span>
          </button>

          <button
            onClick={async () => {
              const { seedFirestoreDatabase } = await import('../../lib/seedDatabase');
              const res = await seedFirestoreDatabase();
              if (res.success) {
                alert(`🔥 ¡Base de Datos Firestore poblada exitosamente con ${res.count} documentos!`);
              } else {
                alert(`Error al poblar Firestore: ${res.error}`);
              }
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all font-mono cursor-pointer"
            title="Sincronizar todos los datos iniciales directamente a Google Cloud Firestore"
          >
            <span>🔥 Sincronizar Datos a Firestore</span>
          </button>

          <button
            onClick={onOpenPermissions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriz de Permisos Granulares</span>
          </button>
        </div>
      </div>

      {/* Users & Roles Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Gestión de Usuarios y Roles del Sistema ({users.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Haz clic en cualquier usuario para abrir y editar sus datos personales, correo, teléfono y permisos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenUserProfile(currentUser)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear / Editar Usuarios</span>
            </button>

            <button
              onClick={onOpenPermissions}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Permisos RBAC</span>
            </button>
          </div>
        </div>

        {!canManageRoles && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Su usuario actual no posee el permiso <code>users.manage_roles</code>. Las opciones de cambio de rol están deshabilitadas hasta que un administrador las otorgue.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Usuario / Colaborador</th>
                <th className="pb-3">Contacto / Teléfono</th>
                <th className="pb-3">Departamento / Cargo</th>
                <th className="pb-3">Rol del Sistema</th>
                <th className="pb-3">Permisos RBAC</th>
                <th className="pb-3 text-right">Acción Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const roleDef = SYSTEM_ROLES.find((r) => r.id === u.role) || SYSTEM_ROLES[0];
                const activePermCount = Object.values(u.permissions || {}).filter(Boolean).length;
                const totalPerms = Object.keys(u.permissions || {}).length;

                return (
                  <tr
                    key={u.id}
                    onClick={() => onOpenUserProfile(u)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover border border-purple-500/40 group-hover:border-amber-400 transition-colors" />
                        <div>
                          <p className="font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                            {u.name} {u.id === currentUser.id && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">(Tú)</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 font-mono text-[11px] text-emerald-400">
                      {u.phone || '+57 304 3470984'}
                    </td>

                    <td className="py-3">
                      <p className="font-medium text-slate-200">{u.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">{u.department}</p>
                    </td>

                    <td className="py-3" onClick={(e) => e.stopPropagation()}>
                      {canManageRoles ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateUserRole(u.id, e.target.value as RoleId)}
                          className="bg-slate-950 border border-slate-700 text-purple-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          {SYSTEM_ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded border font-mono text-[11px] ${roleDef.badgeColor}`}>
                          {roleDef.name}
                        </span>
                      )}
                    </td>

                    <td className="py-3 font-mono">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-purple-300">
                        {activePermCount} / {totalPerms || 24} permisos
                      </span>
                    </td>

                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenUserProfile(u)}
                        className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver / Editar Perfil</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
