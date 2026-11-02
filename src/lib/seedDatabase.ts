import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_INVOICES,
  MOCK_TICKETS,
  MOCK_TASKS,
} from '../data/mockData';

export async function seedFirestoreDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;

    // Seed Users
    for (const user of MOCK_USERS) {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
      count++;
    }

    // Seed Projects
    for (const project of MOCK_PROJECTS) {
      await setDoc(doc(db, 'projects', project.id), project, { merge: true });
      count++;
    }

    // Seed Invoices
    for (const invoice of MOCK_INVOICES) {
      await setDoc(doc(db, 'invoices', invoice.id), invoice, { merge: true });
      count++;
    }

    // Seed Tickets
    for (const ticket of MOCK_TICKETS) {
      await setDoc(doc(db, 'tickets', ticket.id), ticket, { merge: true });
      count++;
    }

    // Seed Tasks
    for (const task of MOCK_TASKS) {
      await setDoc(doc(db, 'tasks', task.id), task, { merge: true });
      count++;
    }

    console.log(`🎉 Firestore Database successfully seeded with ${count} documents across 5 collections!`);
    return { success: true, count };
  } catch (err: any) {
    console.error('Error seeding Firestore database:', err);
    return { success: false, count: 0, error: err.message || String(err) };
  }
}
