import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  FolderPlus,
  Plus,
  TrendingUp,
  Activity,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code,
  DollarSign,
  Sliders,
  Trash2,
} from 'lucide-react';
import { UserAccount, Project, RoleId } from '../../types';
import { SYSTEM_ROLES } from '../../data/mockData';

interface AdminModuleProps {
  currentUser: UserAccount;
  users: UserAccount[];
  projects: Project[];
  onOpenPermissions: () => void;
  onUpdateUserRole: (userId: string, role: RoleId) => void;
  onAddProject: (newPrj: Omit<Project, 'id'>) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  currentUser,
  users,
  projects,
  onOpenPermissions,
  onUpdateUserRole,
  onAddProject,
  onDeleteProject,
}) => {
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState<'web' | 'mobile' | 'fullstack'>('fullstack');
  const [budget, setBudget] = useState(35000);

  const canManageRoles = currentUser.permissions['users.manage_roles'];
  const canManagePermissions = currentUser.permissions['users.manage_permissions'];

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !clientName) return;

    onAddProject({
      name: projectName,
      code: projectName.toUpperCase().slice(0, 4) + '-DEV',
      clientName,
      type: projectType,
      status: 'in_development',
      progress: 15,
      budget: Number(budget),
      spent: 5000,
      startDate: new Date().toISOString().split('T')[0],
      deadline: '2027-02-28',
      techStack: ['React 19', 'Node.js', 'PostgreSQL'],
      team: ['usr_web_dev', 'usr_mobile_dev'],
      repoUrl: `github.com/nexusstudio/${projectName.toLowerCase().replace(/\s+/g, '-')}`,
    });

    setProjectName('');
    setClientName('');
    setShowAddProjectModal(false);
  };

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-purple-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Panel de Administración General
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Control de Administración & Dirección Ejecutiva
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestión global de usuarios, asignación de roles primarios y control de permisos granulares por módulo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              const { seedFirestoreDatabase } = await import('../../lib/seedDatabase');
              const res = await seedFirestoreDatabase();
              if (res.success) {
                alert(`🔥 ¡Base de Datos Firestore poblada exitosamente con ${res.count} documentos en 5 colecciones! Refresca tu consola de Firebase.`);
              } else {
                alert(`Error al poblar Firestore: ${res.error}`);
              }
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all font-mono"
            title="Sincronizar todos los datos iniciales directamente a Google Cloud Firestore"
          >
            <span>🔥 Sincronizar Datos a Firestore</span>
          </button>
          <button
            onClick={onOpenPermissions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriz de Permisos Granulares</span>
          </button>
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Presupuesto Total Proyectos</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalBudget.toLocaleString()} USD
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>3 Proyectos Activos</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Usuarios & Roles Activos</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {users.length} Colaboradores
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>7 Roles Departamentales</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Módulos de Sistema</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            7 Módulos
          </div>
          <div className="text-[11px] text-blue-400">
            Admin, Contabilidad, Soporte, Web, Móvil, QA, Cliente
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Estado del Servidor</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            99.98% Uptime
          </div>
          <div className="text-[11px] text-slate-400">
            Google Cloud Run & Cloud SQL PostgreSQL
          </div>
        </div>

      </div>

      {/* Users & Roles Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Gestión de Usuarios y Roles del Sistema</span>
            </h2>
            <p className="text-xs text-slate-400">
              Modifique el rol primario o active la edición de permisos individuales por bandera booleana.
            </p>
          </div>

          <button
            onClick={onOpenPermissions}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Editar Permisos Granulares</span>
          </button>
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
                <th className="pb-3">Departamento / Cargo</th>
                <th className="pb-3">Rol del Sistema</th>
                <th className="pb-3">Permisos Activos</th>
                <th className="pb-3 text-right">Acciones RBAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const roleDef = SYSTEM_ROLES.find((r) => r.id === u.role) || SYSTEM_ROLES[0];
                const activePermCount = Object.values(u.permissions).filter(Boolean).length;
                const totalPerms = Object.keys(u.permissions).length;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <p className="font-medium text-slate-200">{u.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">{u.department}</p>
                    </td>

                    <td className="py-3">
                      {canManageRoles ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateUserRole(u.id, e.target.value as RoleId)}
                          className="bg-slate-950 border border-slate-700 text-purple-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500"
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

                    <td className="py-3 text-right">
                      <button
                        onClick={onOpenPermissions}
                        className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 rounded-lg text-xs font-medium transition-all"
                      >
                        Matriz RBAC
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Proyectos Web & Móvil en Desarrollo</span>
          </h2>
          <span className="text-xs text-slate-400">{projects.length} Registrados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400 font-bold">[{p.code}]</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                    {p.type}
                  </span>
                  {onDeleteProject && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Desea eliminar el proyecto "${p.name}" de Cloud Firestore?`)) {
                          onDeleteProject(p.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                      title="Eliminar de la base de datos Firestore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                <p className="text-xs text-slate-400">{p.clientName}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progreso</span>
                  <span className="font-mono text-white">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Presupuesto: <strong className="text-white font-mono">${p.budget.toLocaleString()}</strong></span>
                <span>Entrega: <strong className="text-white font-mono">{p.deadline}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Registrar Nuevo Proyecto Full-Stack</h3>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Billetera Virtual Crypto"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. FinTech Latam S.A."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tipo de Proyecto</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="fullstack">Full-Stack (Web + Móvil + Backend + DB)</option>
                  <option value="web">Plataforma Web (Frontend + Backend REST)</option>
                  <option value="mobile">Aplicación Móvil (iOS & Android Native)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Presupuesto (USD)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
