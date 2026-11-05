export type RoleId =
  | 'admin'
  | 'inbox'
  | 'accounting'
  | 'support'
  | 'web_dev'
  | 'mobile_dev'
  | 'qa_devops'
  | 'client'
  | 'ai_agents'
  | 'settings'
  | 'firebase_crud';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  source?: 'home_page' | 'contact_page' | string;
  createdAt: string;
  replyNotes?: string;
  repliedAt?: string;
}

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  badgeColor: string;
  defaultModule: string;
  availableModules: string[];
}

export type PermissionCategory =
  | 'Administración & Sistema'
  | 'Finanzas & Contabilidad'
  | 'Soporte & Atención al Cliente'
  | 'Desarrollo Web & DB'
  | 'Desarrollo Móvil & Apps'
  | 'QA & Infraestructura'
  | 'Portal del Cliente';

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: PermissionCategory;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: RoleId;
  avatar: string;
  jobTitle: string;
  department: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  type: 'web' | 'mobile' | 'fullstack';
  status: 'planning' | 'in_development' | 'testing' | 'deployed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  techStack: string[];
  team: string[];
  repoUrl: string;
  liveUrl?: string;
  description?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  project: string;
  amount: number;
  tax: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: string;
  dueDate: string;
  items: { description: string; hours: number; rate: number; total: number }[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  subject: string;
  category: 'web_bug' | 'mobile_crash' | 'database_query' | 'billing' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  assignee: string;
  createdAt: string;
  updatedAt: string;
  messages: { sender: string; isClient: boolean; timestamp: string; content: string }[];
}

export interface SprintTask {
  id: string;
  taskNumber: string;
  title: string;
  projectName: string;
  platform: 'web' | 'mobile' | 'backend' | 'database' | 'devops';
  assigneeName: string;
  status: 'backlog' | 'in_progress' | 'code_review' | 'qa' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  loggedHours: number;
}

export interface MobileRelease {
  id: string;
  appName: string;
  version: string;
  buildNumber: number;
  platform: 'ios' | 'android';
  track: 'testflight' | 'play_console_internal' | 'production';
  status: 'pending_review' | 'approved' | 'released';
  crashRate: string;
  releaseDate: string;
}

export interface PromptGeneratorConfig {
  companyName: string;
  tagline: string;
  techStack: string[];
  selectedRoles: RoleId[];
  additionalModules: string[];
  visualStyle: 'dark_glass' | 'modern_clean' | 'corporate_slate' | 'futuristic_neon';
  targetPlatform: 'google_ai_studio' | 'google_sites' | 'standalone_spa';
  includeGranularRbac: boolean;
  includeEstimator: boolean;
  includeClientPortal: boolean;
}
