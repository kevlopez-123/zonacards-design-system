import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '@zonacards/ui/button';
import { CodeBlockComponent } from '@zonacards/ui/code-block';
import { IconComponent, IconName } from '@zonacards/ui/icon';

interface Card { title: string; text: string; link: string; icon: IconName }

/** Portada: qué es, cómo empezar y a dónde ir. */
@Component({
  selector: 'zc-docs-home',
  imports: [RouterLink, ButtonDirective, CodeBlockComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid max-w-5xl min-w-0 grid-cols-[minmax(0,1fr)] gap-10' },
  template: `
    <section class="grid gap-4">
      <h1 class="text-display font-semibold">Sistema de diseño Zonacards</h1>
      <p class="max-w-[64ch] text-title-sm text-muted">Componentes, tokens y guías para construir paneles SaaS consistentes en Angular 21 y 22: accesibles, en español e inglés, con temas claro y oscuro y cuatro marcas.</p>
      <div class="flex flex-wrap gap-3">
        <a zcButton routerLink="/empezar"><zc-icon name="s:download-minimalistic" [size]="16" />Empezar</a>
        <a zcButton variant="outline" routerLink="/componentes/organismos">Ver componentes</a>
      </div>
    </section>
    <zc-code-block language="bash" title="Instalación" [code]="install" />
    <section class="grid gap-4" aria-labelledby="h-explorar">
      <h2 id="h-explorar" class="text-heading font-semibold">Explorar</h2>
      <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,var(--card-w)),1fr))] gap-4 p-0">
        @for (c of cards; track c.link) {
          <li class="grid">
            <a [routerLink]="c.link" class="grid content-start gap-2 rounded-md border border-border bg-surface p-5 text-fg no-underline transition-colors duration-(--dur-base) ease-standard hover:border-border-strong hover:bg-surface-2">
              <span class="grid size-10 place-items-center rounded-ms bg-surface-2"><zc-icon [name]="c.icon" /></span>
              <strong class="text-title-sm">{{ c.title }}</strong>
              <span class="text-body-sm text-muted">{{ c.text }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
    <section class="grid gap-3" aria-labelledby="h-principios">
      <h2 id="h-principios" class="text-heading font-semibold">Principios</h2>
      <ul class="m-0 grid list-disc gap-2 pl-5 text-body text-muted">
        <li><strong class="text-fg">Componer, no inventar:</strong> cada pantalla se arma con componentes zc-* y tokens; nada de colores, tamaños ni radios fijos.</li>
        <li><strong class="text-fg">Accesible por defecto:</strong> teclado, foco visible, contraste AA y textos para lectores de pantalla en cada componente.</li>
        <li><strong class="text-fg">Móvil primero:</strong> overlays como bottom sheet, listados en tarjetas y áreas táctiles de 56 px.</li>
        <li><strong class="text-fg">Hecho para LatAm:</strong> montos, documentos tributarios, teléfonos y fechas por país, sin ambigüedad de moneda.</li>
      </ul>
    </section>`,
})
export class HomePage {
  readonly install = 'npm install @zonacards/ui @angular/cdk @jsverse/transloco @spartan-ng/brain tailwindcss tw-animate-css flag-icons';
  readonly cards: Card[] = [
    { title: 'Tokens', text: 'Color, tipografía, espacio, capas y movimiento. También en JSON para Figma.', link: '/tokens', icon: 's:pallete-2' },
    { title: 'Componentes', text: 'Más de 100 puntos de entrada con sus variantes, estados y demostraciones.', link: '/componentes/organismos', icon: 's:widget-4' },
    { title: 'API', text: 'Inputs, outputs y métodos de cada componente con un ejemplo real.', link: '/api', icon: 's:code' },
    { title: 'Guía para IA', text: 'La skill que enseña a un asistente de código a usar el sistema.', link: '/guia-ia', icon: 's:magic-stick-3' },
    { title: 'Instalación', text: 'Estilos, assets, traducciones y tema en un proyecto nuevo.', link: '/empezar', icon: 's:download-minimalistic' },
    { title: 'Cambios', text: 'Qué trae cada versión y qué ajuste de la app se puede borrar.', link: '/cambios', icon: 's:history' },
  ];
}
