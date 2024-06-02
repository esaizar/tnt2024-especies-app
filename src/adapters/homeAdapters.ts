import { TEspecie, TReino } from "@/src/services/especies.service";

export function preparaEspeciesParaHome(especies: TEspecie[]): EspecieHome[] {
  return especies
    .map((especie) => {
      return {
        sp_id: especie.sp_id,
        nombre_cientifico: especie.nombre_cientifico,
        reino: especie.reino,
        imagen: especie.imagen,
      };
    })
    .sort((a, b) => {
      return a.nombre_cientifico.localeCompare(b.nombre_cientifico);
    });
}

export interface EspecieHome {
  sp_id: number;
  reino: TReino;
  nombre_cientifico: string;
  imagen: null | string;
}
