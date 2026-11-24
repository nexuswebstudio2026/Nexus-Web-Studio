import { useEffect } from 'react';
import { usePublicData } from '../context/PublicDataContext';

export function ProfileFavicon() {
  const { settings } = usePublicData();
  const photoUrl = settings?.authorizedPhotoUrl?.trim();

  useEffect(() => {
    if (!photoUrl) return;

    let favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = /\.jpe?g(?:$|\?)/i.test(photoUrl) ? 'image/jpeg' : 'image/png';
    favicon.href = photoUrl;
  }, [photoUrl]);

  return null;
}
