/** Requisitos de contraseña (sección m-commerce de index.html). */
export type PasswordRule = 'len' | 'case' | 'num' | 'sym';
export const PASSWORD_RULES: PasswordRule[] = ['len', 'case', 'num', 'sym'];

export function passwordChecks(v: string): Record<PasswordRule, boolean> {
  return { len: v.length >= 8, case: /[a-z]/.test(v) && /[A-Z]/.test(v), num: /\d/.test(v), sym: /[#!$&@%*?._-]/.test(v) };
}

/** 0 = sin evaluar (vacía) · 1 a 4 = baja, media, buena, alta. */
export function passwordScore(v: string): 0 | 1 | 2 | 3 | 4 {
  if (!v) return 0;
  return Math.max(1, Object.values(passwordChecks(v)).filter(Boolean).length) as 1 | 2 | 3 | 4;
}
