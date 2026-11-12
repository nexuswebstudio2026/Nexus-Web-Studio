import test from 'node:test';
import assert from 'node:assert/strict';
import { getModuleTitle, computeSidebarClasses } from './navigation';

test('getModuleTitle returns accurate Spanish labels for role IDs', () => {
  assert.equal(getModuleTitle('admin'), 'Administración');
  assert.equal(getModuleTitle('ai_agents'), 'Agentes de IA');
  assert.equal(getModuleTitle('inbox'), 'Bandeja de entrada');
  assert.equal(getModuleTitle('settings'), 'Configuración');
  assert.equal(getModuleTitle('firebase_crud'), 'Configuración');
  assert.equal(getModuleTitle('unknown_module'), 'Panel de Gestión');
});

test('computeSidebarClasses hides on mobile when isMobileOpen is false while remaining visible on desktop', () => {
  const result = computeSidebarClasses({
    isMobileOpen: false,
    isCollapsed: false,
    sidebarSide: 'left',
  });

  assert.ok(result.asideClasses.includes('hidden'), 'Should have hidden for mobile');
  assert.ok(result.asideClasses.includes('md:flex'), 'Should have md:flex for desktop');
  assert.ok(result.asideClasses.includes('md:w-64'), 'Should have md:w-64 when not collapsed');
  assert.equal(result.backdropClasses, 'hidden');
});

test('computeSidebarClasses collapses on desktop when isCollapsed is true', () => {
  const result = computeSidebarClasses({
    isMobileOpen: false,
    isCollapsed: true,
    sidebarSide: 'left',
  });

  assert.ok(result.asideClasses.includes('md:w-20'));
});

test('computeSidebarClasses displays drawer on mobile with slide animation and backdrop when isMobileOpen is true', () => {
  const resultLeft = computeSidebarClasses({
    isMobileOpen: true,
    isCollapsed: false,
    sidebarSide: 'left',
  });

  assert.ok(resultLeft.asideClasses.includes('fixed inset-y-0'));
  assert.ok(resultLeft.asideClasses.includes('left-0'));
  assert.ok(resultLeft.asideClasses.includes('slide-in-from-left'));
  assert.ok(resultLeft.backdropClasses.includes('fixed inset-0'));

  const resultRight = computeSidebarClasses({
    isMobileOpen: true,
    isCollapsed: false,
    sidebarSide: 'right',
  });

  assert.ok(resultRight.asideClasses.includes('right-0'));
  assert.ok(resultRight.asideClasses.includes('slide-in-from-right'));
});
