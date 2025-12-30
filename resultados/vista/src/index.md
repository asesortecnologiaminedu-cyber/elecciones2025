---
theme: dashboard
title: Bolivia 2025
toc: false
sidebar: false
---

<link 
  rel="stylesheet" 
  type="text/css" 
  href="https://unpkg.com/maplibre-gl@4.0.2/dist/maplibre-gl.css"
>

<link 
  rel="stylesheet" 
  type="text/css" 
  href="index.css"
>

<div class="header">
  <div class="title">Bolivia 2025</div>
</div>

<div id="mapa"></div>


```js
const vueltas_folder = {
  primera: "resultados/datos/",
  segunda: "resultados/datos/segunda_vuelta/",
};
const vuelta = "segunda";
```

```js
// Dependencias externas
import maplibregl from "npm:maplibre-gl";
import { FileAttachment } from "observablehq:stdlib";
```

```js
// Módulos locales
import { partidos, formatos } from "./components/definiciones.js";
import { capa_etiquetas, capa_recintos, capa_escuelas } from "./components/capas.js";
import {
  crearMapa,
  actualizarCapas,
  colormap_categorias,
  colormap_lineal,
} from "./components/mapa.js";
import { ordenarResultado } from "./components/helpers.js";
```

```js
// Definir vistas
const vistas = {
  validos: {
    colores: {
      fondo: "#ffffffdd",
      texto_fuerte: "#000",
      texto_suave: "#a0a0a0ff",
      fondo_suave: "#ccc",
      invert: 0,
    },
    texto: {
      subtitulo: "Votos para presidente",
      descripcion:
        "Cada punto es un recinto cuyo color representa a la organización ganadora y cuyo tamaño al número de votos válidos"
    },
    mapa: {
      estilo:
        "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
      etiquetas:
        "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
      radio: "validos",
    },
    datos: {
      campo_resultado: "r",
    },
  },
  participacion: {
    colores: {
      fondo: "#000000ff",
      texto_fuerte: "#fbfbfbff",
      texto_suave: "#e9e9e9ff",
      fondo_suave: "#5a5a5aff",
      invert: 1,
    },
    texto: {
      subtitulo:
        "Participación electoral",
      descripcion:
        "Cada punto es un recinto cuyo color representa al porcentaje de votos nulos + blancos sobre el total de habilitados y cuyo tamaño al número de votos habilitados"
    },
    mapa: {
      estilo:
        "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
      etiquetas:
        "https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png",
      radio: "total",
    },
    datos: {
      campo_resultado: "p",
    },
  },
};
```

```js
// Seleccionar vista
const vista = "validos";
```

```js
const v = vistas[vista];
```

```js
// Definir colores para puntos
const recinto_colores = {
  validos: colormap_categorias(
    "partido",
    Object.entries(partidos).map(([k, v]) => [k, v.colores[0]]),
    {
      fallback: "#ccc",
    }
  ),
  participacion: colormap_lineal("invalido", [
    [0, "#09151fff"],
    [0.25, "#20554bff"],
    [0.5, "#7dae61ff"],
    [0.7, "#bcdf77ff"],
    [0.9, "#f4ff90ff"],
  ]),
};
```


```js
// Crear mapa
const map = crearMapa("#mapa");
invalidation.then(() => map.remove());
const popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
});
const popupEscuela = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
});
```


```js
// Actualizar definiciones de estilo con la vista
const actualizarCSS = function (values) {
  Object.entries(values).forEach(([key, value]) =>
    document.documentElement.style.setProperty(`--${key}`, value)
  );
};
actualizarCSS(v.colores);
```

```js
// Inicializar variables (se actualizarán después de cargar los datos)
let recintos = null;
let resultados = null;
let timestamp = null;
let progreso = null;

// Cargar datos
const gh = `https://raw.githubusercontent.com/datosbolivia/elecciones2025/refs/heads/main/${vueltas_folder[vuelta]}`;
recintos = await d3.json(`${gh}recintos.geojson`);
resultados = await d3.json(`${gh}resultados.json`);
timestamp = await fetch(`${gh}timestamp`).then((r) => r.text());
progreso = await fetch(`${gh}progreso`).then((r) => r.text());

// Cargar datos de unidades escolares (desde la carpeta base datos, no específica de vuelta)
// Intentar cargar desde GitHub, si falla intentar desde archivo local
let dataEscuelas = null;
let fronteraEscuelas = null;

try {
  const ghBase = `https://raw.githubusercontent.com/datosbolivia/elecciones2025/refs/heads/main/resultados/datos/`;
  dataEscuelas = await d3.json(`${ghBase}data.json`);
} catch (e) {
  // Si falla, intentar cargar desde archivo local
  try {
    dataEscuelas = await FileAttachment("datos/data.json").json();
    console.log("✓ Cargado data.json desde archivo local");
  } catch (e2) {
    console.warn("No se pudo cargar data.json de unidades escolares:", e2);
    dataEscuelas = null;
  }
}

try {
  const ghBase = `https://raw.githubusercontent.com/datosbolivia/elecciones2025/refs/heads/main/resultados/datos/`;
  const text = await fetch(`${ghBase}unidades_educativas_frontera.json`).then((r) => r.text());
  // Reemplazar NaN con null para hacer el JSON válido
  // Usar múltiples pasadas para asegurar que todos los casos sean capturados
  let cleanedText = text.replace(/:\s*NaN\s*,/g, ': null,');
  cleanedText = cleanedText.replace(/:\s*NaN\s*\}/g, ': null}');
  cleanedText = cleanedText.replace(/:\s*NaN\s*\]/g, ': null]');
  fronteraEscuelas = JSON.parse(cleanedText);
} catch (e) {
  // Si falla, intentar cargar desde archivo local
  try {
    const text = await FileAttachment("datos/unidades_educativas_frontera.json").text();
    // Reemplazar NaN con null para hacer el JSON válido
    // Usar múltiples pasadas para asegurar que todos los casos sean capturados
    let cleanedText = text.replace(/:\s*NaN\s*,/g, ': null,');
    cleanedText = cleanedText.replace(/:\s*NaN\s*\}/g, ': null}');
    cleanedText = cleanedText.replace(/:\s*NaN\s*\]/g, ': null]');
    fronteraEscuelas = JSON.parse(cleanedText);
    console.log("✓ Cargado unidades_educativas_frontera.json desde archivo local");
  } catch (e2) {
    console.warn("No se pudo cargar unidades_educativas_frontera.json:", e2);
    fronteraEscuelas = null;
  }
}

// Cargar CSV de unidades educativas cercanas a la frontera
let csvEscuelas = null;
try {
  const ghBase = `https://raw.githubusercontent.com/datosbolivia/elecciones2025/refs/heads/main/resultados/datos/`;
  const response = await fetch(`${ghBase}UEducativas_cercanas_frontera_bolivia.csv`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const csvText = await response.text();
  csvEscuelas = d3.csvParse(csvText);
  if (csvEscuelas && csvEscuelas.length > 0) {
    console.log(`✓ Cargado CSV desde GitHub: ${csvEscuelas.length} escuelas`);
  } else {
    throw new Error("CSV vacío o inválido");
  }
} catch (e) {
  console.warn("Error cargando CSV desde GitHub, intentando archivo local:", e.message);
  try {
    const csvFile = FileAttachment("datos/UEducativas_cercanas_frontera_bolivia.csv");
    const csvText = await csvFile.text();
    csvEscuelas = d3.csvParse(csvText);
    if (csvEscuelas && csvEscuelas.length > 0) {
      console.log(`✓ Cargado CSV desde archivo local: ${csvEscuelas.length} escuelas`);
    } else {
      throw new Error("CSV vacío o inválido");
    }
  } catch (e2) {
    console.warn("No se pudo cargar UEducativas_cercanas_frontera_bolivia.csv:", e2);
    csvEscuelas = null;
  }
}

// Crear lookup map del CSV por cod_ue_id (store both string and number keys for flexibility)
const csvEscuelasMap = new Map();
if (csvEscuelas) {
  for (const row of csvEscuelas) {
    const id = row.cod_ue_id;
    // Store with both string and number keys to handle type mismatches
    csvEscuelasMap.set(String(id), row);
    if (!isNaN(Number(id))) {
      csvEscuelasMap.set(Number(id), row);
    }
  }
  console.log(`✓ CSV lookup map creado con ${csvEscuelasMap.size / 2} escuelas (string + number keys)`);
}

// Crear GeoJSON para unidades escolares (solo si los datos están disponibles)
const escuelas = (() => {
  if (!dataEscuelas && !fronteraEscuelas) return null;
  
  const escuelasLookup = new Map();
  if (dataEscuelas && dataEscuelas.schools) {
    for (const school of dataEscuelas.schools) {
      escuelasLookup.set(school.cod_ue_id, school);
    }
  }

  const escuelasFeatures = [];

  // Agregar escuelas de data.json (azules)
  if (dataEscuelas && dataEscuelas.schools) {
    for (const school of dataEscuelas.schools) {
      const lat = parseFloat(school.latitude || school.Latitud);
      const lng = parseFloat(school.longitude || school.Longitud);
      
      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        continue;
      }
      
      escuelasFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          cod_ue_id: school.cod_ue_id,
          name: school.name || school.desc_ue,
          color: "blue",
          data: school,
        },
      });
    }
  }

  // Agregar escuelas de frontera que NO están en data.json (grises)
  if (fronteraEscuelas && fronteraEscuelas.schools) {
    for (const school of fronteraEscuelas.schools) {
      // Saltar si ya está en data.json
      if (escuelasLookup.has(school.cod_ue_id)) {
        continue;
      }
      
      const lat = parseFloat(school.latitude);
      const lng = parseFloat(school.longitude);
      
      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        continue;
      }
      
      escuelasFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          cod_ue_id: school.cod_ue_id,
          name: school.desc_ue,
          color: "grey",
          frontera_data: school,
        },
      });
    }
  }

  const result = {
    type: "FeatureCollection",
    features: escuelasFeatures,
  };
  
  console.log(`✓ GeoJSON de escuelas creado: ${escuelasFeatures.length} escuelas`);
  if (dataEscuelas) {
    console.log(`  - ${dataEscuelas.schools ? dataEscuelas.schools.length : 0} escuelas en data.json`);
  }
  if (fronteraEscuelas) {
    console.log(`  - ${fronteraEscuelas.schools ? fronteraEscuelas.schools.length : 0} escuelas en frontera`);
  }
  
  return result;
})();

// Resultados a nivel global
function resultadoGlobal(resultados, key) {
  return Object.values(resultados).reduce((acc, resultado) => {
    for (const [opcion, votos] of Object.entries(resultado[key])) {
      acc[opcion] = (acc[opcion] || 0) + votos;
    }
    return acc;
  }, {});
}
const resultados_globales = {
  validos: resultadoGlobal(resultados, "r"),
  participacion: resultadoGlobal(resultados, "p"),
};

// Calcular resultado_global ahora que tenemos resultados_globales
const resultado_global = plotResultado(resultados_globales[vista], {
  fontSizeMultiplier: 0.8,
});

// Ahora que tenemos los datos, definir y aplicar las capas
const capas = {
  etiquetas: capa_etiquetas(v.mapa.etiquetas),
  recintos: capa_recintos(
    recintos,
    v.mapa.radio,
    recinto_colores[vista],
    "partido"
  ),
};

// Agregar capa de escuelas solo si hay datos disponibles
if (escuelas && escuelas.features.length > 0) {
  capas.escuelas = capa_escuelas(escuelas);
}

// Aplicar capas
const capasConfig = {
  sources: ["recintos", "etiquetas"],
  layers: ["recintos", "etiquetas"],
  hover: { recintos_hover: "recintos" },
};

// Agregar escuelas a la configuración solo si están disponibles
if (escuelas && escuelas.features.length > 0) {
  capasConfig.sources.push("escuelas");
  capasConfig.layers.push("escuelas");
  capasConfig.hover.escuelas_hover = "escuelas";
}

await actualizarCapas(map, v.mapa.estilo, capas, capasConfig);
```

```js
// Hidratar coordenadas de recintos con datos de resultados
if (recintos && resultados) {
  for (const feature of recintos.features) {
    // Código de recinto
    const codigo = feature.properties.c;
    const resultado = resultados[codigo];
  // Total de votos válidos
  feature.properties.validos = resultado
    ? Object.values(resultado.r).reduce((s, v) => s + v, 0)
    : 0;
  // Total de habilitados
  feature.properties.total = resultado
    ? Object.values(resultado.p).reduce((s, v) => s + v, 0)
    : 0;
  // Partido ganador
  feature.properties.partido = resultado?.g ?? null;
    // Porcentaje de votos nulos + blancos / habilitados
    feature.properties.invalido = resultado?.p
      ? (resultado.p.b + resultado.p.n) /
        (resultado.p.b + resultado.p.n + resultado.p.v)
      : null;
  }
}
```


```js
// Popups
let locked = false;
const mouseenter = function (e) {
  if (!resultados) return;
  map.getCanvas().style.cursor = "pointer";
  const feature = e.features[0];
  const resultado = resultados[feature.properties.c] ?? null;
  if (!resultado) return;
  // Close escuela popup if it's open (recintos take priority)
  if (!lockedEscuela) popupEscuela.remove();
  const grafico = plotResultado(resultado[v.datos.campo_resultado]);
  popup
    .setHTML(
      `<div class="popup_plot">
    <div class="popup_header">${resultado ? resultado.n : ""}</div>
    ${grafico.outerHTML}
    </div>`
    )
    .setLngLat(feature.geometry.coordinates)
    .addTo(map);
};

const mouseleave = function () {
  map.getCanvas().style.cursor = "";
  if (!locked) popup.remove();
};

map.on("mouseenter", "recintos_hover", mouseenter);
map.on("mouseleave", "recintos_hover", mouseleave);
map.on("click", "recintos_hover", () => {
  locked = true;
});
map.on("click", (e) => {
  if (
    !map.queryRenderedFeatures(e.point, { layers: ["recintos_hover"] }).length
  ) {
    locked = false;
    popup.remove();
  }
});

// Popups para escuelas
let lockedEscuela = false;

const mouseenterEscuela = function (e) {
  map.getCanvas().style.cursor = "pointer";
  const feature = e.features[0];
  const props = feature.properties;
  const cod_ue_id = String(props.cod_ue_id || "");
  
  // Get data from CSV first, fallback to other sources
  // Try both string and number lookup
  const csvData = csvEscuelasMap.get(cod_ue_id) || csvEscuelasMap.get(Number(cod_ue_id));
  const schoolData = csvData || props.data || props.frontera_data;
  
  // Close recinto popup if it's open (but don't block escuela popup)
  if (!locked) popup.remove();
  
  let html = `<div class="popup_plot">`;
  
  // Get title from CSV or fallback
  const title = csvData ? csvData.desc_ue : (props.name || schoolData?.desc_ue || schoolData?.name || cod_ue_id || "Escuela");
  html += `<div class="popup_header">${title}</div>`;
  html += `<div style="padding: 10px; font-family: Inter; font-size: 0.9em; color: var(--texto_fuerte);">`;
  
  // Mostrar información del CSV - mostrar todos los campos
  if (csvData) {
    html += `<div style="margin-bottom: 8px;"><strong>Código:</strong> ${csvData.cod_ue_id || ""}</div>`;
    html += `<div style="margin-bottom: 8px;"><strong>Nombre:</strong> ${csvData.desc_ue || ""}</div>`;
    html += `<div style="margin-bottom: 8px;"><strong>Distrito:</strong> ${csvData.distrito || ""}</div>`;
    html += `<div style="margin-bottom: 8px;"><strong>Área:</strong> ${csvData.area || ""}</div>`;
    html += `<div style="margin-bottom: 8px;"><strong>Departamento:</strong> ${csvData.desc_departamento || ""}</div>`;
    html += `<div style="margin-bottom: 8px;"><strong>Estado:</strong> ${csvData.estadoinstitucion || ""}</div>`;
    if (csvData.latitud) {
      html += `<div style="margin-bottom: 8px;"><strong>Latitud:</strong> ${csvData.latitud}</div>`;
    }
    if (csvData.longitud) {
      html += `<div style="margin-bottom: 8px;"><strong>Longitud:</strong> ${csvData.longitud}</div>`;
    }
  } else if (schoolData) {
    // Fallback: mostrar información disponible
    if (schoolData.cod_ue_id) {
      html += `<div style="margin-bottom: 8px;"><strong>Código:</strong> ${schoolData.cod_ue_id}</div>`;
    }
    if (schoolData.desc_ue || schoolData.name) {
      html += `<div style="margin-bottom: 8px;"><strong>Nombre:</strong> ${schoolData.desc_ue || schoolData.name}</div>`;
    }
    if (schoolData.desc_departamento || schoolData.departamento) {
      html += `<div style="margin-bottom: 8px;"><strong>Departamento:</strong> ${schoolData.desc_departamento || schoolData.departamento}</div>`;
    }
    if (schoolData.distrito) {
      html += `<div style="margin-bottom: 8px;"><strong>Distrito:</strong> ${schoolData.distrito}</div>`;
    }
    if (schoolData.area) {
      html += `<div style="margin-bottom: 8px;"><strong>Área:</strong> ${schoolData.area}</div>`;
    }
    if (schoolData.estadoinstitucion) {
      html += `<div style="margin-bottom: 8px;"><strong>Estado:</strong> ${schoolData.estadoinstitucion}</div>`;
    }
  } else {
    // Show at least the cod_ue_id if we have it
    if (cod_ue_id) {
      html += `<div style="margin-bottom: 8px;"><strong>Código:</strong> ${cod_ue_id}</div>`;
    }
    html += `<div style="margin-bottom: 8px;">Información no disponible</div>`;
  }
  
  html += `</div></div>`;
  
  popupEscuela
    .setHTML(html)
    .setLngLat(feature.geometry.coordinates)
    .addTo(map);
};

const mouseleaveEscuela = function () {
  map.getCanvas().style.cursor = "";
  if (!lockedEscuela) popupEscuela.remove();
};

// Registrar handlers para escuelas solo si la capa existe
if (escuelas && escuelas.features && escuelas.features.length > 0) {
  map.on("mouseenter", "escuelas_hover", mouseenterEscuela);
  map.on("mouseleave", "escuelas_hover", mouseleaveEscuela);
  map.on("click", "escuelas_hover", () => {
    lockedEscuela = true;
  });
}

map.on("click", (e) => {
  const hoverLayers = ["recintos_hover"];
  if (escuelas && escuelas.features && escuelas.features.length > 0) {
    hoverLayers.push("escuelas_hover");
  }
  if (
    !map.queryRenderedFeatures(e.point, { layers: hoverLayers }).length
  ) {
    lockedEscuela = false;
    locked = false;
    popupEscuela.remove();
    popup.remove();
  }
});
```

```js
function plotResultado(resultado, { fontSizeMultiplier = 1 } = {}) {
  if (!resultado) return "";
  function plotVista(data, vista, colores) {
    if (vista == "participacion") {
      const etiquetas = {
        v: "VÁLIDOS",
        b: "BLANCOS",
        n: "NULOS",
      };
      const paleta = {
        v: colores.texto_suave,
        b: "#f3ff83",
        n: "#f3ff83",
      };
      const label = Plot.text(data, {
        x: 0,
        y: "opcion",
        text: (d) => etiquetas[d.opcion],
        fill: (d) => paleta[d.opcion],
        fillOpacity: 0.8,
        fontSize: 30,
        fontWeight: 600,
        lineAnchor: "middle",
        textAnchor: "end",
        dy: 15,
        dx: -12,
        fontFamily: "Inter",
      });
      return {
        label,
        fill: (d) => paleta[d.opcion],
        fillOpacity: (d) => (d.opcion === "v" ? 0.5 : 1),
        marginLeft: 180,
      };
    }
    const label = Plot.image(data, {
      x: 0,
      y: "opcion",
      src: (d) => partidos[d.opcion].foto,
      dx: -50,
      dy: 5,
      r: 30,
      width: 85,
    });
    return {
      label,
      fill: (d) => partidos[d.opcion].colores[0],
      fillOpacity: 0.7,
      marginLeft: 80,
    };
  }

  function plotBarras({
    data,
    colores,
    label,
    fill,
    fillOpacity,
    marginLeft,
    fontSizeMultiplier,
  }) {
    return Plot.plot({
      margin: 0,
      marginLeft: marginLeft,
      marginRight: 10,
      height: data.length * 90,
      x: { axis: null, domain: [0, 1] },
      y: { axis: null, domain: data.map((d) => d.opcion) },
      marks: [
        label,
        Plot.barX(data, {
          x: 1,
          y: "opcion",
          fill: colores.fondo_suave,
          fillOpacity: 0.2,
          insetTop: 40,
          insetBottom: 10,
          r: 15,
        }),
        Plot.barX(data, {
          x: "porcentaje",
          y: "opcion",
          fill,
          fillOpacity,
          insetTop: 40,
          insetBottom: 10,
          r: 15,
        }),
        Plot.barX(data, {
          x: 1,
          y: "opcion",
          fill: null,
          stroke: colores.texto_suave,
          strokeOpacity: 0.5,
          strokeWidth: 1,
          insetTop: 40,
          insetBottom: 10,
          r: 15,
        }),
        Plot.text(data, {
          x: 1,
          y: "opcion",
          text: (d) => d3.format(".2%")(d.porcentaje),
          fill: colores.texto_fuerte,
          fillOpacity: 0.7,
          fontSize: 30 * fontSizeMultiplier,
          lineAnchor: "bottom",
          textAnchor: "end",
          dy: -18,
          dx: -5,
          fontFamily: "Inter",
        }),
        Plot.text(data, {
          x: 0,
          y: "opcion",
          text: (d) => `${d3.format(",")(d.conteo)} votos`,
          fill: colores.texto_fuerte,
          fillOpacity: 0.5,
          fontSize: 30 * fontSizeMultiplier,
          lineAnchor: "bottom",
          textAnchor: "start",
          dy: -18,
          dx: 5,
          fontFamily: "Inter",
        }),
      ],
    });
  }

  const data = ordenarResultado(resultado, {
    sort: vista === "validos",
  });
  const colores = vistas[vista].colores;
  const { label, fill, fillOpacity, marginLeft } = plotVista(
    data,
    vista,
    colores
  );

  return plotBarras({
    data,
    colores,
    label,
    fill,
    fillOpacity,
    marginLeft,
    fontSizeMultiplier,
  });
}
```
