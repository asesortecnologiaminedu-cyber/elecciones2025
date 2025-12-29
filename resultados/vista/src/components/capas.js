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

export const capa_escuelas = (data) => {
  return {
    source: {
      type: "geojson",
      data: data,
    },
    layer: {
      id: "escuelas",
      type: "circle",
      source: "escuelas",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          3,
          12,
          5,
          16,
          8,
        ],
        "circle-color": [
          "match",
          ["get", "color"],
          "blue",
          "#3b82f6",
          "grey",
          "#9ca3af",
          "#9ca3af",
        ],
        "circle-opacity": 0.7,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.8,
      },
    },
    hover: {
      id: "escuelas_hover",
      type: "circle",
      source: "escuelas",
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          4,
          12,
          7,
          16,
          11,
        ],
      },
    },
  };
};
