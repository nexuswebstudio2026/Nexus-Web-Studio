import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  Send,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { UserAccount, SupportTicket } from '../../types';

interface SupportModuleProps {
  currentUser: UserAccount;
  tickets: SupportTicket[];
  onAddMessageToTicket: (ticketId: string, message: string, sender: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: 'open' | 'in_progress' | 'resolved') => void;
}

export const SupportModule: React.FC<SupportModuleProps> = ({
  currentUser,
  tickets,
  onAddMessageToTicket,
  onUpdateTicketStatus,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const canReply = currentUser.permissions['tickets.reply'];
  const canResolve = currentUser.permissions['tickets.resolve'];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    onAddMessageToTicket(activeTicket.id, replyText, currentUser.name);
    setReplyText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-amber-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Módulo de Atención al Cliente & CRM
            </span>
            <span className="text-xs text-slate-400 font-mono">Agente: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Bandeja de Entradas & Tickets de Soporte
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestión de consultas de clientes, resolución de incidencias web/móvil y seguimiento del cumplimiento de SLA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-mono font-bold">
            SLA Cumplido: 98.4%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Tickets Recientes ({tickets.length})</span>
            </h2>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {tickets.map((t) => {
              const isSelected = t.id === activeTicket?.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-400 font-bold">{t.ticketNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full border uppercase font-bold ${
                        t.priority === 'urgent' || t.priority === 'high'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">{t.subject}</h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{t.clientName}</span>
                    <span className="font-mono text-[10px]">{t.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Details Drawer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[520px]">
          {activeTicket ? (
            <>
              <div className="space-y-4">
                {/* Ticket Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-400">{activeTicket.ticketNumber}</span>
                      <span className="text-xs text-slate-400">· {activeTicket.clientName}</span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1">{activeTicket.subject}</h2>
                  </div>

                  {canResolve && (
                    <select
                      value={activeTicket.status}
                      onChange={(e) => onUpdateTicketStatus(activeTicket.id, e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-xs font-semibold text-amber-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="open">Abierto (Open)</option>
                      <option value="in_progress">En Proceso (In Progress)</option>
                      <option value="resolved">Resuelto (Resolved)</option>
                    </select>
                  )}
                </div>

                {/* Messages History */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {activeTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                        m.isClient
                          ? 'bg-slate-950 border-slate-800 text-slate-200 mr-8'
                          : 'bg-amber-950/20 border-amber-800/50 text-white ml-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-amber-300">{m.sender}</span>
                        <span className="font-mono text-[10px]">{m.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              {canReply ? (
                <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Escriba su respuesta oficial como Atención al Cliente..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                    />
                    <button
                      type="submit"
                      className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Sin permiso de respuesta activa (tickets.reply)</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">No hay ticket seleccionado.</div>
          )}
        </div>

      </div>
    </div>
  );
};
