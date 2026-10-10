/**
 * Filtro de caracteres al escribir o pegar (beforeinput).
 * - Una tecla no permitida se bloquea.
 * - Un texto pegado con caracteres mezclados ("987-654-321") entra y el componente lo limpia en (input).
 * Devuelve true si había caracteres no permitidos, para avisar con FieldComponent.flash().
 */
export function rejectsInput(e: InputEvent, allowed: RegExp): boolean {
  if (!e.data) return false;
  const chars = [...e.data];
  const bad = chars.some(c => !allowed.test(c));
  if (bad && !chars.some(c => allowed.test(c))) e.preventDefault();
  return bad;
}
