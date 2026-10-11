import { InjectionToken, type ValueProvider, inject } from '@angular/core';
import type { HlmButtonVariants } from './hlm-button';

export interface BrnButtonConfig {
  variant: HlmButtonVariants['variant'];
  size: HlmButtonVariants['size'];
}

const defaultConfig: BrnButtonConfig = {
  variant: 'default',
  size: 'default',
};

const BrnButtonConfigToken = new InjectionToken<BrnButtonConfig>('BrnButtonConfig');

export function provideBrnButtonConfig(config: Partial<BrnButtonConfig>): ValueProvider {
  return { provide: BrnButtonConfigToken, useValue: { ...defaultConfig, ...config } };
}

export function injectBrnButtonConfig(): BrnButtonConfig {
  return inject(BrnButtonConfigToken, { optional: true }) ?? defaultConfig;
}
