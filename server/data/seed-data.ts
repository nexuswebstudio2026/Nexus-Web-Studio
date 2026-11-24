import type { PoliticalRecord, SiteSettings } from '../../shared/types';

// Minimal local seed data so the application can boot when no Google Sheet is configured.
export const INITIAL_RECORDS: PoliticalRecord[] = [];

export const INITIAL_SETTINGS: SiteSettings = {
  socialLinks: [],
  projects: {
    jacSummary: '',
    nexusSummary: '',
    edilSummary: '',
  },
  personalNote: '',
  authorizedPhotoUrl: '/profile-photo.png',
  authorizedPhotoCaption: '',
};
