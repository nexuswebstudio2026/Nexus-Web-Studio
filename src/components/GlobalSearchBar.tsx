import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FolderGit2,
  LifeBuoy,
  CheckSquare,
  Receipt,
  User,
  ArrowRight,
  Sparkles,
  Calendar,
  Activity,
  DollarSign,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Project, SupportTicket, SprintTask, Invoice, RoleId } from '../types';

interface GlobalSearchBarProps {
  projects: Project[];
  tickets: SupportTicket[];
  tasks: SprintTask[];
  invoices: Invoice[];
  onSelectModule?: (roleId: RoleId) => void;
}

type SearchResultItem =
  | { type: 'project'; data: Project }
  | { type: 'ticket'; data: SupportTicket }
  | { type: 'task'; data: SprintTask }
  | { type: 'invoice'; data: Invoice };

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  projects,
  tickets,
  tasks,
  invoices,
  onSelectModule,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<SearchResultItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedPreview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search filtering across datasets
  const cleanQuery = query.trim().toLowerCase();

  const matchedProjects = cleanQuery
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.code.toLowerCase().includes(cleanQuery) ||
          p.clientName.toLowerCase().includes(cleanQuery) ||
          p.techStack.some((t) => t.toLowerCase().includes(cleanQuery)) ||
          (p.description && p.description.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchedTickets = cleanQuery
    ? tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(cleanQuery) ||
          t.ticketNumber.toLowerCase().includes(cleanQuery) ||
          t.clientName.toLowerCase().includes(cleanQuery) ||
          t.category.toLowerCase().includes(cleanQuery) ||
          t.assignee.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedTasks = cleanQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQuery) ||
          t.taskNumber.toLowerCase().includes(cleanQuery) ||
          t.projectName.toLowerCase().includes(cleanQuery) ||
          t.assigneeName.toLowerCase().includes(cleanQuery) ||
          t.platform.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedInvoices = cleanQuery
    ? invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          i.clientName.toLowerCase().includes(cleanQuery) ||
          i.project.toLowerCase().includes(cleanQuery) ||
          i.amount.toString().includes(cleanQuery)
      )
    : [];

  const totalMatches =
    matchedProjects.length + matchedTickets.length + matchedTasks.length + matchedInvoices.length;

  const handleItemClick = (item: SearchResultItem) => {
    setSelectedPreview(item);
    if (onSelectModule) {
      if (item.type === 'project') onSelectModule('admin');
      else if (item.type === 'ticket') onSelectModule('support');
      else if (item.type === 'task') onSelectModule('web_dev');
      else if (item.type === 'invoice') onSelectModule('accounting');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_development':
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">En Desarrollo</span>;
      case 'deployed':
      case 'resolved':
      case 'done':
      case 'paid':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">Completado / Pagado</span>;
      case 'planning':
      case 'open':
      case 'pending':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">Pendiente / Plan</span>;
      case 'urgent':
      case 'critical':
      case 'overdue':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">Crítico / Vencido</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-semibold">{status}</span>;
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Search Input Control */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar proyectos, tickets, tareas o facturas por palabra clave... (Ctrl + K)"
          className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 rounded-2xl pl-10 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setSelectedPreview(null);
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:flex items-center gap-1 absolute right-3 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-md pointer-events-none">
            Ctrl + K
          </kbd>
        )}
      </div>

      {/* Instant Filter Dropdown Results */}
      {isOpen && cleanQuery && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] flex flex-col"
        >
          {/* Results Summary Bar */}
          <div className="px-4 py-2.5 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
            <span className="font-semibold text-slate-300">
              Resultados para <span className="text-cyan-400">"{cleanQuery}"</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800 font-bold">
              {totalMatches} coincidencias
            </span>
          </div>

          <div className="overflow-y-auto p-2 space-y-4 flex-1">
            {totalMatches === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">No se encontraron proyectos, tickets ni tareas.</p>
                <p className="text-[11px] text-slate-500">Prueba buscar por nombre de cliente, código (ej: PRJ-01), o estado.</p>
              </div>
            ) : (
              <>
                {/* 1. Projects Category */}
                {matchedProjects.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>Proyectos Web & Móviles ({matchedProjects.length})</span>
                    </div>
                    {matchedProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleItemClick({ type: 'project', data: p })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-cyan-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                              {p.code}
                            </span>
                            {getStatusBadge(p.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Cliente: <strong className="text-slate-200">{p.clientName}</strong> | {p.type === 'fullstack' ? 'Web + Móvil' : p.type === 'web' ? 'Web SaaS' : 'App Móvil'}
                          </p>
                          {/* Progress bar preview */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{p.progress}% completado</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Support Tickets Category */}
                {matchedTickets.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Tickets de Soporte ({matchedTickets.length})</span>
                    </div>
                    {matchedTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleItemClick({ type: 'ticket', data: t })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-amber-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                              {t.ticketNumber}
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                              {t.subject}
                            </span>
                            {getStatusBadge(t.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Cliente: <strong className="text-slate-200">{t.clientName}</strong> | Asignado: <span className="text-slate-300">{t.assignee}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Sprint Tasks Category */}
                {matchedTasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Tareas de Sprint ({matchedTasks.length})</span>
                    </div>
                    {matchedTasks.map((tsk) => (
                      <div
                        key={tsk.id}
                        onClick={() => handleItemClick({ type: 'task', data: tsk })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                              {tsk.taskNumber}
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                              {tsk.title}
                            </span>
                            {getStatusBadge(tsk.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Proyecto: <strong className="text-slate-200">{tsk.projectName}</strong> | Responsable: <span className="text-slate-300">{tsk.assigneeName}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Invoices Category */}
                {matchedInvoices.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Facturas ({matchedInvoices.length})</span>
                    </div>
                    {matchedInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleItemClick({ type: 'invoice', data: inv })}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                              ${inv.amount.toLocaleString('en-US')} USD
                            </span>
                            {getStatusBadge(inv.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Cliente: <strong className="text-slate-200">{inv.clientName}</strong> | Proyecto: <span className="text-slate-300">{inv.project}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected Item Quick Details Modal Overlay */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedPreview.type === 'project' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-extrabold text-white">{selectedPreview.data.name}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Código de Registro:</span>
                    <span className="font-mono text-cyan-300">{selectedPreview.data.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente Asignado:</span>
                    <span className="font-semibold text-white">{selectedPreview.data.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha Inicio / Entrega:</span>
                    <span className="text-slate-300">{selectedPreview.data.startDate} — {selectedPreview.data.deadline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Presupuesto Ejecutado:</span>
                    <span className="text-emerald-400 font-bold">${selectedPreview.data.spent.toLocaleString()} / ${selectedPreview.data.budget.toLocaleString()} USD</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  {selectedPreview.data.description || 'Proyecto activo en el sistema de gestión de Nexus Web Studio.'}
                </p>
              </div>
            )}

            {selectedPreview.type === 'ticket' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-extrabold text-white">{selectedPreview.data.subject}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Número Ticket:</span>
                    <span className="font-mono text-amber-300">{selectedPreview.data.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente Solicita:</span>
                    <span className="font-semibold text-white">{selectedPreview.data.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prioridad / Estado:</span>
                    <div className="flex gap-1.5">
                      <span className="text-amber-400 font-bold uppercase">{selectedPreview.data.priority}</span>
                      <span>—</span>
                      <span className="text-slate-300">{selectedPreview.data.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPreview.type === 'task' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-extrabold text-white">{selectedPreview.data.title}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Identificador Tarea:</span>
                    <span className="font-mono text-indigo-300">{selectedPreview.data.taskNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proyecto Relacionado:</span>
                    <span className="font-semibold text-white">{selectedPreview.data.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Desarrollador / Asignado:</span>
                    <span className="text-slate-300">{selectedPreview.data.assigneeName}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPreview.type === 'invoice' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-extrabold text-white">Factura {selectedPreview.data.invoiceNumber}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monto Total:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">${selectedPreview.data.amount.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="font-semibold text-white">{selectedPreview.data.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proyecto Asociado:</span>
                    <span className="text-slate-300">{selectedPreview.data.project}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
