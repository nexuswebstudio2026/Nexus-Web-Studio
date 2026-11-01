import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  Download,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';
import { UserAccount, Project, Invoice } from '../../types';

interface ClientPortalModuleProps {
  currentUser: UserAccount;
  projects: Project[];
  invoices: Invoice[];
  onPayInvoice: (id: string) => void;
}

export const ClientPortalModule: React.FC<ClientPortalModuleProps> = ({
  currentUser,
  projects,
  invoices,
  onPayInvoice,
}) => {
  const clientProjects = projects.filter((p) => p.clientName.toLowerCase().includes('wright') || projects[0]);
  const clientInvoices = invoices.filter((i) => i.clientName.toLowerCase().includes('wright') || invoices[0]);

  const canPayInvoice = currentUser.permissions['client.pay_invoice'];
  const canApprove = currentUser.permissions['client.approve_deliverable'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Portal del Cliente Ejecutivo
            </span>
            <span className="text-xs text-slate-400 font-mono">Bienvenido: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Visibilidad de Proyectos Contratados & Entregables
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Consulte en tiempo real el avance de su software Web & Móvil, apruebe hitos de desarrollo y abone facturas.
          </p>
        </div>

        <div className="px-4 py-2 bg-indigo-950 border border-indigo-800 rounded-2xl text-xs text-indigo-300 font-mono font-semibold">
          Empresa: Wright Fintech Corp
        </div>
      </div>

      {/* Project Status Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Estado del Desarrollo en Curso</span>
        </h2>

        {clientProjects.map((p) => (
          <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">[{p.code}]</span>
                <h3 className="text-lg font-extrabold text-white">{p.name}</h3>
              </div>
              <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold rounded-xl uppercase">
                {p.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Avance Global de la Solución (Web + Mobile + DB)</span>
                <span className="font-mono font-bold text-white">{p.progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>

            {/* Milestones / Deliverables Checklist */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Hitos de Fase & Entregables:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fase 1: Arquitectura DB & REST
                  </span>
                  <p className="text-slate-400 text-[10px]">Aprobado el 15/09/2026</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fase 2: Módulo Web Admin & Contabilidad
                  </span>
                  <p className="text-slate-400 text-[10px]">Aprobado el 10/10/2026</p>
                </div>

                <div className="p-3 bg-slate-900 border border-indigo-800/60 rounded-xl text-xs space-y-1.5">
                  <span className="text-indigo-300 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Fase 3: iOS TestFlight & BioAuth
                  </span>
                  {canApprove ? (
                    <button
                      onClick={() => alert('Entregable firmado y aprobado exitosamente.')}
                      className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-[10px] flex items-center justify-center gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Aprobar Entregable
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 block">Requiere permiso client.approve_deliverable</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client Invoices & Payment Online */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Facturas & Pagos en Línea</span>
        </h2>

        <div className="space-y-3">
          {clientInvoices.map((inv) => (
            <div key={inv.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-300 text-sm">{inv.invoiceNumber}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                      inv.status === 'paid' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{inv.project} · Vence: {inv.dueDate}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base font-extrabold text-white font-mono">${inv.amount.toLocaleString()} USD</span>

                {inv.status !== 'paid' && canPayInvoice && (
                  <button
                    onClick={() => onPayInvoice(inv.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pagar Factura</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
