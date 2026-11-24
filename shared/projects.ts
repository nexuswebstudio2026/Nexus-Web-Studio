import type { ProjectRecord } from './types';

export function sortProjectRecords(records: ProjectRecord[]): ProjectRecord[] {
  return [...records].sort((a, b) => {
    const byOrder = a.sort_order - b.sort_order;
    if (byOrder !== 0) return byOrder;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}
