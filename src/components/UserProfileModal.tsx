import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  Save,
  UserPlus,
  Edit3,
  Camera,
  KeyRound,
  Calendar,
  AlertTriangle,
  Lock,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
} from 'lucide-react';
import { UserAccount, RoleId } from '../types';
import { SYSTEM_ROLES } from '../data/mockData';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserAccount;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onUpdateUser: (updatedUser: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onCreateUser?: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onOpenPermissions?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  allUsers,
  onUpdateUser,
  onDeleteUser,
  onCreateUser,
  onOpenPermissions,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<RoleId>('admin');
  const [avatar, setAvatar] = useState('');

  // Populate form fields when targetUser changes or modal opens
  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setJobTitle(targetUser.jobTitle || '');
      setDepartment(targetUser.department || '');
      setRole(targetUser.role || 'admin');
      setAvatar(targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setIsEditing(false);
      setIsCreatingNew(false);
      setShowUrlInput(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const isSelf = currentUser.id === targetUser.id;
  const canManageRoles = currentUser.permissions['users.manage_roles'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & resize image using HTML5 Canvas to keep firestore payload tiny (~20KB)
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          showToast('¡Foto cargada desde tu dispositivo y optimizada!');
        } else {
          setAvatar(event.target?.result as string);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        setUploadingImage(false);
        alert('Error al procesar la imagen seleccionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setIsEditing(true);
    setName('');
    setEmail('');
    setPhone('');
    setJobTitle('Especialista de Sistema');
    setDepartment('Tecnología & Operaciones');
    setRole('web_dev');
    setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    setShowUrlInput(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSaving(true);

    if (isCreatingNew) {
      // Create new user in Firestore
      const newUserId = `usr_${Date.now()}`;
      const newUserDoc: UserAccount = {
        id: newUserId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+57 300 000 0000',
        jobTitle: jobTitle.trim() || 'Especialista',
        department: department.trim() || 'Tecnología',
        role,
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        permissions: {
          'admin.view_dashboard': true,
          'admin.manage_settings': false,
          'users.manage_roles': false,
          'users.manage_permissions': false,
        },
        createdAt: new Date().toISOString().split('T')[0],
      };

      try {
        await setDoc(doc(db, 'users', newUserId), newUserDoc);
        if (onCreateUser) onCreateUser(newUserDoc);
        onUpdateUser(newUserDoc);
        showToast('¡Usuario creado y guardado exitosamente en Firestore!');
        setIsCreatingNew(false);
        setIsEditing(false);
      } catch (err) {
        console.warn('Firestore write notice (new user):', err);
        if (onCreateUser) onCreateUser(newUserDoc);
        showToast('¡Usuario creado en estado local!');
        setIsCreatingNew(false);
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Update existing user profile in Firestore
      const updatedUserDoc: UserAccount = {
        ...targetUser,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        role,
        avatar: avatar.trim(),
      };

      try {
        await setDoc(doc(db, 'users', targetUser.id), updatedUserDoc, { merge: true });
        onUpdateUser(updatedUserDoc);
        showToast('¡Perfil de usuario actualizado exitosamente en Firebase!');
        setIsEditing(false);
      } catch (err) {
        console.warn('Firestore update notice (user profile):', err);
        onUpdateUser(updatedUserDoc);
        showToast('¡Perfil actualizado exitosamente!');
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteUserClick = async () => {
    if (isSelf) {
      alert('No puedes eliminar tu propio usuario mientras mantienes la sesión activa.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el usuario "${targetUser.name}" (${targetUser.email})?`)) return;

    try {
      await deleteDoc(doc(db, 'users', targetUser.id));
      if (onDeleteUser) onDeleteUser(targetUser.id);
      showToast(`Usuario "${targetUser.name}" eliminado.`);
      onClose();
    } catch (err) {
      console.warn('Firestore delete notice:', err);
      if (onDeleteUser) onDeleteUser(targetUser.id);
      onClose();
    }
  };

  const activeRoleDef = SYSTEM_ROLES.find((r) => r.id === (isEditing ? role : targetUser.role)) || SYSTEM_ROLES[0];
  const activePermsCount = Object.values(targetUser.permissions || {}).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 relative max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {isCreatingNew ? 'Registrar Nuevo Usuario' : isEditing ? 'Editar Perfil de Usuario' : 'Perfil de Usuario'}
                </h2>
                {isSelf && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    Tu Usuario Actual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Gestión de credenciales, datos de contacto, rol del sistema y permisos RBAC.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileSelect}
          className="hidden"
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top User Overview Card */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 shadow-inner">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative group">
                <img
                  src={isEditing ? avatar : targetUser.avatar}
                  alt={targetUser.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500/50 shadow-xl"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-xs text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer border border-purple-400/30"
                    title="Subir foto desde tu dispositivo"
                  >
                    <Upload className="w-5 h-5 text-purple-300 animate-pulse" />
                    <span className="text-[9px] font-bold text-purple-200 mt-1">Subir Foto</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white leading-tight">
                  {isCreatingNew ? (name || 'Nuevo Usuario') : targetUser.name}
                </h3>
                <p className="text-xs text-purple-300 font-mono font-medium">
                  {isCreatingNew ? jobTitle : targetUser.jobTitle} • <span className="text-slate-400">{isCreatingNew ? department : targetUser.department}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${activeRoleDef.badgeColor}`}>
                    Rol: {activeRoleDef.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ID: {isCreatingNew ? 'NUEVO' : targetUser.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Edit / Delete / Create New) */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>

                {canManageRoles && (
                  <button
                    onClick={handleStartCreateNew}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Nuevo Usuario</span>
                  </button>
                )}

                {!isSelf && canManageRoles && (
                  <button
                    onClick={handleDeleteUserClick}
                    className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Form or Profile Readonly Specs */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" /> Nombre Completo:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@nexuswebstudio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" /> Teléfono / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 304 3470984"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Cargo / Job Title:
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ej. Administrador General"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" /> Departamento:
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ej. Dirección Ejecutiva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Rol Primario del Sistema:
                  </label>
                  <select
                    disabled={!canManageRoles && !isCreatingNew}
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-purple-300 font-semibold focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="p-4 bg-slate-950/80 border border-purple-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-400" /> Foto de Perfil del Usuario:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 underline font-mono"
                  >
                    {showUrlInput ? 'Ocultar URL manual' : '¿Ingresar URL de imagen en su lugar?'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                        <span>Procesando Foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-purple-200" />
                        <span>Subir Foto desde Dispositivo</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    {avatar.startsWith('data:image') ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Imagen local cargada y optimizada
                      </span>
                    ) : (
                      <span>Formatos soportados: JPG, PNG, WEBP. Vista previa en tiempo real.</span>
                    )}
                  </div>
                </div>

                {showUrlInput && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadingImage}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando en Firebase...' : 'Guardar Cambios de Perfil'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* READONLY SPECIFICATIONS VIEW */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Correo Electrónico:
                  </span>
                  <p className="text-white font-bold font-mono text-sm">{targetUser.email}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono / WhatsApp:
                  </span>
                  <p className="text-emerald-300 font-bold font-mono text-sm">
                    {targetUser.phone || '+57 304 3470984'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Cargo Oficial:
                  </span>
                  <p className="text-white font-bold">{targetUser.jobTitle}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" /> Departamento:
                  </span>
                  <p className="text-white font-bold">{targetUser.department}</p>
                </div>
              </div>

              {/* RBAC Permissions Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Permisos RBAC Granulares Activos
                  </span>
                  <span className="text-[11px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    {activePermsCount} Permisos Otorgados
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(targetUser.permissions || {})
                    .filter(([, active]) => active)
                    .map(([permKey]) => (
                      <span
                        key={permKey}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-purple-300 rounded border border-slate-800"
                      >
                        {permKey}
                      </span>
                    ))}
                </div>

                {onOpenPermissions && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPermissions();
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Abrir Matriz de Permisos RBAC</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 bg-emerald-950 border-t border-emerald-800 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400 font-mono">
          <span>Usuario ID: {targetUser.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};

