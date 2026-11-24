import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { ProfileFavicon } from './components/ProfileFavicon';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicDataProvider } from './context/PublicDataContext';
import { useAutoTheme } from './lib/theme';
import { DashboardPage } from './pages/admin/DashboardPage';
import { HistoriaPage } from './pages/public/HistoriaPage';
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/public/LoginPage';
import { ProyectosPage } from './pages/public/ProyectosPage';
import { VidaAcademicaPage } from './pages/public/VidaAcademicaPage';
import { VidaLaboralPage } from './pages/public/VidaLaboralPage';
import { VidaPoliticaPage } from './pages/public/VidaPoliticaPage';

interface RedirectState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

function resolveDashboardTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from;
  if (from?.pathname && from.pathname.startsWith('/dashboard')) {
    return `${from.pathname}${from.search ?? ''}`;
  }
  return '/dashboard';
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-sm text-[var(--text-muted)]">
        Verificando credenciales de acceso...
      </div>
    );
  }

  if (!session.authenticated) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (!loading && session.authenticated) {
    return <Navigate to={resolveDashboardTarget(location.state)} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  useAutoTheme();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />
      <Route
        path="/vida-academica"
        element={
          <PublicLayout>
            <VidaAcademicaPage />
          </PublicLayout>
        }
      />
      <Route path="/vida-personal" element={<Navigate to="/vida-academica" replace />} />
      <Route
        path="/vida-laboral"
        element={
          <PublicLayout>
            <VidaLaboralPage />
          </PublicLayout>
        }
      />
      <Route
        path="/vida-politica"
        element={
          <PublicLayout>
            <VidaPoliticaPage />
          </PublicLayout>
        }
      />
      <Route
        path="/proyectos"
        element={
          <PublicLayout>
            <ProyectosPage />
          </PublicLayout>
        }
      />
      <Route
        path="/historia"
        element={
          <PublicLayout>
            <HistoriaPage />
          </PublicLayout>
        }
      />
      <Route
        path="/iniciar-sesion"
        element={
          <GuestOnlyRoute>
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PublicDataProvider>
          <ProfileFavicon />
          <AppRoutes />
        </PublicDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
