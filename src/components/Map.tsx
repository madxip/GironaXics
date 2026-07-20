"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Centre, Activitat } from "@/lib/types";
import { normalizeSlug } from "@/lib/utils";

interface MapProps {
  centres: Centre[];
  filteredActivitats: Activitat[];
}

// Coordenades de referència per als barris de Girona i municipis limítrofs
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  // Girona Barris
  "barri vell": [41.9841, 2.8268],
  "eixample": [41.9772, 2.8189],
  "sant narcís": [41.9734, 2.8092],
  "germans sàbat": [41.9932, 2.8042],
  "santa eugènia": [41.9774, 2.8011],
  "montilivi": [41.9682, 2.8278],
  "palau": [41.9562, 2.8242],
  "vila-roja": [41.9692, 2.8445],
  "mas xirgu": [41.9632, 2.8052],
  "centre": [41.9818, 2.8219],
  "girona": [41.9831, 2.8222], // Per defecte Girona
  
  // Altres municipis de la comarca
  "salt": [41.9762, 2.7842],
  "sarrià de ter": [42.0162, 2.8252],
  "quart": [41.9402, 2.8428],
  "bescanó": [41.9649, 2.7381],
  "celrà": [42.0251, 2.8792],
  "llagostera": [41.8194, 2.8941],
  "cassà de la selva": [41.8882, 2.8752],
  "anglès": [41.9558, 2.6392],
  "sant gregori": [41.9922, 2.7602],
  "st. gregori": [41.9922, 2.7602],
  "sant julià de ramis": [42.0342, 2.8252],
  "st. julià de ramis": [42.0342, 2.8252],
  "vilablareix": [41.9522, 2.7752],
  "fornells de la selva": [41.9332, 2.8122],
};

const getCoordinates = (centre: Centre, index: number): [number, number] => {
  if (centre.lat && centre.lng) {
    return [centre.lat, centre.lng];
  }
  
  const barriNormalized = (centre.barri || "").toLowerCase().trim();
  const coords = NEIGHBORHOOD_COORDS[barriNormalized] || NEIGHBORHOOD_COORDS["girona"];
  
  // Afegim un jitter determinista basat en l'índex per evitar superposició exacta dels pins
  const jitterLat = Math.sin(index) * 0.0008;
  const jitterLng = Math.cos(index) * 0.0008;
  
  return [coords[0] + jitterLat, coords[1] + jitterLng];
};

export default function Map({ centres, filteredActivitats }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Filtrem per mostrar només els centres que tenen activitats actives en la llista filtrada
  const activeCentres = centres.filter((c) =>
    filteredActivitats.some((a) => a.centreId === c.id || a.centre === c.nom)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicialitzem el mapa si no existeix
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [41.9831, 2.8222],
        zoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup) return;

    // Netejar pins anteriors
    markersGroup.clearLayers();

    const markers: L.Marker[] = [];

    // Icona personalitzada en SVG
    const createCustomIcon = () => {
      return L.divIcon({
        html: `
          <div class="custom-marker-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="30" height="38" fill="none">
              <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.12 15.14 8.27 16.66.39.52 1.07.52 1.46 0C13.88 26.14 21 16.25 21 11c0-4.97-4.03-9-9-9z" fill="#1A6B3A" stroke="#ffffff" stroke-width="1.5" />
              <circle cx="12" cy="11" r="4.5" fill="#F5A623" />
            </svg>
          </div>
        `,
        className: "custom-leaflet-icon",
        iconSize: [30, 38],
        iconAnchor: [15, 38],
        popupAnchor: [0, -36],
      });
    };

    activeCentres.forEach((centre, index) => {
      const position = getCoordinates(centre, index);
      const activitiesAtCentre = filteredActivitats.filter(
        (a) => a.centreId === centre.id || a.centre === centre.nom
      );

      if (activitiesAtCentre.length === 0) return;

      const marker = L.marker(position, {
        icon: createCustomIcon(),
      });

      // Contingut HTML del Popup amb disseny premium
      const popupHtml = `
        <div class="map-popup-card">
          ${
            centre.imatgeUrl
              ? `<div class="map-popup-img-wrapper"><img src="${centre.imatgeUrl}" alt="${centre.nom}" class="map-popup-image" /></div>`
              : ""
          }
          <div class="map-popup-content">
            <h4 class="map-popup-title">${centre.nom}</h4>
            <span class="map-popup-barri">📍 ${centre.barri} · ${centre.adreca || ""}</span>
            <div class="map-popup-activities">
              <p class="map-popup-section-title">Activitats disponibles:</p>
              <ul class="map-popup-list">
                ${activitiesAtCentre
                  .map(
                    (a) => `
                  <li class="map-popup-item">
                    <a href="/activitats/${normalizeSlug(a.categoria)}/${a.slug}" class="map-popup-link" target="_blank">
                      <span class="bullet">•</span>
                      <span class="text">${a.nom}</span>
                      <span class="arrow">→</span>
                    </a>
                  </li>`
                  )
                  .join("")}
              </ul>
            </div>
            <div class="map-popup-footer">
              <a href="/centres/${centre.slug}" class="map-popup-btn-centre" target="_blank">Veure la fitxa del centre</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 290,
        className: "custom-leaflet-popup",
      });

      marker.addTo(markersGroup);
      markers.push(marker);
    });

    // Auto-ajustar zoom per mostrar tots els pins amb marge
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    } else {
      map.setView([41.9831, 2.8222], 13);
    }
  }, [activeCentres, filteredActivitats]);

  // Clean-up quan es desmunta el component
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "560px" }}>
      <style>{`
        .custom-marker-wrapper {
          filter: drop-shadow(0px 4px 6px rgba(12, 34, 20, 0.18));
          transition: transform 0.2s ease;
        }
        .custom-marker-wrapper:hover {
          transform: scale(1.1);
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background-color: var(--crema, #faf9f6);
          border: 1px solid var(--crema-fosca, #eae6df);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(12,34,20,0.12);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0;
          font-family: var(--font-sans), sans-serif;
          width: 280px !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background-color: var(--crema, #faf9f6);
          border-left: 1px solid var(--crema-fosca, #eae6df);
          border-bottom: 1px solid var(--crema-fosca, #eae6df);
        }
        .map-popup-card {
          display: flex;
          flex-direction: column;
        }
        .map-popup-img-wrapper {
          width: 100%;
          height: 120px;
          overflow: hidden;
          position: relative;
          background-color: var(--crema-fosca);
        }
        .map-popup-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .map-popup-content {
          padding: 16px;
        }
        .map-popup-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 18px;
          margin: 0 0 6px 0;
          color: var(--verd-fosc, #0c2214);
          font-weight: 700;
          line-height: 1.25;
        }
        .map-popup-barri {
          font-size: 11px;
          color: var(--muted, #525250);
          display: block;
          margin-bottom: 14px;
        }
        .map-popup-activities {
          border-top: 1px solid rgba(26, 107, 58, 0.08);
          padding-top: 12px;
          margin-bottom: 12px;
        }
        .map-popup-section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--verd, #1a6b3a);
          margin: 0 0 8px 0;
        }
        .map-popup-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 120px;
          overflow-y: auto;
        }
        .map-popup-item {
          font-size: 13px;
        }
        .map-popup-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--fosc, #1a1a18);
          text-decoration: none;
          transition: color 0.15s ease;
          line-height: 1.3;
        }
        .map-popup-link:hover {
          color: var(--taronja, #f5a623);
        }
        .map-popup-link .bullet {
          color: var(--taronja);
          font-weight: 900;
        }
        .map-popup-link .text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .map-popup-link .arrow {
          font-size: 11px;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.15s ease;
        }
        .map-popup-link:hover .arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .map-popup-footer {
          border-top: 1px solid rgba(26, 107, 58, 0.08);
          padding-top: 12px;
          margin-top: 4px;
        }
        .map-popup-btn-centre {
          display: block;
          width: 100%;
          text-align: center;
          background-color: var(--verd-fosc, #0c2214);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          box-sizing: border-box;
          transition: background-color 0.15s ease;
        }
        .map-popup-btn-centre:hover {
          background-color: var(--verd, #1a6b3a);
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "560px",
          borderRadius: "16px",
          border: "1px solid var(--crema-fosca, #eae6df)",
          boxShadow: "0 10px 30px rgba(12, 34, 20, 0.04)",
          overflow: "hidden",
          zIndex: 1,
        }}
      />
    </div>
  );
}
