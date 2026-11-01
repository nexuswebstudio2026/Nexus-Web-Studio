import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Play,
  Layers,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserAccount, MobileRelease } from '../../types';

interface MobileDevModuleProps {
  currentUser: UserAccount;
  releases: MobileRelease[];
  onAddRelease: (newRel: Omit<MobileRelease, 'id'>) => void;
}

export const MobileDevModule: React.FC<MobileDevModuleProps> = ({
  currentUser,
  releases,
  onAddRelease,
}) => {
  const [showAddReleaseModal, setShowAddReleaseModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [version, setVersion] = useState('v2.5.0');

  const canPushBuild = currentUser.permissions['mobile.push_build'];
  const canViewCrashes = currentUser.permissions['mobile.view_crashes'];

  const handleCreateReleaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName) return;

    onAddRelease({
      appName,
      version,
      buildNumber: Math.floor(150 + Math.random() * 50),
      platform,
      track: platform === 'ios' ? 'testflight' : 'play_console_internal',
      status: 'pending_review',
      crashRate: '0.00%',
      releaseDate: '2026-10-31',
    });

    setAppName('');
    setShowAddReleaseModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-cyan-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Módulo de Desarrollo Móvil Native (iOS & Android)
            </span>
            <span className="text-xs text-slate-400 font-mono">Líder: {currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión de Compilaciones, TestFlight & Google Play Console
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Monitoreo de versiones nativas en Swift/React Native/Flutter, matriz de dispositivos y Crashlytics.
          </p>
        </div>

        {canPushBuild && (
          <button
            onClick={() => setShowAddReleaseModal(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Subir Nueva Build IPA/APK</span>
          </button>
        )}
      </div>

      {/* Releases Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Historial de Compilaciones y Despliegues Móviles</span>
          </h2>
          <span className="text-xs text-slate-400">{releases.length} Build Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {releases.map((r) => {
            const isIos = r.platform === 'ios';
            return (
              <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isIos ? (
                      <Apple className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Zap className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-bold text-white">{r.appName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {r.version} (#{r.buildNumber})
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Canal: <strong className="text-white font-mono uppercase">{r.track}</strong></p>
                  <p>Crash Rate: <strong className="text-emerald-400 font-mono">{r.crashRate}</strong></p>
                  <p>Fecha Release: <strong className="text-slate-300 font-mono">{r.releaseDate}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{r.status}</span>
                  </span>
                  <button
                    onClick={() => alert(`Analizando símbolos de debug dSYM para ${r.appName}`)}
                    className="px-2 py-1 bg-slate-900 text-slate-300 rounded hover:bg-slate-800 text-[10px]"
                  >
                    Ver Símbolos dSYM
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Testing Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Matriz de Cobertura de Dispositivos Móviles</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { dev: 'iPhone 16 Pro Max (iOS 18)', res: '460 x 956 @3x', status: 'Passed' },
            { dev: 'Samsung Galaxy S25 Ultra (Android 15)', res: '384 x 854 @3x', status: 'Passed' },
            { dev: 'Google Pixel 9 Pro', res: '412 x 915 @2.75x', status: 'Passed' },
            { dev: 'iPad Pro 13" (M4)', res: '1032 x 1376 @2x', status: 'Passed' },
          ].map((d, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="font-bold text-white block truncate">{d.dev}</span>
              <span className="text-[10px] text-slate-400 font-mono block">{d.res}</span>
              <span className="text-[10px] text-emerald-400 font-bold block">✓ {d.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Release Modal */}
      {showAddReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Subir Nueva Build Móvil</h3>

            <form onSubmit={handleCreateReleaseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre de la App Móvil</label>
                <input
                  type="text"
                  required
                  placeholder="ej. NeoBank Pay iOS"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Plataforma</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ios">Apple iOS (TestFlight / App Store)</option>
                  <option value="android">Google Android (Play Console Internal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Versión Semántica</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReleaseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl"
                >
                  Publicar Build
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
