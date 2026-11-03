import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  MessageSquare,
  ExternalLink,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Tag,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { ContactMessage, UserAccount } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

interface InboxModuleProps {
  currentUser: UserAccount;
}

export const InboxModule: React.FC<InboxModuleProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Real-time Firestore Subscription
  useEffect(() => {
    setIsLoading(true);
    const path = 'contact_messages';
    
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const loaded: ContactMessage[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Sin nombre',
            email: data.email || 'Sin correo',
            phone: data.phone || '',
            projectType: data.projectType || 'General',
            message: data.message || '',
            status: data.status || 'unread',
            source: data.source || 'Formulario',
            createdAt: data.createdAt || new Date().toISOString(),
            replyNotes: data.replyNotes,
            repliedAt: data.repliedAt,
          } as ContactMessage;
        });

        // Sort descending by createdAt date/string
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMessages(loaded);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore contact_messages error:', error);
        handleFirestoreError(error, OperationType.LIST, path);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Status updates
  const handleUpdateStatus = async (msgId: string, newStatus: ContactMessage['status'], replyNotes?: string) => {
    try {
      const docRef = doc(db, 'contact_messages', msgId);
      const payload: Partial<ContactMessage> = { status: newStatus };
      if (replyNotes) {
        payload.replyNotes = replyNotes;
        payload.repliedAt = new Date().toLocaleString('es-ES');
      }
      await updateDoc(docRef, payload);

      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage((prev) => prev ? { ...prev, ...payload } : null);
      }
    } catch (err) {
      console.error('Error actualizando estado del mensaje:', err);
      handleFirestoreError(err, OperationType.UPDATE, `contact_messages/${msgId}`);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este mensaje de contacto de la base de datos de Firebase?')) return;
    try {
      await deleteDoc(doc(db, 'contact_messages', msgId));
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error eliminando mensaje:', err);
      handleFirestoreError(err, OperationType.DELETE, `contact_messages/${msgId}`);
    }
  };

  // Submit Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSubmittingReply(true);
    await handleUpdateStatus(selectedMessage.id, 'replied', replyText.trim());
    setIsSubmittingReply(false);
    setReplyModalOpen(false);
    setReplyText('');
  };

  // Filter logic
  const filteredMessages = messages.filter((msg) => {
    const matchesTab =
      activeTab === 'all'
        ? msg.status !== 'archived'
        : activeTab === 'archived'
        ? msg.status === 'archived'
        : msg.status === activeTab;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      msg.name.toLowerCase().includes(query) ||
      msg.email.toLowerCase().includes(query) ||
      (msg.phone && msg.phone.toLowerCase().includes(query)) ||
      msg.projectType.toLowerCase().includes(query) ||
      msg.message.toLowerCase().includes(query);

    return matchesTab && matchesQuery;
  });

  // Counters
  const totalCount = messages.filter(m => m.status !== 'archived').length;
  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const readCount = messages.filter((m) => m.status === 'read').length;
  const repliedCount = messages.filter((m) => m.status === 'replied').length;
  const archivedCount = messages.filter((m) => m.status === 'archived').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950 shrink-0">
            <Inbox className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Bandeja de Entrada</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-extrabold text-xs shadow-md animate-pulse">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Recepción centralizada en tiempo real de todos los formularios de contacto desde el sitio web público.
            </p>
          </div>
        </div>

        {/* Action Button: Direct Contact Test */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-200 font-semibold">Base de datos Firebase Conectada</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mensajes Totales</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">{totalCount}</p>
          <p className="text-[10px] text-slate-400">Recibidos activamente</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sin Leer</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-400">{unreadCount}</p>
          <p className="text-[10px] text-rose-300/80 font-medium">Requieren atención</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Respondidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">{repliedCount}</p>
          <p className="text-[10px] text-slate-400">Gestión completada</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Archivados</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-300">{archivedCount}</p>
          <p className="text-[10px] text-slate-400">Guardados históricamente</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-200 border border-indigo-800">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'unread'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Sin Leer</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-950 text-rose-200 border border-rose-800 font-extrabold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('read')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'read'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Leídos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-950 text-blue-200 border border-blue-800">
                {readCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('replied')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'replied'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Respondidos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-200 border border-emerald-800">
                {repliedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'archived'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Archivados</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                {archivedCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, correo, mensaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        {/* Content Area: Main List & Selected Detail split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Left List Pane */}
          <div className={`${selectedMessage ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
            {isLoading ? (
              <div className="p-8 text-center space-y-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Cargando mensajes desde Firebase Firestore...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No hay mensajes en esta vista</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No se encontraron resultados coincidentes con tu búsqueda.'
                    : 'Los usuarios del sitio web aún no han enviado nuevos mensajes de contacto.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isUnread = msg.status === 'unread';

                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (msg.status === 'unread') {
                          handleUpdateStatus(msg.id, 'read');
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-indigo-500 shadow-xl'
                          : isUnread
                          ? 'bg-slate-950 border-rose-500/40 hover:border-rose-400 shadow-lg'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {isUnread && (
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between pr-4">
                          <span className={`text-xs font-bold truncate ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                            {msg.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(msg.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                          <span className="truncate">{msg.email}</span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-semibold truncate max-w-[150px]">
                            {msg.projectType}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {msg.status === 'unread' && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                                No leído
                              </span>
                            )}
                            {msg.status === 'read' && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase">
                                Leído
                              </span>
                            )}
                            {msg.status === 'replied' && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                                Respondido
                              </span>
                            )}
                            {msg.status === 'archived' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold uppercase">
                                Archivado
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Detail Pane */}
          {selectedMessage && (
            <div className="lg:col-span-7 bg-slate-950 border border-indigo-500/40 rounded-3xl p-6 space-y-6 shadow-2xl relative animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Close Detail Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-extrabold text-sm font-mono">
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedMessage.name}</h3>
                    <p className="text-xs text-indigo-400 font-mono">{selectedMessage.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Cerrar detalle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Details Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-cyan-400" /> Teléfono
                  </span>
                  <span className="font-mono text-white font-semibold block">
                    {selectedMessage.phone || 'No especificado'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-400" /> Interés
                  </span>
                  <span className="font-mono text-purple-300 font-semibold block truncate">
                    {selectedMessage.projectType}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" /> Fecha Envio
                  </span>
                  <span className="font-mono text-slate-300 font-semibold block">
                    {new Date(selectedMessage.createdAt).toLocaleString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Mensaje del Cliente:
                </h4>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Previous Reply Notes if existing */}
              {selectedMessage.replyNotes && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Respuesta Registrada:
                    </span>
                    <span className="text-[10px] text-emerald-400/80">{selectedMessage.repliedAt}</span>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                    {selectedMessage.replyNotes}
                  </p>
                </div>
              )}

              {/* Quick Actions & Status Control */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">Acciones de Gestión:</h4>
                
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Toggle Read/Unread */}
                  {selectedMessage.status === 'unread' ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                      className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 text-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Marcar como Leído</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'unread')}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Marcar como Sin Leer</span>
                    </button>
                  )}

                  {/* Mark as Replied */}
                  <button
                    onClick={() => {
                      setReplyText(selectedMessage.replyNotes || '');
                      setReplyModalOpen(true);
                    }}
                    className="px-3 py-2 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedMessage.replyNotes ? 'Editar Respuesta' : 'Registrar Respuesta'}</span>
                  </button>

                  {/* WhatsApp Direct Link */}
                  {selectedMessage.phone && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${selectedMessage.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Hola ${selectedMessage.name}, te contactamos desde Nexus Web Studio en respuesta a tu consulta.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Direct Email Link */}
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Respuesta Nexus Web Studio - ${encodeURIComponent(selectedMessage.projectType)}`}
                    className="px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Enviar Correo</span>
                  </a>

                  {/* Archive */}
                  {selectedMessage.status !== 'archived' ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archivar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Desarchivar</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ml-auto"
                    title="Eliminar de Firebase"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Eliminar</span>
                  </button>

                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Reply Modal */}
      {replyModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Registrar Respuesta para {selectedMessage.name}</span>
              </h3>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas de Respuesta o Detalle de Atención *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escriba las notas o la respuesta enviada al cliente..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Guardar Estado Respondido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
