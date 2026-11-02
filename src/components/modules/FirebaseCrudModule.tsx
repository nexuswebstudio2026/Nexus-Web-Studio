import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  LifeBuoy,
  CheckSquare,
  Smartphone,
  Layers,
  Code,
  Save,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { UserAccount } from '../../types';

interface FirebaseCrudModuleProps {
  currentUser: UserAccount;
}

type CollectionType = 'users' | 'projects' | 'invoices' | 'tickets' | 'tasks' | 'releases' | 'custom';

export const FirebaseCrudModule: React.FC<FirebaseCrudModuleProps> = ({ currentUser }) => {
  const [activeCollection, setActiveCollection] = useState<CollectionType>('users');
  const [customCollectionName, setCustomCollectionName] = useState<string>('');
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isJsonViewModalOpen, setIsJsonViewModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  // Selected document state
  const [selectedDoc, setSelectedDoc] = useState<Record<string, any> | null>(null);
  const [docIdInput, setDocIdInput] = useState<string>('');
  const [jsonText, setJsonText] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const currentTargetCollection = activeCollection === 'custom'
    ? (customCollectionName.trim() || 'users')
    : activeCollection;

  // Real-time listener for current collection
  useEffect(() => {
    setLoading(true);
    setStatusMessage(null);

    let unsubscribe: (() => void) | null = null;
    try {
      const colRef = collection(db, currentTargetCollection);
      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const docsList = snapshot.docs.map((d) => ({
            _id: d.id,
            ...d.data(),
          }));
          setDocuments(docsList);
          setLoading(false);
        },
        (error) => {
          console.error(`Error loading collection ${currentTargetCollection}:`, error);
          setStatusMessage({
            type: 'error',
            text: `Error de Firestore: ${error.message}`,
          });
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error('Error attaching listener:', err);
      setStatusMessage({ type: 'error', text: `Error al conectar: ${err.message}` });
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentTargetCollection]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const newId = `${activeCollection}_${Date.now()}`;
    setDocIdInput(newId);

    // Initial template data based on active collection
    let template: Record<string, any> = {};
    if (activeCollection === 'projects') {
      template = {
        id: newId,
        name: 'Nuevo Proyecto Web/Móvil',
        code: 'NEXUS-01',
        clientName: 'Cliente Ejemplo S.A.',
        type: 'web',
        status: 'in_development',
        progress: 10,
        budget: 15000,
        spent: 2000,
        startDate: new Date().toISOString().split('T')[0],
        deadline: '2026-12-31',
        techStack: ['React', 'TypeScript', 'Firebase'],
        team: ['usr_admin'],
        repoUrl: 'github.com/nexusstudio/nuevo-proyecto',
        description: 'Descripción del proyecto almacenado en Firebase.',
      };
    } else if (activeCollection === 'users') {
      template = {
        id: newId,
        name: 'Nuevo Usuario Registrado',
        email: 'usuario.nuevo@nexusstudio.dev',
        role: 'web_dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        jobTitle: 'Desarrollador Software',
        department: 'Tecnología',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: { 'web.view_sprint': true, 'users.view': true },
      };
    } else if (activeCollection === 'invoices') {
      template = {
        id: newId,
        invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        clientName: 'Cliente Ejemplo S.A.',
        project: 'Proyecto Nexus',
        amount: 5000,
        tax: 950,
        status: 'pending',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '2026-12-15',
        items: [{ description: 'Desarrollo Frontend React', hours: 25, rate: 100, total: 2500 }],
      };
    } else if (activeCollection === 'tickets') {
      template = {
        id: newId,
        ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: 'Cliente Ejemplo S.A.',
        subject: 'Solicitud de soporte técnico en producción',
        category: 'web_bug',
        priority: 'medium',
        status: 'open',
        assignee: 'Administrador General',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        messages: [{ sender: 'Cliente', isClient: true, timestamp: 'Hoy', content: 'Mensaje de solicitud' }],
      };
    } else if (activeCollection === 'tasks') {
      template = {
        id: newId,
        taskNumber: `DEV-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Optimizar consultas Firestore en tiempo real',
        projectName: 'Nexus Core',
        platform: 'web',
        assigneeName: 'Administrador',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 10,
        loggedHours: 2,
      };
    } else {
      template = {
        id: newId,
        title: 'Registro Firebase',
        createdAt: new Date().toISOString(),
      };
    }

    setJsonText(JSON.stringify(template, null, 2));
    setJsonError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (docData: Record<string, any>) => {
    setSelectedDoc(docData);
    setDocIdInput(docData._id || docData.id);
    const cleaned = { ...docData };
    delete cleaned._id;
    setJsonText(JSON.stringify(cleaned, null, 2));
    setJsonError(null);
    setIsEditModalOpen(true);
  };

  // Save Document to Firebase
  const handleSaveDocument = async (isNew: boolean) => {
    try {
      setJsonError(null);
      const parsedData = JSON.parse(jsonText);
      const targetId = docIdInput.trim() || parsedData.id || `doc_${Date.now()}`;
      parsedData.id = targetId;

      const docRef = doc(db, currentTargetCollection, targetId);
      await setDoc(docRef, parsedData, { merge: true });

      setStatusMessage({
        type: 'success',
        text: `¡Documento "${targetId}" guardado exitosamente en la colección "${currentTargetCollection}" de Firebase!`,
      });
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setJsonError(`Error de formato JSON: ${err.message}`);
      } else {
        console.error('Error updating Firestore document:', err);
        handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `${currentTargetCollection}/${docIdInput}`);
      }
    }
  };

  // Delete Document from Firebase
  const handleDeleteDocument = async () => {
    if (!selectedDoc) return;
    const targetId = selectedDoc._id || selectedDoc.id;
    try {
      const docRef = doc(db, currentTargetCollection, targetId);
      await deleteDoc(docRef);

      setStatusMessage({
        type: 'success',
        text: `Documento "${targetId}" eliminado definitivamente de Firebase.`,
      });
      setIsDeleteConfirmOpen(false);
      setSelectedDoc(null);
    } catch (err: any) {
      console.error('Error deleting document:', err);
      handleFirestoreError(err, OperationType.DELETE, `${currentTargetCollection}/${targetId}`);
    }
  };

  // Filtered documents list
  const filteredDocs = documents.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const strRepr = JSON.stringify(d).toLowerCase();
    return strRepr.includes(term);
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-orange-500/20 shrink-0 flex items-center justify-center text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Panel de Administración CRUD - Firebase Firestore
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado a Firebase
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestor directo de base de datos en tiempo real. Crea, lee, actualiza o elimina registros permanentes en Firebase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Registro Firebase</span>
            </button>
          </div>
        </div>

        {/* Database info metrics */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Colección Activa</span>
            <span className="text-amber-400 font-bold truncate block">{currentTargetCollection}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Total Documentos</span>
            <span className="text-white font-bold block">{documents.length} registros</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Usuario Admin</span>
            <span className="text-purple-300 font-bold truncate block">{currentUser.email}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Estado de Sincronía</span>
            <span className="text-emerald-400 font-bold block">100% Real-Time</span>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-cyan-950/80 border-cyan-800 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Collection Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'users', label: 'Usuarios', icon: Users, count: activeCollection === 'users' ? documents.length : null },
            { id: 'projects', label: 'Proyectos', icon: Briefcase, count: activeCollection === 'projects' ? documents.length : null },
            { id: 'invoices', label: 'Contabilidad (Facturas)', icon: DollarSign, count: activeCollection === 'invoices' ? documents.length : null },
            { id: 'tickets', label: 'Tickets Soporte', icon: LifeBuoy, count: activeCollection === 'tickets' ? documents.length : null },
            { id: 'tasks', label: 'Tareas Sprint', icon: CheckSquare, count: activeCollection === 'tasks' ? documents.length : null },
            { id: 'releases', label: 'Releases Móviles', icon: Smartphone, count: activeCollection === 'releases' ? documents.length : null },
            { id: 'custom', label: 'Personalizada', icon: Layers, count: null },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeCollection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCollection(tab.id as CollectionType)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeCollection === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Nombre de colección Firestore (ej. audit_logs)"
              value={customCollectionName}
              onChange={(e) => setCustomCollectionName(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 w-full sm:w-64 font-mono"
            />
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Buscar en "${currentTargetCollection}"...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>Mostrando {filteredDocs.length} de {documents.length} registros</span>
          <button
            onClick={handleOpenCreate}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Registro</span>
          </button>
        </div>
      </div>

      {/* Database Documents Table View */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Cargando colección "{currentTargetCollection}" desde Firebase...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No se encontraron registros en "{currentTargetCollection}"</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              La colección está vacía o no coincide con los términos de búsqueda. Haz clic abajo para insertar el primer documento en la base de datos de Firebase.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Crear Primer Registro
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Document ID (_id)</th>
                  <th className="p-4">Detalle / Nombre</th>
                  <th className="p-4">Estado / Rol / Tipo</th>
                  <th className="p-4">Resumen Campos Payload</th>
                  <th className="p-4 text-right">Acciones CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredDocs.map((docItem) => {
                  const docId = docItem._id || docItem.id || 'N/A';
                  const titleName = docItem.name || docItem.title || docItem.subject || docItem.invoiceNumber || docItem.taskNumber || docItem.appName || docId;
                  const tagValue = docItem.status || docItem.role || docItem.type || docItem.category || docItem.priority || 'Activo';

                  return (
                    <tr key={docId} className="hover:bg-slate-800/40 transition-colors group">
                      {/* ID */}
                      <td className="p-4 font-mono font-bold text-amber-400 truncate max-w-[180px]">
                        {docId}
                      </td>

                      {/* Name / Title */}
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          {docItem.avatar && (
                            <img
                              src={docItem.avatar}
                              alt={titleName}
                              className="w-6 h-6 rounded-lg object-cover border border-purple-500/30 shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[220px]">{titleName}</span>
                        </div>
                      </td>

                      {/* Status / Role Tag */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                          {tagValue}
                        </span>
                      </td>

                      {/* Summary Keys */}
                      <td className="p-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                        {Object.keys(docItem)
                          .filter((k) => k !== '_id')
                          .slice(0, 5)
                          .join(', ')}
                        {Object.keys(docItem).length > 5 && ' ...'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        {/* JSON View */}
                        <button
                          onClick={() => {
                            setSelectedDoc(docItem);
                            setIsJsonViewModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Ver JSON completo"
                        >
                          <Code className="w-3 h-3 text-cyan-400" />
                          <span>JSON</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(docItem)}
                          className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-200 rounded-lg font-medium text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Actualizar registro"
                        >
                          <Edit className="w-3 h-3 text-amber-400" />
                          <span>Editar</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setSelectedDoc(docItem);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Eliminar registro de Firebase"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Borrar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  {isCreateModalOpen ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isCreateModalOpen ? 'Crear Nuevo Documento' : 'Actualizar Documento'} en Firebase
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Colección: <span className="font-mono text-amber-400 font-bold">{currentTargetCollection}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Document ID Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ID del Documento (Document Key):
                </label>
                <input
                  type="text"
                  value={docIdInput}
                  onChange={(e) => setDocIdInput(e.target.value)}
                  disabled={isEditModalOpen}
                  placeholder="ej. prj_1029384"
                  className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                />
              </div>

              {/* Payload JSON Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Estructura del Registro (JSON Payload):
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Formato válido JSON</span>
                </div>
                <textarea
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
                />
                {jsonError && (
                  <p className="text-xs text-rose-400 font-mono mt-1 bg-rose-950/60 p-2 rounded-lg border border-rose-800/80">
                    {jsonError}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveDocument(isCreateModalOpen)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isCreateModalOpen ? 'Guardar en Firebase' : 'Actualizar Registro'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RAW JSON VIEW MODAL */}
      {isJsonViewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Documento Firebase: <span className="font-mono text-amber-400">{selectedDoc._id || selectedDoc.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsJsonViewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
              <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap break-all bg-slate-900 p-4 rounded-xl border border-slate-800">
                {JSON.stringify(selectedDoc, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setIsJsonViewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeleteConfirmOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">¿Eliminar registro permanentemente?</h3>
              <p className="text-xs text-slate-300 mt-2">
                Esta acción borrará definitivamente el documento <span className="font-mono font-bold text-rose-400">{selectedDoc._id || selectedDoc.id}</span> de la colección <span className="font-mono text-amber-400">{currentTargetCollection}</span> en la base de datos de Firebase.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDocument}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
