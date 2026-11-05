import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Calendar,
  Bot,
  Search,
  RotateCcw,
  ArrowUpRight,
  Globe,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  ChatConversationSession,
  filterChatConversations,
  formatDisplayDateFromKey,
  formatLocalDateKey,
} from '../../utils/agentConfig';

export interface AgentFilterOption {
  id: string;
  name: string;
  role?: string;
}

interface ChatHistoryPanelProps {
  sessions: ChatConversationSession[];
  agents: AgentFilterOption[];
  activeAgentId: string;
  onResumeConversation: (session: ChatConversationSession) => void;
  onDeleteConversation: (sessionId: string) => void;
  onNavigateToChat: () => void;
  onOpenBrowserUrl: (url: string) => void;
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  sessions,
  agents,
  activeAgentId,
  onResumeConversation,
  onDeleteConversation,
  onNavigateToChat,
  onOpenBrowserUrl,
}) => {
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [showFullPromptSnapshot, setShowFullPromptSnapshot] = useState<boolean>(false);

  const todayKey = useMemo(() => formatLocalDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const now = new Date();
    return formatLocalDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  }, []);

  const agentOptions = useMemo(() => {
    const seen = new Map<string, AgentFilterOption>();
    for (const ag of agents) {
      if (ag && ag.id) {
        seen.set(ag.id, { id: ag.id, name: ag.name, role: ag.role });
      }
    }
    for (const s of sessions) {
      if (s && s.agentId && !seen.has(s.agentId)) {
        seen.set(s.agentId, {
          id: s.agentId,
          name: s.agentName,
          role: s.agentRole,
        });
      }
    }
    return Array.from(seen.values());
  }, [agents, sessions]);

  const filteredSessions = useMemo(() => {
    return filterChatConversations(sessions, {
      agentId: selectedAgentFilter,
      dateKey: selectedDateFilter,
      searchQuery,
    });
  }, [sessions, selectedAgentFilter, selectedDateFilter, searchQuery]);

  useEffect(() => {
    if (filteredSessions.length === 0) {
      setSelectedSessionId('');
      return;
    }
    if (!filteredSessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedSessionId]);

  const activeSession = useMemo(() => {
    if (filteredSessions.length === 0) return null;
    return filteredSessions.find((s) => s.id === selectedSessionId) || filteredSessions[0];
  }, [filteredSessions, selectedSessionId]);

  const totalFilteredMessages = useMemo(() => {
    return filteredSessions.reduce((sum, s) => sum + (s.messageCount || s.messages.length || 0), 0);
  }, [filteredSessions]);

  const hasActiveFilters =
    selectedAgentFilter !== 'all' || selectedDateFilter !== '' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedAgentFilter('all');
    setSelectedDateFilter('');
    setSearchQuery('');
  };

  return (
    <section
      id="chat-history-view"
      aria-labelledby="chat-history-heading"
      className="space-y-6 animate-in fade-in duration-200"
    >
      {/* Header & Filter Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h2
              id="chat-history-heading"
              className="text-base sm:text-lg font-bold text-white flex items-center gap-2"
            >
              <History className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Historial de Conversaciones con Agentes IA</span>
            </h2>
            <p className="text-xs text-slate-400">
              Filtra sesiones pasadas por agente o fecha y retoma cualquier conversación conservando su prompt del sistema, URL base y notas de contexto.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {activeAgentId && (
              <button
                type="button"
                onClick={() =>
                  setSelectedAgentFilter((prev) => (prev === activeAgentId ? 'all' : activeAgentId))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  selectedAgentFilter === activeAgentId
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {selectedAgentFilter === activeAgentId
                  ? 'Mostrando agente activo'
                  : 'Filtrar por agente activo'}
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToChat}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Volver al Chat</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Row: Agent Selector + Calendar Date Picker + Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          {/* Specific Agent Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label
              htmlFor="history-filter-agent"
              className="font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Filtrar por Agente</span>
            </label>
            <select
              id="history-filter-agent"
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todos los agentes ({agentOptions.length})</option>
              {agentOptions.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter (Calendar Input + Quick Today/Yesterday/All Buttons) */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="history-filter-date"
                className="font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Filtrar por Fecha</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(todayKey)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedDateFilter === todayKey
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(yesterdayKey)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedDateFilter === yesterdayKey
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Ayer
                </button>
                {selectedDateFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter('')}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Todas
                  </button>
                )}
              </div>
            </div>

            <input
              id="history-filter-date"
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
          </div>

          {/* Keyword Search Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label
              htmlFor="history-filter-search"
              className="font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Buscar en mensajes o contexto</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="history-filter-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: Firestore, React, SEO, URL..."
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                  title="Restablecer filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Unboxed Metadata Summary Line (Zero-Pill Rule + Tabular Numerals) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-300 font-mono tabular-nums">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Mostrando <strong className="text-white">{filteredSessions.length}</strong> de{' '}
              {sessions.length} conversaciones
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Mensajes filtrados: <strong className="text-cyan-400">{totalFilteredMessages}</strong>
            </span>
            {selectedDateFilter && (
              <>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>
                  Fecha: <strong className="text-purple-300">{formatDisplayDateFromKey(selectedDateFilter)}</strong>
                </span>
              </>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            El contexto de tu conversación activa se mantiene intacto al explorar el historial.
          </span>
        </div>
      </div>

      {/* Main Split View: Filtered Sessions List (Left) & Transcript + Context Inspector (Right) */}
      {filteredSessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <p className="text-sm font-semibold text-white">
            {sessions.length === 0
              ? 'Todavía no hay conversaciones registradas en el historial.'
              : 'No se encontraron conversaciones que coincidan con los filtros seleccionados.'}
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            {sessions.length === 0
              ? 'Inicia una charla con cualquier agente de IA en Studio Chat para guardar automáticamente los mensajes, URL base y notas de contexto.'
              : 'Prueba seleccionar otra fecha en el calendario, cambiar el agente o restablecer los filtros activos.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToChat}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Ir a Studio Chat
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filtered Past Conversations List */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Conversaciones ({filteredSessions.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Más recientes primero</span>
            </div>

            <div
              role="list"
              aria-label="Lista de conversaciones pasadas"
              className="divide-y divide-slate-800/80 max-h-[560px] overflow-y-auto"
            >
              {filteredSessions.map((session) => {
                const isSelected = activeSession?.id === session.id;
                const lastMessage =
                  session.messages && session.messages.length > 0
                    ? session.messages[session.messages.length - 1]
                    : null;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setShowFullPromptSnapshot(false);
                    }}
                    className={`w-full text-left px-5 py-4 transition-colors cursor-pointer block space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-800/80 text-white'
                        : 'hover:bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs font-bold leading-snug line-clamp-1 ${
                          isSelected ? 'text-cyan-300' : 'text-white'
                        }`}
                      >
                        {session.title}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {formatDisplayDateFromKey(session.dateKey)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-purple-300">{session.agentName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {session.messageCount || session.messages.length} mensajes
                      </span>
                    </div>

                    {lastMessage && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                        {lastMessage.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Conversation Context & Transcript Inspector */}
          {activeSession && (
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              {/* Conversation Header & Primary Action */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-base font-bold text-white leading-snug break-words">
                    {activeSession.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
                    <span className="text-cyan-400 font-semibold font-sans">
                      {activeSession.agentName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDisplayDateFromKey(activeSession.dateKey)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeSession.messageCount || activeSession.messages.length} mensajes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResumeConversation(activeSession)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Continuar en Chat</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteConversation(activeSession.id)}
                    className="p-2 bg-slate-950 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                    title={`Eliminar conversación "${activeSession.title}"`}
                    aria-label={`Eliminar conversación "${activeSession.title}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preserved Chat Context Summary (Clean Key-Value Rows, Zero Pill Clutter) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200">
                    Contexto Guardado de la Conversación
                  </span>
                  {activeSession.trainedInstructionsSnapshot && (
                    <button
                      type="button"
                      onClick={() => setShowFullPromptSnapshot((prev) => !prev)}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {showFullPromptSnapshot ? 'Ocultar prompt' : 'Ver prompt del sistema'}
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <p>
                    <strong className="text-slate-400 font-semibold">URL Base:</strong>{' '}
                    <span className="font-mono text-cyan-300">
                      {activeSession.baseUrl || 'No configurada'}
                    </span>{' '}
                    <span className="text-slate-500">
                      ({activeSession.includeBaseUrlContext ? 'Incluida en contexto' : 'Desactivada'})
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-400 font-semibold">Capacidades del Agente:</strong>{' '}
                    <span>
                      {activeSession.includeCapabilitiesContext ? 'Activas en contexto' : 'Omitidas'}
                    </span>
                  </p>
                  {activeSession.sessionContext && (
                    <p>
                      <strong className="text-slate-400 font-semibold">Nota de Contexto:</strong>{' '}
                      <span className="text-purple-200">{activeSession.sessionContext}</span>
                    </p>
                  )}
                  {showFullPromptSnapshot && activeSession.trainedInstructionsSnapshot && (
                    <p className="pt-1.5 mt-1.5 border-t border-slate-800/80 font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      <strong className="text-purple-400">Prompt del Sistema:</strong>{' '}
                      {activeSession.trainedInstructionsSnapshot}
                    </p>
                  )}
                </div>
              </div>

              {/* Conversation Transcript */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-full sm:max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed break-words ${
                        msg.sender === 'user'
                          ? 'bg-purple-700/90 text-white rounded-br-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-wrap'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 text-[11px] font-mono text-slate-300/80">
                        <span className="font-semibold">
                          {msg.sender === 'user'
                            ? 'Usuario'
                            : msg.agentName || activeSession.agentName}
                        </span>
                        <span className="tabular-nums">{msg.timestamp}</span>
                      </div>
                      <p className="[overflow-wrap:anywhere]">{msg.text}</p>

                      {msg.detectedUrl && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => onOpenBrowserUrl(msg.detectedUrl!)}
                            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Abrir {msg.detectedUrl} en Navegador</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
