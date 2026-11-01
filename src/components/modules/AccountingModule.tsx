import React, { useState } from 'react';
import {
  DollarSign,
  FileText,
  Plus,
  TrendingUp,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
} from 'lucide-react';
import { UserAccount, Invoice, Project } from '../../types';

interface AccountingModuleProps {
  currentUser: UserAccount;
  invoices: Invoice[];
  projects: Project[];
  onAddInvoice: (newInv: Omit<Invoice, 'id'>) => void;
  onUpdateInvoiceStatus: (id: string, status: 'paid' | 'pending' | 'overdue') => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  currentUser,
  invoices,
  projects,
  onAddInvoice,
  onUpdateInvoiceStatus,
}) => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState(projects[0]?.name || 'NeoBank Ecosystem');
  const [amount, setAmount] = useState(15000);

  const canIssueInvoices = currentUser.permissions['finance.issue_invoices'];
  const canViewRates = currentUser.permissions['finance.view_rates'];

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((acc, i) => acc + i.amount, 0);

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    onAddInvoice({
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName,
      project: projectName,
      amount: Number(amount),
      tax: Number(amount) * 0.19,
      status: 'pending',
      issueDate: '2026-10-31',
      dueDate: '2026-11-15',
      items: [
        { description: 'Sprint de Desarrollo Web & Móvil Full-Stack', hours: 80, rate: 150, total: Number(amount) * 0.8 },
        { description: 'Mantenimiento de Base de Datos PostgreSQL', hours: 20, rate: 150, total: Number(amount) * 0.2 },
      ],
    });

    setClientName('');
    setShowInvoiceModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Módulo de Contabilidad & Finanzas
            </span>
            <span className="text-xs text-slate-400 font-mono">Usuario: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión Financiera, Facturación & Presupuestos
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Control de cobros a clientes, estado de facturas (Paid/Pending/Overdue) y margen de ganancia por proyecto.
          </p>
        </div>

        {canIssueInvoices ? (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generar Nueva Factura</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Sin permiso de emisión (finance.issue_invoices)</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Facturación Total Emitida</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalBilled.toLocaleString()} USD
          </div>
          <p className="text-[11px] text-slate-400">Total acumulado en el sistema</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cobrado Reales (Paid)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            ${totalPaid.toLocaleString()} USD
          </div>
          <p className="text-[11px] text-emerald-400">Fondos acreditados en cuenta</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Por Cobrar (Pending)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
            ${totalPending.toLocaleString()} USD
          </div>
          <p className="text-[11px] text-amber-400">Facturas vigentes por cobrar</p>
        </div>

      </div>

      {/* Invoices Manager Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Registro de Facturas Emitidas (Invoices)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Administre estados de facturación y detalle de líneas de costo.
            </p>
          </div>

          <button
            onClick={() => alert('Exportando reporte contable en CSV...')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Nº Factura</th>
                <th className="pb-3">Cliente / Empresa</th>
                <th className="pb-3">Proyecto Asociado</th>
                <th className="pb-3">Monto Base</th>
                <th className="pb-3">Impuestos (19%)</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => {
                const isPaid = inv.status === 'paid';
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-emerald-300">{inv.invoiceNumber}</td>
                    <td className="py-3 font-semibold text-white">{inv.clientName}</td>
                    <td className="py-3 text-slate-300">{inv.project}</td>
                    <td className="py-3 font-mono text-white">${inv.amount.toLocaleString()}</td>
                    <td className="py-3 font-mono text-slate-400">${inv.tax.toLocaleString()}</td>
                    <td className="py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => onUpdateInvoiceStatus(inv.id, e.target.value as any)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-0.5 border focus:outline-none ${
                          inv.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : inv.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-rose-950 text-rose-300 border-rose-700'
                        }`}
                      >
                        <option value="paid">Pagada (Paid)</option>
                        <option value="pending">Pendiente (Pending)</option>
                        <option value="overdue">Vencida (Overdue)</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => alert(`Visualizando PDF de la factura ${inv.invoiceNumber}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                      >
                        Ver PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Cost Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>Desglose de Costes por Capa Tecnológica</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300">Desarrollo Web Frontend</h3>
            <p className="text-lg font-extrabold text-white font-mono mt-1">$14,500 USD</p>
            <p className="text-[10px] text-slate-400 mt-1">React 19, Vite, Tailwind CSS</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300">Desarrollo Móvil Native</h3>
            <p className="text-lg font-extrabold text-white font-mono mt-1">$18,200 USD</p>
            <p className="text-[10px] text-slate-400 mt-1">React Native & Flutter</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300">Backend & API Microservicios</h3>
            <p className="text-lg font-extrabold text-white font-mono mt-1">$12,000 USD</p>
            <p className="text-[10px] text-slate-400 mt-1">Node.js Express & FastApi</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300">Base de Datos & Cloud Infra</h3>
            <p className="text-lg font-extrabold text-white font-mono mt-1">$4,800 USD</p>
            <p className="text-[10px] text-slate-400 mt-1">PostgreSQL & Redis Cloud</p>
          </div>
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Generar Nueva Factura de Cobro</h3>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Wright Fintech Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Proyecto Asocidado</label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Monto Base (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                >
                  Emitir Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
