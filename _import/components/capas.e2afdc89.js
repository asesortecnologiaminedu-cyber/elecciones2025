// Etiquetas referenciales sobre el mapa
export const capa_etiquetas = (tiles) => {
  return {
    source: {
      type: "raster",
      tiles: [tiles],
      tileSize: 256,
    },
    layer: {
      id: "etiquetas",
      type: "raster",
      source: "etiquetas",
      paint: {
        "raster-opacity": 0.8,
      },
    },
  };
};

export const capa_recintos = (data, campo_radio, coloreado, campo_hover) => {
  return {
    source: {
      type: "geojson",
      data: data,
    },
    layer: {
      id: "recintos",
      type: "circle",
      source: "recintos",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          [
            "min",
            2,
            ["max", 1, ["*", 0.03, ["to-number", ["get", campo_radio]]]],
          ],
          12,
          [
            "min",
            7,
            ["max", 2, ["*", 0.02, ["to-number", ["get", campo_radio]]]],
          ],
          16,
          [
            "min",
            21,
            ["max", 3, ["*", 0.08, ["to-number", ["get", campo_radio]]]],
          ],
        ],
        "circle-color": coloreado,
        "circle-opacity": 0.5,
      },
    },
    hover: {
      id: "recintos_hover",
      type: "circle",
      source: "recintos",
      filter: ["!=", ["get", campo_hover], null],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          [
            "*",
            1.3,
            [
              "min",
              2,
              ["max", 1, ["*", 0.03, ["to-number", ["get", campo_radio]]]],
            ],
          ],
          12,
          [
            "*",
            1.3,
            [
              "min",
              7,
              ["max", 2, ["*", 0.02, ["to-number", ["get", campo_radio]]]],
            ],
          ],
          16,
          [
            "*",
            1.3,
            [
              "min",
              21,
              ["max", 3, ["*", 0.08, ["to-number", ["get", campo_radio]]]],
            ],
          ],
        ],
      },
    },
  };
};
