import React, { useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { AuthModal } from './components/AuthModal';
import { RolePermissionModal } from './components/RolePermissionModal';
import { PromptGeneratorTab } from './components/PromptGeneratorTab';
import { PublicLandingPage } from './components/PublicLandingPage';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { Footer } from './components/Footer';

import { AdminModule } from './components/modules/AdminModule';
import { AccountingModule } from './components/modules/AccountingModule';
import { SupportModule } from './components/modules/SupportModule';
import { WebDevModule } from './components/modules/WebDevModule';
import { MobileDevModule } from './components/modules/MobileDevModule';
import { QaDevOpsModule } from './components/modules/QaDevOpsModule';
import { ClientPortalModule } from './components/modules/ClientPortalModule';

import {
  UserAccount,
  Project,
  Invoice,
  SupportTicket,
  SprintTask,
  MobileRelease,
  RoleId,
} from './types';
import {
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_INVOICES,
  MOCK_TICKETS,
  MOCK_TASKS,
  MOCK_MOBILE_RELEASES,
  SYSTEM_ROLES,
} from './data/mockData';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  LifeBuoy,
  Code,
  Smartphone,
  ShieldAlert,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';

import {
  collection,
  onSnapshot,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const [currentView, setCurrentView] = useState<'agency_site' | 'management_system' | 'prompt_generator'>('agency_site');
  const [publicSection, setPublicSection] = useState<'inicio' | 'proyectos' | 'nosotros' | 'contactanos'>('inicio');

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_users');
      return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch {
      return MOCK_USERS;
    }
  });
  const [currentUserId, setCurrentUserId] = useState<string>('usr_admin');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Interactive app dataset with Firestore sync & localStorage fallback
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_projects');
      return saved ? JSON.parse(saved) : MOCK_PROJECTS;
    } catch {
      return MOCK_PROJECTS;
    }
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_invoices');
      return saved ? JSON.parse(saved) : MOCK_INVOICES;
    } catch {
      return MOCK_INVOICES;
    }
  });
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_tickets');
      return saved ? JSON.parse(saved) : MOCK_TICKETS;
    } catch {
      return MOCK_TICKETS;
    }
  });
  const [tasks, setTasks] = useState<SprintTask[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_tasks');
      return saved ? JSON.parse(saved) : MOCK_TASKS;
    } catch {
      return MOCK_TASKS;
    }
  });
  const [releases, setReleases] = useState<MobileRelease[]>(MOCK_MOBILE_RELEASES);

  // Firestore Real-Time Subscriptions
  React.useEffect(() => {
    let unsubProjects: (() => void) | null = null;
    let unsubInvoices: (() => void) | null = null;
    let unsubTickets: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;

    try {
      unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
          setProjects(list);
        }
      }, (err) => console.warn('Firestore subscription notice [projects]:', err));

      unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
          setInvoices(list);
        }
      }, (err) => console.warn('Firestore subscription notice [invoices]:', err));

      unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
          setTickets(list);
        }
      }, (err) => console.warn('Firestore subscription notice [tickets]:', err));

      unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SprintTask));
          setTasks(list);
        }
      }, (err) => console.warn('Firestore subscription notice [tasks]:', err));
    } catch (e) {
      console.warn('Firestore subscription initialized locally:', e);
    }

    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubInvoices) unsubInvoices();
      if (unsubTickets) unsubTickets();
      if (unsubTasks) unsubTasks();
    };
  }, []);

  // Auto Sync Effects (Local Backup)
  React.useEffect(() => {
    try { localStorage.setItem('nexus_users', JSON.stringify(users)); } catch {}
  }, [users]);

  React.useEffect(() => {
    try { localStorage.setItem('nexus_projects', JSON.stringify(projects)); } catch {}
  }, [projects]);

  React.useEffect(() => {
    try { localStorage.setItem('nexus_invoices', JSON.stringify(invoices)); } catch {}
  }, [invoices]);

  React.useEffect(() => {
    try { localStorage.setItem('nexus_tickets', JSON.stringify(tickets)); } catch {}
  }, [tickets]);

  React.useEffect(() => {
    try { localStorage.setItem('nexus_tasks', JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  // Active user object
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  // Active Module View inside management system
  const [activeModuleOverride, setActiveModuleOverride] = useState<RoleId | null>(null);
  const activeModuleRole: RoleId = activeModuleOverride || currentUser.role;

  // Handlers for updating user roles & permissions
  const handleUpdateUserPermissions = (userId: string, newPermissions: Record<string, boolean>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions: newPermissions } : u))
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: RoleId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleAddUser = (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const created: UserAccount = {
      ...newUser,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, created]);
    setCurrentUserId(created.id);
    setCurrentView('management_system');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserId(user.id);
    setActiveModuleOverride(null);
    setCurrentView('management_system');
  };

  // Switch user handler
  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    setActiveModuleOverride(null);
  };

  // Data update handlers with Firestore sync
  const handleAddProject = async (newPrj: Omit<Project, 'id'>) => {
    const prj: Project = { ...newPrj, id: `prj_${Date.now()}` };
    setProjects((prev) => [prj, ...prev]);
    try {
      await setDoc(doc(db, 'projects', prj.id), prj);
    } catch (err) {
      console.warn('Firestore write error for project:', err);
    }
  };

  const handleAddInvoice = async (newInv: Omit<Invoice, 'id'>) => {
    const inv: Invoice = { ...newInv, id: `inv_${Date.now()}` };
    setInvoices((prev) => [inv, ...prev]);
    try {
      await setDoc(doc(db, 'invoices', inv.id), inv);
    } catch (err) {
      console.warn('Firestore write error for invoice:', err);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: 'paid' | 'pending' | 'overdue') => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await setDoc(doc(db, 'invoices', id), { status }, { merge: true });
    } catch (err) {
      console.warn('Firestore update error for invoice status:', err);
    }
  };

  const handleAddMessageToTicket = async (ticketId: string, content: string, sender: string) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const updatedTicket = {
      ...targetTicket,
      updatedAt: `10-31 ${timeStr}`,
      messages: [
        ...targetTicket.messages,
        { sender, isClient: false, timestamp: `10-31 ${timeStr}`, content },
      ],
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
    try {
      await setDoc(doc(db, 'tickets', ticketId), updatedTicket);
    } catch (err) {
      console.warn('Firestore write error for ticket message:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'resolved') => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    try {
      await setDoc(doc(db, 'tickets', ticketId), { status }, { merge: true });
    } catch (err) {
      console.warn('Firestore update error for ticket status:', err);
    }
  };

  const handleAddTask = async (newTask: Omit<SprintTask, 'id'>) => {
    const tsk: SprintTask = { ...newTask, id: `tsk_${Date.now()}` };
    setTasks((prev) => [tsk, ...prev]);
    try {
      await setDoc(doc(db, 'tasks', tsk.id), tsk);
    } catch (err) {
      console.warn('Firestore write error for task:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: SprintTask['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      await setDoc(doc(db, 'tasks', taskId), { status }, { merge: true });
    } catch (err) {
      console.warn('Firestore update error for task status:', err);
    }
  };

  const handleAddRelease = (newRel: Omit<MobileRelease, 'id'>) => {
    const rel: MobileRelease = { ...newRel, id: `rel_${Date.now()}` };
    setReleases((prev) => [rel, ...prev]);
  };

  const handlePayInvoice = (id: string) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'paid' } : i)));
    alert('Factura abonada exitosamente.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-900 selection:text-white">
      
      {/* Top Header */}
      <HeaderBar
        currentView={currentView}
        setCurrentView={setCurrentView}
        publicSection={publicSection}
        setPublicSection={setPublicSection}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
        onOpenPermissionMatrix={() => setIsPermissionModalOpen(true)}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Public Agency Landing Showcase */}
        {currentView === 'agency_site' && (
          <PublicLandingPage
            publicSection={publicSection}
            onEnterManagementSystem={() => setCurrentView('management_system')}
            onOpenPromptGenerator={() => setCurrentView('prompt_generator')}
            onOpenLoginModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: Master Prompt Generator Tab */}
        {currentView === 'prompt_generator' && <PromptGeneratorTab />}

        {/* VIEW 3: Management System with Role Modules & RBAC */}
        {currentView === 'management_system' && (
          <div className="space-y-6">
            
            {/* Top Workspace Bar: Active User, Global Search & Module Switcher */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Active User Context Indicator */}
              <div className="flex items-center gap-3 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-xl object-cover border border-purple-500/40 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{currentUser.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({currentUser.jobTitle})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950 px-2 py-0.2 rounded border border-purple-800">
                      Rol: {SYSTEM_ROLES.find((r) => r.id === currentUser.role)?.name}
                    </span>
                    <button
                      onClick={() => setIsPermissionModalOpen(true)}
                      className="text-[10px] text-slate-400 hover:text-purple-300 underline font-medium flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      <span>Ver RBAC ({Object.values(currentUser.permissions).filter(Boolean).length} activas)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Global Search Bar */}
              <div className="flex-1 max-w-md mx-auto w-full">
                <GlobalSearchBar
                  projects={projects}
                  tickets={tickets}
                  tasks={tasks}
                  invoices={invoices}
                  onSelectModule={(roleId) => setActiveModuleOverride(roleId)}
                />
              </div>

              {/* Module Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
                {[
                  { id: 'admin', label: 'Administración', icon: Building2 },
                  { id: 'accounting', label: 'Contabilidad', icon: DollarSign },
                  { id: 'support', label: 'Atención Cliente', icon: LifeBuoy },
                  { id: 'web_dev', label: 'Desarrollo Web', icon: Code },
                  { id: 'mobile_dev', label: 'Desarrollo Móvil', icon: Smartphone },
                  { id: 'qa_devops', label: 'QA & DevOps', icon: ShieldAlert },
                  { id: 'client', label: 'Portal Cliente', icon: UserCheck },
                ].map((mod) => {
                  const IconComp = mod.icon;
                  const isActive = activeModuleRole === mod.id;
                  const isUserDefaultRole = currentUser.role === mod.id;

                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleOverride(mod.id as RoleId)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{mod.label}</span>
                      {isUserDefaultRole && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-300 ml-0.5" title="Rol asignado a su cuenta" />
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Render Selected Module Viewport */}
            {activeModuleRole === 'admin' && (
              <AdminModule
                currentUser={currentUser}
                users={users}
                projects={projects}
                onOpenPermissions={() => setIsPermissionModalOpen(true)}
                onUpdateUserRole={handleUpdateUserRole}
                onAddProject={handleAddProject}
              />
            )}

            {activeModuleRole === 'accounting' && (
              <AccountingModule
                currentUser={currentUser}
                invoices={invoices}
                projects={projects}
                onAddInvoice={handleAddInvoice}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              />
            )}

            {activeModuleRole === 'support' && (
              <SupportModule
                currentUser={currentUser}
                tickets={tickets}
                onAddMessageToTicket={handleAddMessageToTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
              />
            )}

            {activeModuleRole === 'web_dev' && (
              <WebDevModule
                currentUser={currentUser}
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            )}

            {activeModuleRole === 'mobile_dev' && (
              <MobileDevModule
                currentUser={currentUser}
                releases={releases}
                onAddRelease={handleAddRelease}
              />
            )}

            {activeModuleRole === 'qa_devops' && (
              <QaDevOpsModule currentUser={currentUser} />
            )}

            {activeModuleRole === 'client' && (
              <ClientPortalModule
                currentUser={currentUser}
                projects={projects}
                invoices={invoices}
                onPayInvoice={handlePayInvoice}
              />
            )}

          </div>
        )}

      </main>

      {/* Footer with Social Networks */}
      <Footer
        onNavClick={(sec) => {
          setCurrentView('agency_site');
          setPublicSection(sec);
        }}
      />

      {/* Login & User Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleAddUser}
      />

      {/* Role & Granular Permission Matrix Modal */}
      <RolePermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        users={users}
        activeUser={currentUser}
        onUpdateUserPermissions={handleUpdateUserPermissions}
        onUpdateUserRole={handleUpdateUserRole}
        onAddUser={handleAddUser}
      />

    </div>
  );
}
