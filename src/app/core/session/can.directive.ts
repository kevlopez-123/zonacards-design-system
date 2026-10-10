import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Permission, SessionService } from './session.service';

/** Oculta (no deshabilita) lo que el rol no puede hacer: <button *zcCan="'lotes.anular'">… */
@Directive({ selector: '[zcCan]' })
export class CanDirective {
  readonly zcCan = input.required<Permission>();
  private readonly tpl = inject(TemplateRef); private readonly vcr = inject(ViewContainerRef); private readonly s = inject(SessionService);
  constructor() { effect(() => { this.vcr.clear(); if (this.s.can(this.zcCan())) this.vcr.createEmbeddedView(this.tpl); }); }
}
