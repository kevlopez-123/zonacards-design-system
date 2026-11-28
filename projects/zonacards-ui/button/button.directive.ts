import { Directive, computed, input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@zonacards/ui/core';

/**
 * button[zcButton] · Etiqueta con verbo + objeto ("Crear lote"). Una sola acción principal por vista.
 * Deshabilitado con motivo (tooltip). Solo ícono: requiere aria-label.
 * Sobre una superficie de color primario (barra de acciones masivas, banner), el contenedor lleva la clase zc-on-primary y los
 * botones se invierten solos: primary pasa a blanco con texto de marca; outline, ghost y link a texto claro.
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-button border border-transparent font-medium leading-none transition-[background,border-color,color,transform,scale] duration-150 active:enabled:scale-(--scale-pressed) active:translate-y-px disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled) disabled:bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(127_127_127/.14)_6px_7px)] aria-busy:cursor-progress',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:enabled:bg-[oklch(from_var(--primary)_clamp(0.22,calc(l_-_0.08),1)_c_h)]',
        secondary: 'bg-secondary text-on-secondary hover:enabled:bg-[color-mix(in_srgb,var(--secondary)_85%,var(--bg))]',
        outline: 'border-border-strong bg-surface text-fg hover:enabled:bg-(--state-hover-bg)',
        ghost: 'bg-transparent text-fg hover:enabled:bg-(--state-hover-bg)',
        danger: 'bg-danger text-white hover:enabled:brightness-110 dark:text-black',
        'danger-soft': 'border-danger-bd bg-danger-bg text-danger',
        link: 'h-auto rounded-none px-0 text-fg underline underline-offset-4',
      },
      size: { md: 'h-target px-5 text-body', sm: 'h-target-sm px-4 text-body-sm', icon: 'size-target p-0', 'icon-sm': 'size-target-sm p-0' },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: 'button[zcButton], a[zcButton]',
  host: { '[class]': 'classes()', '[attr.data-variant]': 'variant()', '[attr.aria-busy]': 'loading() || null', '[attr.type]': 'type()' },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariants['variant']>('primary');
  readonly size = input<ButtonVariants['size']>('md');
  readonly block = input(false);
  readonly loading = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly class = input('');
  readonly classes = computed(() => cn(buttonVariants({ variant: this.variant(), size: this.size(), block: this.block() }), this.class()));
}
