export const ordenarResultado = (resultado_objeto, { sort = false } = {}) => {
  const total = Object.values(resultado_objeto).reduce((acc, i) => acc + i, 0);
  let data = Object.entries(resultado_objeto).map(([opcion, conteo]) => ({
    opcion,
    conteo,
    porcentaje: conteo / total,
  }));
  if (sort) data.sort((a, b) => b.conteo - a.conteo);
  return data;
};
