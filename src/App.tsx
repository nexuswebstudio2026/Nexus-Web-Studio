import React, { useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { SidebarNav } from './components/SidebarNav';
import { AuthModal } from './components/AuthModal';
import { RolePermissionModal } from './components/RolePermissionModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PromptGeneratorTab } from './components/PromptGeneratorTab';
import { PublicLandingPage } from './components/PublicLandingPage';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { Footer } from './components/Footer';

import { AdminModule } from './components/modules/AdminModule';
import { InboxModule } from './components/modules/InboxModule';
import { AccountingModule } from './components/modules/AccountingModule';
import { SupportModule } from './components/modules/SupportModule';
import { WebDevModule } from './components/modules/WebDevModule';
import { MobileDevModule } from './components/modules/MobileDevModule';
import { QaDevOpsModule } from './components/modules/QaDevOpsModule';
import { ClientPortalModule } from './components/modules/ClientPortalModule';
import { AiAgentsModule } from './components/modules/AiAgentsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { FirebaseCrudModule } from './components/modules/FirebaseCrudModule';

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
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import {
  collection,
  onSnapshot,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { seedFirestoreDatabase } from './lib/seedDatabase';
import { getModuleTitle } from './utils/navigation';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_logged_in_user_id') || 'usr_admin';
    } catch {
      return 'usr_admin';
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('nexus_logged_in_user_id'));
    } catch {
      return false;
    }
  });

  const [currentView, setCurrentView] = useState<'agency_site' | 'management_system' | 'prompt_generator'>(() => {
    try {
      const savedUserId = localStorage.getItem('nexus_logged_in_user_id');
      const path = decodeURIComponent(window.location.pathname.toLowerCase());
      if (path === '/proyectos' || path === '/nosotros' || path === '/contactanos' || path === '/contáctanos') {
        return 'agency_site';
      }
      return savedUserId ? 'management_system' : 'agency_site';
    } catch {
      return 'agency_site';
    }
  });
  const [publicSection, setPublicSection] = useState<'inicio' | 'proyectos' | 'nosotros' | 'contactanos'>('inicio');

  // Clear legacy local storage caches on mount so Firestore is 100% single source of truth
  React.useEffect(() => {
    try {
      localStorage.removeItem('nexus_projects');
      localStorage.removeItem('nexus_users');
      localStorage.removeItem('nexus_invoices');
      localStorage.removeItem('nexus_tickets');
      localStorage.removeItem('nexus_tasks');
    } catch {}
  }, []);

  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [targetProfileUser, setTargetProfileUser] = useState<UserAccount | null>(null);

  // Synchronize URL routing on mount & popstate
  React.useEffect(() => {
    const handlePopState = () => {
      const path = decodeURIComponent(window.location.pathname.toLowerCase());
      const savedUserId = localStorage.getItem('nexus_logged_in_user_id');

      if (path === '/proyectos') {
        setCurrentView('agency_site');
        setPublicSection('proyectos');
        setIsAuthModalOpen(false);
      } else if (path === '/nosotros') {
        setCurrentView('agency_site');
        setPublicSection('nosotros');
        setIsAuthModalOpen(false);
      } else if (path === '/contactanos' || path === '/contáctanos') {
        setCurrentView('agency_site');
        setPublicSection('contactanos');
        setIsAuthModalOpen(false);
      } else if (path === '/ingresar') {
        if (savedUserId) {
          setCurrentView('management_system');
          setIsAuthModalOpen(false);
        } else {
          setIsAuthModalOpen(true);
        }
      } else if (path === '/sistema' || path === '/admin') {
        setCurrentView('management_system');
        setIsAuthModalOpen(false);
      } else {
        if (savedUserId) {
          setCurrentView('management_system');
        } else {
          setCurrentView('agency_site');
          setPublicSection('inicio');
        }
        setIsAuthModalOpen(false);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL on navigation
  const navigateRoute = (view: 'agency_site' | 'management_system' | 'prompt_generator', sec?: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos', isIngresar?: boolean) => {
    let targetPath = '/';
    if (isIngresar) {
      targetPath = '/ingresar';
    } else if (view === 'management_system') {
      targetPath = '/sistema';
    } else if (view === 'prompt_generator') {
      targetPath = '/prompt-generator';
    } else if (sec === 'proyectos') {
      targetPath = '/proyectos';
    } else if (sec === 'nosotros') {
      targetPath = '/nosotros';
    } else if (sec === 'contactanos') {
      targetPath = '/contactanos';
    } else {
      targetPath = '/';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Interactive app dataset driven directly by Firestore
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [tasks, setTasks] = useState<SprintTask[]>(MOCK_TASKS);
  const [releases, setReleases] = useState<MobileRelease[]>(MOCK_MOBILE_RELEASES);

  // Firestore Real-Time Subscriptions
  React.useEffect(() => {
    let unsubUsers: (() => void) | null = null;
    let unsubProjects: (() => void) | null = null;
    let unsubInvoices: (() => void) | null = null;
    let unsubTickets: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;

    try {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserAccount));
        if (list.length > 0) setUsers(list);
      }, (err) => console.warn('Firestore subscription notice [users]:', err));

      unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        setProjects(list);

        // Detect project modifications from external sources/console and emit webhooks
        if (!snapshot.metadata.hasPendingWrites) {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified') {
              const pData = change.doc.data() as Project;
              const whEvent = {
                id: `wh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                eventType: 'project.updated',
                projectId: change.doc.id,
                projectName: pData.name || 'Proyecto Nexus',
                clientName: pData.clientName || 'Cliente Nexus',
                status: 'dispatched',
                triggeredAgentIds: [],
                summary: `⚡ [WEBHOOK FIRESTORE] Proyecto "${pData.name}" modificado. Avance: ${pData.progress || 0}%, Estado: ${pData.status || 'En Desarrollo'}.`,
                timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
              };
              try {
                await setDoc(doc(db, 'webhook_events', whEvent.id), whEvent);
              } catch (e) {
                console.warn('Notice emitting project update webhook:', e);
              }
            }
          });
        }
      }, (err) => console.warn('Firestore subscription notice [projects]:', err));

      unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));
        if (list.length > 0) setInvoices(list);
      }, (err) => console.warn('Firestore subscription notice [invoices]:', err));

      unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
        if (list.length > 0) setTickets(list);
      }, (err) => console.warn('Firestore subscription notice [tickets]:', err));

      unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SprintTask));
        if (list.length > 0) setTasks(list);
      }, (err) => console.warn('Firestore subscription notice [tasks]:', err));
    } catch (e) {
      console.warn('Firestore subscription initialized locally:', e);
    }

    return () => {
      if (unsubUsers) unsubUsers();
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
  const rawRole = activeModuleOverride || currentUser.role;
  const activeModuleRole: RoleId = ['admin', 'ai_agents', 'inbox', 'firebase_crud', 'settings'].includes(rawRole) ? rawRole : 'admin';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  // Automatically close mobile sidebar when changing modules or views
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [currentView, activeModuleRole]);

  // Sidebar position offset & alignment states
  const [sidebarVerticalOffset, setSidebarVerticalOffset] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexus_sidebar_offset');
      return saved ? parseInt(saved, 10) : 16;
    } catch {
      return 16;
    }
  });

  const [sidebarSide, setSidebarSide] = useState<'left' | 'right'>(() => {
    try {
      return (localStorage.getItem('nexus_sidebar_side') as 'left' | 'right') || 'left';
    } catch {
      return 'left';
    }
  });

  const handleAdjustSidebarOffset = (delta: number) => {
    setSidebarVerticalOffset((prev) => {
      const next = Math.max(0, Math.min(200, prev + delta));
      try {
        localStorage.setItem('nexus_sidebar_offset', next.toString());
      } catch {}
      return next;
    });
  };

  const handleToggleSidebarSide = () => {
    setSidebarSide((prev) => {
      const next = prev === 'left' ? 'right' : 'left';
      try {
        localStorage.setItem('nexus_sidebar_side', next);
      } catch {}
      return next;
    });
  };

  // Handlers for updating user roles & permissions with Firestore sync
  const handleUpdateUserPermissions = async (userId: string, newPermissions: Record<string, boolean>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions: newPermissions } : u))
    );
    try {
      await setDoc(doc(db, 'users', userId), { permissions: newPermissions }, { merge: true });
    } catch (err) {
      console.warn('Firestore write error for user permissions:', err);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: RoleId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
    } catch (err) {
      console.warn('Firestore write error for user role:', err);
    }
  };

  const handleAddUser = async (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const created: UserAccount = {
      ...newUser,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, created]);
    setCurrentUserId(created.id);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('nexus_logged_in_user_id', created.id);
    } catch {}
    setCurrentView('management_system');
    try {
      await setDoc(doc(db, 'users', created.id), created);
    } catch (err) {
      console.warn('Firestore write error for user:', err);
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('nexus_logged_in_user_id', user.id);
    } catch {}
    setActiveModuleOverride(null);
    setCurrentView('management_system');
    if (window.location.pathname === '/' || window.location.pathname === '/ingresar') {
      window.history.pushState({}, '', '/sistema');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('nexus_logged_in_user_id');
    } catch {}
    setIsLoggedIn(false);
    setCurrentView('agency_site');
    setPublicSection('inicio');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  // Switch user handler
  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    try {
      localStorage.setItem('nexus_logged_in_user_id', userId);
    } catch {}
    setActiveModuleOverride(null);
  };

  // Data update handlers with Firestore sync & Webhook Dispatching
  const handleAddProject = async (newPrj: Omit<Project, 'id'>) => {
    const prj: Project = { ...newPrj, id: `prj_${Date.now()}` };
    setProjects((prev) => [prj, ...prev]);
    try {
      await setDoc(doc(db, 'projects', prj.id), prj);

      // Emit Project Created Webhook Event
      const whEvent = {
        id: `wh_${Date.now()}`,
        eventType: 'project.created',
        projectId: prj.id,
        projectName: prj.name,
        clientName: prj.clientName,
        status: 'dispatched',
        triggeredAgentIds: [],
        summary: `✨ [WEBHOOK PROYECTO CREADO] "${prj.name}" para ${prj.clientName}. Presupuesto: $${prj.budget.toLocaleString()} USD.`,
        timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
      };
      await setDoc(doc(db, 'webhook_events', whEvent.id), whEvent);
    } catch (err) {
      console.warn('Firestore write error for project:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const prjTarget = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'projects', projectId));

      if (prjTarget) {
        // Emit Project Deleted Webhook Event
        const whEvent = {
          id: `wh_${Date.now()}`,
          eventType: 'project.deleted',
          projectId,
          projectName: prjTarget.name,
          clientName: prjTarget.clientName,
          status: 'dispatched',
          triggeredAgentIds: [],
          summary: `🗑️ [WEBHOOK PROYECTO ELIMINADO] "${prjTarget.name}" fue eliminado de la base de datos de Firebase.`,
          timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
        };
        await setDoc(doc(db, 'webhook_events', whEvent.id), whEvent);
      }
    } catch (err) {
      console.warn('Firestore delete error for project:', err);
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
      
      {/* Top Header Bar (Only visible outside management system) */}
      {currentView !== 'management_system' && (
        <HeaderBar
          currentView={currentView}
          setCurrentView={setCurrentView}
          publicSection={publicSection}
          setPublicSection={setPublicSection}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          allUsers={users}
          onOpenPermissionMatrix={() => setIsPermissionModalOpen(true)}
          onOpenLoginModal={() => {
            setIsAuthModalOpen(true);
            navigateRoute('agency_site', publicSection, true);
          }}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNavigateRoute={navigateRoute}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Public Agency Landing Showcase */}
        {currentView === 'agency_site' && (
          <PublicLandingPage
            projects={projects}
            publicSection={publicSection}
            onEnterManagementSystem={() => {
              setCurrentView('management_system');
              navigateRoute('management_system');
            }}
            onOpenPromptGenerator={() => {
              setCurrentView('prompt_generator');
              navigateRoute('prompt_generator');
            }}
            onOpenLoginModal={() => {
              setIsAuthModalOpen(true);
              navigateRoute('agency_site', publicSection, true);
            }}
          />
        )}

        {/* VIEW 2: Master Prompt Generator Tab */}
        {currentView === 'prompt_generator' && <PromptGeneratorTab />}

        {/* VIEW 3: Management System Panel with Left/Right Sidebar Nav & RBAC */}
        {currentView === 'management_system' && (
          <div className="w-full space-y-4">
            
            {/* Mobile Navigation Header Bar (Only visible on mobile screens < md) */}
            <div className="md:hidden bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 sticky top-2 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-500/50 bg-white p-0.5 shrink-0 shadow-md">
                  <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black tracking-wider uppercase text-white block truncate">NEXUS PANEL</span>
                  <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span>{getModuleTitle(activeModuleRole)}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer transition-all active:scale-95 border border-purple-400/30"
                aria-label="Abrir menú de navegación"
                title="Abrir menú de navegación lateral"
              >
                <Menu className="w-4 h-4" />
                <span>Menú</span>
              </button>
            </div>

            <div className={`flex flex-col ${sidebarSide === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 items-start w-full`}>
              
              {/* Sidebar Navigation with Position Controls & Responsive Mobile Drawer */}
              <SidebarNav
                activeModuleRole={activeModuleRole}
                setActiveModuleRole={(roleId) => setActiveModuleOverride(roleId)}
                currentUser={currentUser}
                onOpenPermissionMatrix={() => setIsPermissionModalOpen(true)}
                onLogout={handleLogout}
                onGoToLanding={() => {
                  setCurrentView('agency_site');
                  setPublicSection('inicio');
                  navigateRoute('agency_site', 'inicio');
                }}
                onCloseNav={() => {
                  setCurrentView('agency_site');
                  setPublicSection('inicio');
                  navigateRoute('agency_site', 'inicio');
                }}
                onOpenFirebaseCrud={() => setActiveModuleOverride('firebase_crud')}
                verticalOffset={sidebarVerticalOffset}
                onAdjustOffset={handleAdjustSidebarOffset}
                sidebarSide={sidebarSide}
                onToggleSide={handleToggleSidebarSide}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileNavOpen}
                onCloseMobile={() => setIsMobileNavOpen(false)}
              />

              {/* Main Content Viewport */}
              <div className="flex-1 min-w-0 w-full space-y-6">
              
              {/* Top Workspace Header Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                
                {/* Active User Context & Integrated Search */}
                <div
                  onClick={() => {
                    setTargetProfileUser(currentUser);
                    setIsUserProfileModalOpen(true);
                  }}
                  className="flex items-start gap-3 cursor-pointer group p-1 rounded-2xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-amber-500/30"
                  title="Haz clic para ver y editar tu perfil de usuario, teléfono y rol"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover border border-purple-500/40 shrink-0 group-hover:border-amber-400 transition-colors mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        {currentUser.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({currentUser.jobTitle})</span>
                    </div>

                    {/* Debajo de superadministrador: Rol, Ver RBAC, Cerrar Sesión y a la derecha el buscador (Lupa + Ctrl+K) */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-purple-300 font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-800 shrink-0">
                        Rol: {SYSTEM_ROLES.find((r) => r.id === currentUser.role)?.name || 'Usuario'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPermissionModalOpen(true);
                        }}
                        className="text-[10px] text-slate-400 hover:text-purple-300 underline font-medium flex items-center gap-1 shrink-0"
                      >
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>Ver RBAC ({Object.values(currentUser.permissions).filter(Boolean).length} activas)</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="text-[10px] text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 px-2 py-0.5 rounded border border-rose-800/60 transition-colors flex items-center gap-1 shrink-0"
                        title="Cerrar sesión"
                      >
                        <LogOut className="w-3 h-3 text-rose-400" />
                        <span>Cerrar Sesión</span>
                      </button>

                      {/* Buscador Lupa + Ctrl + K a la derecha del botón Cerrar Sesión */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[240px] max-w-md ml-0 sm:ml-2"
                      >
                        <GlobalSearchBar
                          projects={projects}
                          tickets={tickets}
                          tasks={tasks}
                          invoices={invoices}
                          onSelectModule={(roleId) => setActiveModuleOverride(roleId)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Render Selected Module Viewport */}
              {activeModuleRole === 'firebase_crud' && (
                <SettingsModule currentUser={currentUser} initialTab="database" />
              )}

              {activeModuleRole === 'admin' && (
                <AdminModule
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  onOpenPermissions={() => setIsPermissionModalOpen(true)}
                  onUpdateUserRole={handleUpdateUserRole}
                  onOpenUserProfile={(usr) => {
                    setTargetProfileUser(usr);
                    setIsUserProfileModalOpen(true);
                  }}
                  onAddProject={handleAddProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {activeModuleRole === 'inbox' && (
                <InboxModule currentUser={currentUser} />
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

              {activeModuleRole === 'ai_agents' && (
                <AiAgentsModule currentUser={currentUser} />
              )}

              {activeModuleRole === 'settings' && (
                <SettingsModule currentUser={currentUser} />
              )}

            </div>
          </div>
        </div>
        )}

      </main>

      {/* Footer with Social Networks */}
      <Footer
        onNavClick={(sec) => {
          setCurrentView('agency_site');
          setPublicSection(sec);
          navigateRoute('agency_site', sec);
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

      {/* User Profile & Contact Details CRUD Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        targetUser={targetProfileUser || currentUser}
        currentUser={currentUser}
        allUsers={users}
        onUpdateUser={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
        onDeleteUser={(deletedId) => {
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
        }}
        onCreateUser={(newUser) => {
          handleAddUser(newUser);
        }}
        onOpenPermissions={() => setIsPermissionModalOpen(true)}
      />

    </div>
  );
}
