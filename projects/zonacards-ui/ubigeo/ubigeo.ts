/** Ubigeo del Perú (INEI): departamento (2 dígitos) › provincia (4) › distrito (6). Datos en `geo/ubigeo-pe.json` (MIT © 2025 MichaelSuarez0). */
export interface UbigeoDepartment { codigo: string; nombre: string }
export interface UbigeoProvince { codigo: string; departamento: string; nombre: string }
export interface UbigeoDistrict { codigo: string; provincia: string; nombre: string; lat?: number; lng?: number }
export interface UbigeoFile {
  pais: string;
  departamentos: UbigeoDepartment[];
  provincias: UbigeoProvince[];
  distritos: UbigeoDistrict[];
}

const push = <T>(map: Map<string, T[]>, key: string, item: T) => {
  const list = map.get(key);
  if (list) list.push(item); else map.set(key, [item]);
};

/** Consulta del árbol con índices por código: las listas de cada nivel salen sin recorrer los 1 891 distritos. */
export class Ubigeo {
  private readonly provinceByDep = new Map<string, UbigeoProvince[]>();
  private readonly districtByProv = new Map<string, UbigeoDistrict[]>();
  private readonly districtByCode = new Map<string, UbigeoDistrict>();
  private readonly provinceByCode = new Map<string, UbigeoProvince>();
  private readonly depByCode = new Map<string, UbigeoDepartment>();

  constructor(readonly file: UbigeoFile) {
    for (const d of file.departamentos) this.depByCode.set(d.codigo, d);
    for (const p of file.provincias) { this.provinceByCode.set(p.codigo, p); push(this.provinceByDep, p.departamento, p); }
    for (const d of file.distritos) { this.districtByCode.set(d.codigo, d); push(this.districtByProv, d.provincia, d); }
  }

  departments(): readonly UbigeoDepartment[] { return this.file.departamentos; }
  provinces(department: string | null): readonly UbigeoProvince[] { return (department && this.provinceByDep.get(department)) || []; }
  districts(province: string | null): readonly UbigeoDistrict[] { return (province && this.districtByProv.get(province)) || []; }
  district(code: string | null): UbigeoDistrict | undefined { return code ? this.districtByCode.get(code) : undefined; }

  /** Departamento, provincia y distrito de un código de distrito (o de provincia o departamento). */
  path(code: string | null): { department?: UbigeoDepartment; province?: UbigeoProvince; district?: UbigeoDistrict } {
    if (!code) return {};
    const district = this.districtByCode.get(code);
    const province = this.provinceByCode.get(district?.provincia ?? code.slice(0, 4));
    const department = this.depByCode.get(province?.departamento ?? code.slice(0, 2));
    return { department, province, district };
  }

  /** "Miraflores, Lima, Lima" (distrito, provincia, departamento). */
  label(code: string | null): string {
    const { department, province, district } = this.path(code);
    return [district?.nombre, province?.nombre, department?.nombre].filter(Boolean).join(', ');
  }
}

const cache = new Map<string, Promise<Ubigeo>>();

/** Descarga el archivo una sola vez por URL. Por defecto `geo/ubigeo-pe.json` (activo del paquete). */
export function loadUbigeo(url = 'geo/ubigeo-pe.json'): Promise<Ubigeo> {
  let p = cache.get(url);
  if (!p) {
    const base = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI;
    p = fetch(new URL(url, base))
      .then(r => {
        if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
        return r.json() as Promise<UbigeoFile>;
      })
      .then(f => new Ubigeo(f));
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}
