import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, resource, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SkeletonComponent } from '@zonacards/ui/skeleton';

/** Guías del paquete: se importan como texto (loader .md en angular.json) y se cargan solo al abrir su página. */
const DOCS: Record<string, () => Promise<{ default: string }>> = {
  setup: () => import('../../../zonacards-ui/skills/zonacards-ui/references/setup.md'),
  readme: () => import('../../../zonacards-ui/README.md'),
  api: () => import('../../../zonacards-ui/skills/zonacards-ui/references/api.md'),
  skill: () => import('../../../zonacards-ui/skills/zonacards-ui/SKILL.md'),
  checklist: () => import('../../../zonacards-ui/skills/zonacards-ui/references/checklist.md'),
  changelog: () => import('../../../zonacards-ui/CHANGELOG.md'),
};

/**
 * Página de una guía en Markdown. El contenido es del propio repositorio (no de usuarios): se convierte con marked y se marca como
 * seguro. Los enlaces relativos entre guías (references/api.md) se reescriben a las rutas del sitio.
 */
@Component({
  selector: 'zc-docs-markdown',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    @if (html.hasValue()) {
      <article #body class="zc-prose" [innerHTML]="html.value()"></article>
    } @else if (html.error()) {
      <p class="text-body text-danger">No se pudo cargar la guía.</p>
    } @else {
      <div class="grid max-w-[76ch] gap-3"><zc-skeleton variant="block" class="h-10 w-2/3" /><zc-skeleton variant="block" class="h-48" /></div>
    }`,
})
export class MarkdownPage {
  readonly doc = input.required<string>();
  private readonly sanitizer = inject(DomSanitizer);
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  readonly html = resource<SafeHtml, string>({
    params: () => this.doc(),
    loader: async ({ params }) => {
      const [{ default: src }, { marked }] = await Promise.all([DOCS[params](), import('marked')]);
      const linked = src.replace(/\]\((?:\.\.\/)*(?:references\/)?(api|setup|checklist|components)\.md\)/g, (_, n: string) =>
        `](/${({ api: 'api', setup: 'empezar', checklist: 'revision', components: 'componentes' } as Record<string, string>)[n]})`);
      // Contenido propio del repositorio, no de usuarios.
      return this.sanitizer.bypassSecurityTrustHtml(await marked.parse(linked, { gfm: true }));
    },
  });

  constructor() {
    // Los encabezados reciben un id para enlazar secciones (#zc-select).
    effect(() => {
      const el = this.body()?.nativeElement; if (!el || !this.html.hasValue()) return;
      queueMicrotask(() => el.querySelectorAll('h2, h3').forEach(h => {
        if (!h.id) h.id = (h.textContent ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      }));
    });
  }
}

