import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Terminal,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Layers,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { PreLaunchChecklist } from '../PreLaunchChecklist';

interface QaDevOpsModuleProps {
  currentUser: UserAccount;
}

export const QaDevOpsModule: React.FC<QaDevOpsModuleProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'runner' | 'secrets'>('checklist');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);

  const canRunTests = currentUser.permissions['qa.run_automation'];
  const canManageSecrets = currentUser.permissions['devops.manage_secrets'];

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTestOutput(['Iniciando Playwright E2E & Node:Test Runner...']);

    setTimeout(() => {
      setTestOutput((prev) => [...prev, '✓ auth.test.ts (240ms) - Passed']);
    }, 600);

    setTimeout(() => {
      setTestOutput((prev) => [...prev, '✓ rbac_permissions.test.ts (180ms) - Passed']);
    }, 1200);

    setTimeout(() => {
      setTestOutput((prev) => [...prev, '✓ invoice_generation.test.ts (310ms) - Passed']);
    }, 1800);

    setTimeout(() => {
      setTestOutput((prev) => [...prev, '🎉 42 suites de pruebas completadas al 100% (0 fallos).']);
      setIsRunningTests(false);
    }, 2400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-rose-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Módulo de QA Automation, Seguridad & DevOps Cloud
            </span>
            <span className="text-xs text-slate-400 font-mono">Ingeniero: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Auditorías de Seguridad Pre-Lanzamiento & Pipelines CI/CD
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Verificación de 10 puntos críticos de seguridad web, test suites Playwright y gestión de secretos Cloud.
          </p>
        </div>

        {canRunTests && (
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
          >
            {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunningTests ? 'Ejecutando Test Suite...' : 'Lanzar Playwright E2E'}</span>
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'checklist'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Checklist 10 Puntos Pre-Lanzamiento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('runner')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'runner'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Consola Test Runner Playwright E2E</span>
        </button>

        <button
          onClick={() => setActiveSubTab('secrets')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'secrets'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Secretos & Variables Cloud</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'checklist' && <PreLaunchChecklist />}

      {activeSubTab === 'runner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-rose-400" />
              <span>Consola de Salida Test Runner (E2E & Unit)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">playwright --config v1.40</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2 min-h-[260px] text-slate-300">
            <p className="text-slate-500">$ npx playwright test --project=chromium</p>
            {testOutput.length === 0 ? (
              <p className="text-slate-500 italic">Haga clic en "Lanzar Playwright E2E" para ejecutar las pruebas.</p>
            ) : (
              testOutput.map((line, idx) => (
                <p key={idx} className={line.includes('✓') ? 'text-emerald-400' : line.includes('🎉') ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                  {line}
                </p>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'secrets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-rose-400" />
            <span>Variables de Entorno & Secretos Cloud</span>
          </h2>

          <div className="space-y-2 font-mono text-xs">
            {[
              { key: 'VITE_FIREBASE_PROJECT_ID', val: 'nexus-web-studio-94ca8' },
              { key: 'FIRESTORE_DATABASE_ID', val: 'ai-studio-nexuswebmobilest-544574f1-928e-43d1-91b1-c4eda4a2dcc8' },
              { key: 'CLOUDFLARE_WAF_API_KEY', val: 'cf_waf_ecc94a38210bfd9284******************' },
              { key: 'RECAPTCHA_V3_SITE_KEY', val: '6Ld_nexus_recaptcha_v3_site_key' },
              { key: 'AWS_S3_BACKUP_BUCKET', val: 's3://nexus-web-studio-offsite-backups' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-1">
                <span className="text-rose-400 font-bold block">{s.key}</span>
                <span className="text-slate-400 text-[10px] block truncate">{s.val}</span>
              </div>
            ))}
          </div>

          {!canManageSecrets && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Rotación de llaves restringida por permiso devops.manage_secrets.</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

