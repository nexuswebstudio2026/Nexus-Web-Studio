import type { PoliticalRecord, RecordSection, RecordVisibility, SiteSettings } from '../../shared/types';

export const ALLOWED_STATUSES = [
  'Confirmado',
  'En curso',
  'Concluido anticipadamente',
  'Pendiente de confirmación',
  'Aspiración futura',
  'Etapa condicional',
] as const;

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function inferSectionFromText(text: string): RecordSection {
  const norm = text.trim().toLowerCase();
  if (norm.includes('secretar')) return 'secretario_jac';
  if (norm.includes('candidat') || norm.includes('aspiraci') || norm.includes('edil')) return 'aspiracion_edil';
  if (norm.includes('presiden') || norm.includes('junta')) return 'presidente_jac';
  if (norm.includes('nexus')) return 'proyecto_nexus';
  if (norm.includes('proyecto jac')) return 'proyecto_jac';
  if (norm.includes('campaña') || norm.includes('campana') || norm.includes('proyecto edil')) return 'proyecto_edil';
  if (norm.includes('proyecci') || norm.includes('condicional')) return 'proyeccion_edil';
  return 'actividad_jac';
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // Strip control characters and angle-bracket tags to prevent stored XSS payloads
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function validatePoliticalRecordInput(
  raw: Record<string, unknown>
): ValidationResult<Omit<PoliticalRecord, 'id'>> {
  const errors: Record<string, string> = {};

  // Section remains an internal grouping field; users classify entries through the title.
  const textForSection = sanitizeText(`${String(raw.title || '')} ${String(raw.detail || '')}`, 2700);
  const title = sanitizeText(raw.title, 180);
  const chronologyStart = sanitizeText(raw.chronology_start, 120);
  const chronologyEnd = sanitizeText(raw.chronology_end, 120);
  const status = sanitizeText(raw.status, 80);
  const detail = sanitizeText(raw.detail, 2500);
  const rawVisibility = typeof raw.visibility === 'string' ? raw.visibility.trim().toLowerCase() : '';
  const visibility: RecordVisibility = rawVisibility === 'privada' ? 'privada' : 'publica';

  if (!title || title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.';
  }
  if (!chronologyStart) {
    errors.chronology_start = 'Indica la cronología de inicio (puedes escribir "Pendiente de confirmar").';
  }
  if (!status) {
    errors.status = 'El estado es obligatorio.';
  }
  if (!detail || detail.length < 10) {
    errors.detail = 'Los detalles deben tener al menos 10 caracteres.';
  }
  if (rawVisibility !== 'publica' && rawVisibility !== 'privada') {
    errors.visibility = 'La visibilidad debe ser pública o privada.';
  }

  const parsedOrder = Number(raw.sort_order);
  if (!Number.isFinite(parsedOrder) || parsedOrder < 0 || parsedOrder > 9999) {
    errors.sort_order = 'El orden cronológico debe ser un número entre 0 y 9999.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const allowedSections: RecordSection[] = [
    'secretario_jac',
    'presidente_jac',
    'actividad_jac',
    'aspiracion_edil',
    'proyeccion_edil',
    'proyecto_jac',
    'proyecto_nexus',
    'proyecto_edil',
  ];

  const section =
    typeof raw.section === 'string' && allowedSections.includes(raw.section as RecordSection)
      ? (raw.section as RecordSection)
    : inferSectionFromText(textForSection);

  return {
    ok: true,
    data: {
      section,
      title,
      chronology_start: chronologyStart,
      chronology_end: chronologyEnd,
      detail,
      status,
      visibility,
      sort_order: Math.round(parsedOrder),
    },
  };
}

export function isValidHttpUrl(url: string): boolean {
  if (!url) return true; // empty allowed when link is disabled/removed
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidLocalProfilePhotoPath(url: string): boolean {
  return /^\/(?:profile-photo\.png|uploads\/profile-[0-9a-f-]+\.(?:jpg|png|webp))$/i.test(url);
}

export function validateSiteSettingsInput(raw: Record<string, unknown>): ValidationResult<SiteSettings> {
  const errors: Record<string, string> = {};
  const socialRaw = Array.isArray(raw.socialLinks) ? raw.socialLinks : null;
  if (!socialRaw) {
    errors.socialLinks = 'La lista de redes sociales es inválida.';
  }

  const projectsRaw =
    raw.projects && typeof raw.projects === 'object' ? (raw.projects as Record<string, unknown>) : null;
  if (!projectsRaw) {
    errors.projects = 'La sección de proyectos es obligatoria.';
  }

  const socialLinks = (socialRaw || []).map((item, idx) => {
    const obj = (item || {}) as Record<string, unknown>;
    const url = sanitizeText(obj.url, 300);
    if (url && !isValidHttpUrl(url)) {
      errors[`social_${idx}`] = `La URL de ${sanitizeText(obj.network, 40) || 'red social'} debe iniciar con https:// o http://.`;
    }
    return {
      id: sanitizeText(obj.id, 40) || `social_${idx}`,
      network: sanitizeText(obj.network, 40) || 'Red social',
      label: sanitizeText(obj.label, 80) || 'Perfil público',
      url,
      enabled: Boolean(obj.enabled),
    };
  });

  const authorizedPhotoUrl = sanitizeText(raw.authorizedPhotoUrl, 400);
  if (authorizedPhotoUrl && !isValidHttpUrl(authorizedPhotoUrl) && !isValidLocalProfilePhotoPath(authorizedPhotoUrl)) {
    errors.authorizedPhotoUrl = 'La URL de fotografía autorizada debe usar http://, https:// o una ruta local de foto del sitio.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      socialLinks,
      projects: {
        jacSummary: sanitizeText(projectsRaw?.jacSummary, 1600),
        nexusSummary: sanitizeText(projectsRaw?.nexusSummary, 1600),
        edilSummary: sanitizeText(projectsRaw?.edilSummary, 1600),
      },
      personalNote: sanitizeText(raw.personalNote, 2000),
      authorizedPhotoUrl,
      authorizedPhotoCaption: sanitizeText(raw.authorizedPhotoCaption, 220),
    },
  };
}
