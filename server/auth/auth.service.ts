import crypto from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { AuthSessionState } from '../../shared/types';
import type { ServerConfig } from '../config/env';
import {
  hashPassword,
  parseCookieHeader,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './session-token.js';

interface StoredAdminAuth {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthenticatedRequest extends Request {
  adminUser?: string;
}

export class AuthService {
  private readonly authFile: string;
  private readonly recoveryFile: string;
  private envPasswordHash: string | null = null;

  constructor(private readonly config: ServerConfig) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    this.authFile = path.join(config.dataDir, 'admin-auth.json');
    this.recoveryFile = path.join(config.dataDir, 'admin-recovery.json');

    const isScryptHash =
      Boolean(config.adminPasswordHash) &&
      /^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(config.adminPasswordHash!);

    if (isScryptHash && config.adminPasswordHash) {
      this.envPasswordHash = config.adminPasswordHash;
    } else if (config.adminPasswordPlainEnv) {
      // Hash at startup in memory so plaintext never sits in comparisons
      this.envPasswordHash = hashPassword(config.adminPasswordPlainEnv);
    }
  }

  private readLocalAuth(): StoredAdminAuth | null {
    if (!fs.existsSync(this.authFile)) return null;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.authFile, 'utf8')) as StoredAdminAuth;
      if (parsed?.username && parsed?.passwordHash) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  isEnvConfigured(): boolean {
    return Boolean(this.config.adminUsername && this.envPasswordHash);
  }

  getEnvAdminForSheetSync(): { username: string; passwordHash: string } | null {
    if (!this.config.adminUsername || !this.envPasswordHash) return null;
    return { username: this.config.adminUsername, passwordHash: this.envPasswordHash };
  }

  needsInitialSetup(): boolean {
    if (this.isEnvConfigured()) return false;
    return this.readLocalAuth() === null;
  }

  private extractRequestToken(req: Request): string | null {
    const cookies = parseCookieHeader(req.headers.cookie);
    const cookieToken = cookies[SESSION_COOKIE_NAME];
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.slice(7).trim();
      if (bearer) return bearer;
    }
    return null;
  }

  getSessionState(req: Request): AuthSessionState {
    const token = this.extractRequestToken(req);
    const payload = token ? verifySessionToken(token, this.config.sessionSecret) : null;
    return {
      authenticated: Boolean(payload),
      username: payload?.sub ?? null,
      needsInitialSetup: this.needsInitialSetup(),
      envConfigured: this.isEnvConfigured(),
    };
  }

  setupInitialAdmin(username: string, password: string): { ok: boolean; error?: string; username?: string } {
    if (this.isEnvConfigured()) {
      return { ok: false, error: 'Las credenciales administrativas ya están configuradas por variables de entorno.' };
    }
    if (this.readLocalAuth() !== null) {
      return { ok: false, error: 'El acceso administrativo inicial ya fue configurado.' };
    }
    const cleanUser = username.trim();
    if (cleanUser.length < 3 || cleanUser.length > 50) {
      return { ok: false, error: 'El usuario debe tener entre 3 y 50 caracteres.' };
    }
    if (password.length < 8 || password.length > 128) {
      return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }
    const record: StoredAdminAuth = {
      username: cleanUser,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(this.authFile, JSON.stringify(record, null, 2), { mode: 0o600 });
    return { ok: true, username: cleanUser };
  }

  createLocalPasswordRecovery(remoteAddress: string | undefined): {
    ok: boolean; error?: string; code?: string; username?: string;
  } {
    const isLoopback = remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1';
    if (this.config.isProd || !isLoopback) {
      return { ok: false, error: 'La recuperación solo está disponible desde este equipo en modo local.' };
    }
    if (this.isEnvConfigured()) {
      return { ok: false, error: 'Las credenciales están definidas en variables de entorno. Actualiza ADMIN_PASSWORD o ADMIN_PASSWORD_HASH en el archivo .env.' };
    }
    const stored = this.readLocalAuth();
    if (!stored) return { ok: false, error: 'No hay una cuenta local configurada para recuperar.' };

    const code = crypto.randomBytes(24).toString('base64url');
    const recovery = {
      codeHash: crypto.createHash('sha256').update(code).digest('hex'),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
    fs.writeFileSync(this.recoveryFile, JSON.stringify(recovery), { mode: 0o600 });
    return { ok: true, code, username: stored.username };
  }

  resetLocalPassword(remoteAddress: string | undefined, code: string, newPassword: string): {
    ok: boolean; error?: string; username?: string;
  } {
    const isLoopback = remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1';
    if (this.config.isProd || !isLoopback) {
      return { ok: false, error: 'La recuperación solo está disponible desde este equipo en modo local.' };
    }
    if (this.isEnvConfigured()) {
      return { ok: false, error: 'Las credenciales están definidas en variables de entorno. Actualízalas en el archivo .env.' };
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return { ok: false, error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' };
    }
    let recovery: { codeHash?: string; expiresAt?: number; attempts?: number };
    try {
      recovery = JSON.parse(fs.readFileSync(this.recoveryFile, 'utf8'));
    } catch {
      return { ok: false, error: 'Genera un código de recuperación nuevo.' };
    }
    if (!recovery.codeHash || !recovery.expiresAt || recovery.expiresAt < Date.now() || (recovery.attempts || 0) >= 5) {
      fs.rmSync(this.recoveryFile, { force: true });
      return { ok: false, error: 'El código expiró o fue bloqueado. Genera uno nuevo.' };
    }
    const providedHash = crypto.createHash('sha256').update(code).digest();
    const expectedHash = Buffer.from(recovery.codeHash, 'hex');
    if (providedHash.length !== expectedHash.length || !crypto.timingSafeEqual(providedHash, expectedHash)) {
      recovery.attempts = (recovery.attempts || 0) + 1;
      fs.writeFileSync(this.recoveryFile, JSON.stringify(recovery), { mode: 0o600 });
      return { ok: false, error: 'El código de recuperación no es válido.' };
    }
    const stored = this.readLocalAuth();
    if (!stored) return { ok: false, error: 'No hay una cuenta local configurada para recuperar.' };
    fs.writeFileSync(this.authFile, JSON.stringify({
      username: stored.username,
      passwordHash: hashPassword(newPassword),
      createdAt: new Date().toISOString(),
    }, null, 2), { mode: 0o600 });
    fs.rmSync(this.recoveryFile, { force: true });
    return { ok: true, username: stored.username };
  }

  verifyCredentials(username: string, password: string): { ok: boolean; error?: string; username?: string } {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return { ok: false, error: 'Ingresa usuario y contraseña.' };
    }

    if (this.isEnvConfigured() && this.config.adminUsername && this.envPasswordHash) {
      if (cleanUser !== this.config.adminUsername) {
        return { ok: false, error: 'Credenciales inválidas.' };
      }
      if (!verifyPassword(password, this.envPasswordHash)) {
        return { ok: false, error: 'Credenciales inválidas.' };
      }
      return { ok: true, username: cleanUser };
    }

    const stored = this.readLocalAuth();
    if (!stored) {
      return { ok: false, error: 'Aún no se ha configurado el usuario administrador inicial.' };
    }
    if (cleanUser !== stored.username || !verifyPassword(password, stored.passwordHash)) {
      return { ok: false, error: 'Credenciales inválidas.' };
    }
    return { ok: true, username: stored.username };
  }

  async verifyCredentialsWithSheet(
    username: string,
    password: string,
    verifyInSheet?: (
      user: string,
      pass: string,
      verifyHashFn: (pw: string, hash: string) => boolean,
      hashFn: (pw: string) => string
    ) => Promise<'valid' | 'invalid' | 'not_found'>
  ): Promise<{ ok: boolean; error?: string; username?: string }> {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return { ok: false, error: 'Ingresa usuario y contraseña.' };
    }

    if (verifyInSheet) {
      try {
        const sheetOutcome = await verifyInSheet(cleanUser, password, verifyPassword, hashPassword);
        if (sheetOutcome === 'valid') {
          return { ok: true, username: cleanUser };
        }
        if (sheetOutcome === 'invalid') {
          // Allow env fallback only if env credentials match directly
          const envCheck = this.verifyCredentials(cleanUser, password);
          if (envCheck.ok) return envCheck;
          return { ok: false, error: 'Credenciales inválidas.' };
        }
      } catch {
        // Fall through to env/local auth if Google Sheets is temporarily unavailable
      }
    }

    return this.verifyCredentials(cleanUser, password);
  }

  issueSessionCookie(req: Request, res: Response, username: string): string {
    const token = signSessionToken(username, this.config.sessionSecret);
    const isHttps =
      req.secure || req.headers['x-forwarded-proto'] === 'https';

    const options: CookieOptions & { partitioned?: boolean } = {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      ...(isHttps ? { partitioned: true } : {}),
      maxAge: SESSION_TTL_SECONDS * 1000,
      path: '/',
    };
    res.cookie(SESSION_COOKIE_NAME, token, options);
    return token;
  }

  clearSessionCookie(req: Request, res: Response): void {
    const isHttps =
      req.secure || req.headers['x-forwarded-proto'] === 'https';

    const options: CookieOptions & { partitioned?: boolean } = {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      ...(isHttps ? { partitioned: true } : {}),
      path: '/',
    };
    res.clearCookie(SESSION_COOKIE_NAME, options);
  }

  requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = this.extractRequestToken(req);
    const payload = token ? verifySessionToken(token, this.config.sessionSecret) : null;
    if (!payload) {
      res.status(401).json({
        error: 'Sesión no válida o expirada. Inicia sesión para acceder al panel.',
      });
      return;
    }
    req.adminUser = payload.sub;
    next();
  };

  requireSameOriginOnWrite = (req: Request, res: Response, next: NextFunction): void => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }
    const origin = req.headers.origin;
    const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host && !this.config.appUrl.includes(originUrl.host)) {
          res.status(403).json({ error: 'Origen de solicitud no autorizado (protección CSRF).' });
          return;
        }
      } catch {
        res.status(403).json({ error: 'Encabezado Origin inválido.' });
        return;
      }
    }
    next();
  };
}
