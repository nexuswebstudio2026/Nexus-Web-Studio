import React, { useState } from 'react';
import {
  Code,
  Database,
  Kanban,
  GitBranch,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  Server,
  AlertCircle,
} from 'lucide-react';
import { UserAccount, SprintTask } from '../../types';

interface WebDevModuleProps {
  currentUser: UserAccount;
  tasks: SprintTask[];
  onAddTask: (newTask: Omit<SprintTask, 'id'>) => void;
  onUpdateTaskStatus: (taskId: string, status: SprintTask['status']) => void;
}

export const WebDevModule: React.FC<WebDevModuleProps> = ({
  currentUser,
  tasks,
  onAddTask,
  onUpdateTaskStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'sprint' | 'db_schema' | 'api_endpoints'>('sprint');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPlatform, setTaskPlatform] = useState<SprintTask['platform']>('web');

  const canManageDb = currentUser.permissions['web.manage_db'];
  const canCreateTasks = currentUser.permissions['web.create_tasks'];

  const webTasks = tasks.filter((t) => t.platform === 'web' || t.platform === 'backend' || t.platform === 'database');

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    onAddTask({
      taskNumber: `DEV-${Math.floor(200 + Math.random() * 800)}`,
      title: taskTitle,
      projectName: 'NeoBank Web Ecosystem',
      platform: taskPlatform,
      assigneeName: currentUser.name,
      status: 'in_progress',
      priority: 'high',
      estimatedHours: 16,
      loggedHours: 4,
    });

    setTaskTitle('');
    setShowAddTaskModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-blue-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Módulo de Desarrollo Web & Backend
            </span>
            <span className="text-xs text-slate-400 font-mono">Arquitecto: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Ingeniería Web, Base de Datos PostgreSQL & API REST
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestión de Sprints Kanban, administración de esquemas relacionales Drizzle/PostgreSQL y endpoints de microservicios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateTasks && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Tarea Web</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('sprint')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sprint' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span>Tablero Kanban Sprint Web</span>
        </button>

        <button
          onClick={() => setActiveTab('db_schema')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'db_schema' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Esquema PostgreSQL / Migraciones</span>
        </button>

        <button
          onClick={() => setActiveTab('api_endpoints')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'api_endpoints' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Catálogo Endpoints API REST</span>
        </button>
      </div>

      {/* Tab 1: Kanban Sprint Board */}
      {activeTab === 'sprint' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'in_progress', label: 'En Progreso (In Progress)', color: 'text-blue-400 border-blue-800' },
            { id: 'code_review', label: 'Revisión de Código (PR)', color: 'text-purple-400 border-purple-800' },
            { id: 'qa', label: 'Pruebas QA Staging', color: 'text-amber-400 border-amber-800' },
            { id: 'done', label: 'Completado (Done)', color: 'text-emerald-400 border-emerald-800' },
          ].map((col) => {
            const colTasks = webTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                <div className={`flex items-center justify-between pb-2 border-b ${col.color}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color.split(' ')[0]}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.2 rounded bg-slate-950 text-slate-400 font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-blue-400 font-bold">{t.taskNumber}</span>
                        <span className="text-[10px] font-mono uppercase text-slate-400">{t.platform}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{t.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>{t.assigneeName}</span>
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTaskStatus(t.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-blue-300 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          <option value="in_progress">In Progress</option>
                          <option value="code_review">Code Review</option>
                          <option value="qa">QA</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: PostgreSQL DB Schema */}
      {activeTab === 'db_schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Esquema de Base de Datos PostgreSQL (Drizzle ORM)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Estructura de tablas del sistema RBAC, usuarios, roles, permisos granulares y proyectos.
              </p>
            </div>

            {canManageDb ? (
              <button
                onClick={() => alert('Ejecutando `drizzle-kit push` a PostgreSQL en Cloud SQL...')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30"
              >
                Ejecutar Migración DDL
              </button>
            ) : (
              <div className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Sin permiso (web.manage_db)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs space-y-2">
              <span className="text-purple-400 font-bold block">TABLE users</span>
              <ul className="text-slate-400 space-y-1 text-[11px]">
                <li className="text-emerald-400">id: varchar(36) PRIMARY KEY</li>
                <li>name: text NOT NULL</li>
                <li>email: text UNIQUE NOT NULL</li>
                <li>role_id: text REFERENCES roles(id)</li>
                <li>permissions: jsonb DEFAULT '{}'</li>
                <li>created_at: timestamp</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs space-y-2">
              <span className="text-purple-400 font-bold block">TABLE roles & rbac_permissions</span>
              <ul className="text-slate-400 space-y-1 text-[11px]">
                <li className="text-emerald-400">id: varchar(36) PRIMARY KEY</li>
                <li>name: text NOT NULL</li>
                <li>default_module: text NOT NULL</li>
                <li>available_modules: jsonb</li>
                <li>created_at: timestamp</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs space-y-2">
              <span className="text-purple-400 font-bold block">TABLE projects & invoices</span>
              <ul className="text-slate-400 space-y-1 text-[11px]">
                <li className="text-emerald-400">id: varchar(36) PRIMARY KEY</li>
                <li>client_name: text NOT NULL</li>
                <li>budget: numeric(12,2)</li>
                <li>spent: numeric(12,2)</li>
                <li>tech_stack: text[]</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: REST API Endpoints */}
      {activeTab === 'api_endpoints' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Catálogo de Endpoints API Backend (Express / Node.js)</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            {[
              { method: 'GET', path: '/api/v1/auth/me', desc: 'Obtiene el usuario autenticado y su mapa de permisos granulares' },
              { method: 'POST', path: '/api/v1/rbac/permissions/update', desc: 'Actualiza banderas de permisos por usuario (Requiere permiso users.manage_permissions)' },
              { method: 'GET', path: '/api/v1/projects', desc: 'Lista los proyectos web y móviles según el rol asignado' },
              { method: 'POST', path: '/api/v1/finance/invoices', desc: 'Genera factura fiscal (Requiere permiso finance.issue_invoices)' },
            ].map((ep, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-950 text-blue-300 border border-blue-800 rounded font-bold text-[11px]">
                    {ep.method}
                  </span>
                  <span className="text-white font-semibold">{ep.path}</span>
                </div>
                <span className="text-slate-400 text-[11px] truncate">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Crear Nueva Tarea Web / Backend</h3>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Crear endpoint GraphQL para transacciones"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Capa Tecnológica</label>
                <select
                  value={taskPlatform}
                  onChange={(e) => setTaskPlatform(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="web">Web Frontend (React 19)</option>
                  <option value="backend">Backend (Node.js Express API)</option>
                  <option value="database">Base de Datos PostgreSQL</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
