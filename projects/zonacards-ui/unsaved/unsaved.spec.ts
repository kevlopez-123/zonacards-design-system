import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmService } from './confirm.service';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

const run = (page: HasUnsavedChanges | null) =>
  TestBed.runInInjectionContext(() => unsavedChangesGuard(page as HasUnsavedChanges, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot));

describe('Cambios sin guardar', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [{ provide: TranslocoService, useValue: { translate: (k: string) => k } }] }));

  it('deja salir si no hay cambios', () => {
    expect(run({ hasUnsavedChanges: () => false })).toBe(true);
    expect(run(null)).toBe(true);
    expect(TestBed.inject(ConfirmService).current()).toBeNull();
  });

  it('pregunta y devuelve lo que se elige', async () => {
    const svc = TestBed.inject(ConfirmService);
    const stay = run({ hasUnsavedChanges: () => true }) as Promise<boolean>;
    expect(svc.current()?.title).toBe('ui.sinGuardar.titulo');
    expect(svc.current()?.confirmLabel).toBe('ui.sinGuardar.salir');
    svc.answer(false);
    expect(await stay).toBe(false);
    expect(svc.current()).toBeNull();

    const leave = run({ hasUnsavedChanges: () => true }) as Promise<boolean>;
    svc.answer(true);
    expect(await leave).toBe(true);
  });

  it('una confirmación nueva cancela la anterior', async () => {
    const svc = TestBed.inject(ConfirmService);
    const first = svc.ask({ title: 'a', confirmLabel: 'ok', cancelLabel: 'no' });
    const second = svc.ask({ title: 'b', confirmLabel: 'ok', cancelLabel: 'no' });
    expect(await first).toBe(false);
    expect(svc.current()?.title).toBe('b');
    svc.answer(true);
    expect(await second).toBe(true);
  });
});
