import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers';

// Clé API Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1IjoicGllcnJlcm5vdCIsImEiOiJjbTV6ODI5eDYwMWc1MmlzYXhxbzhhZHFrIn0.oTv2QPR2e5ka2Oa597bI5g';

// Vue initiale centrée sur la France
const INITIAL_VIEW_STATE = {
  longitude: 2.213749,
  latitude: 46.227638,
  zoom: 5,
  pitch: 0,
  bearing: 0,
};

const App = () => {
  const [regionData, setRegionData] = useState(null); // Données des régions
  const [communeData, setCommuneData] = useState(null); // Données des communes
  const [selectedRegion, setSelectedRegion] = useState(null); // Région sélectionnée
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE); // Vue actuelle de la carte
  const [hoverInfo, setHoverInfo] = useState(null); // Informations sur la commune survolée
  const [selectedIndicator, setSelectedIndicator] = useState('score');

  // Charger les données GeoJSON
  useEffect(() => {
    console.log('Rendu => hoverInfo:', hoverInfo);
    // Charger les régions
    fetch('./regions.geojson')
      .then((response) => response.json())
      .then((data) => setRegionData(data))
      .catch((error) =>
        console.error('Erreur lors du chargement des régions :', error)
      );

    // Charger les communes
    fetch('./fichier_joined.geojson')
      .then((response) => response.json())
      .then((data) => setCommuneData(data))
      .catch((error) =>
        console.error('Erreur lors du chargement des communes :', error)
      );
  }, []);

  // Fonction pour calculer la bounding box (bbox) d'une région
  const calculateBoundingBox = (geometry) => {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    // Vérifie le type de géométrie
    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach(([lng, lat]) => {
          if (!isNaN(lng) && !isNaN(lat)) {
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
          }
        });
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          polygon.forEach(([lng, lat]) => {
            if (!isNaN(lng) && !isNaN(lat)) {
              if (lng < minLng) minLng = lng;
              if (lat < minLat) minLat = lat;
              if (lng > maxLng) maxLng = lng;
              if (lat > maxLat) maxLat = lat;
            }
          });
        });
      });
    } else {
      console.error(
        'Type de géométrie non pris en charge :',
        geometry.type
      );
      return null;
    }

    if (
      isFinite(minLng) &&
      isFinite(minLat) &&
      isFinite(maxLng) &&
      isFinite(maxLat)
    ) {
      return [minLng, minLat, maxLng, maxLat];
    } else {
      console.error('Bounding box invalide pour la région :', geometry);
      return null;
    }
  };

  // Gestion de la sélection d'une région
  const handleRegionSelect = (event) => {
    const regionCode = event.target.value;
    setSelectedRegion(regionCode);

    const regionFeature = regionData.features.find(
      (feature) => feature.properties.code === regionCode
    );

    if (regionFeature) {
      const bbox = calculateBoundingBox(regionFeature.geometry);
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox;
        setViewState({
          longitude: (minLng + maxLng) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 7,
          pitch: 0,
          bearing: 0,
        });
      }
    }
  };

  // Gestion de la sélection de l'indicateur
  const handleIndicatorSelect = (event) => {
    setSelectedIndicator(event.target.value);
  };

  const getColorFromAPL = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return [200, 200, 200, 200]; // Gris par défaut pour une valeur invalide
    }
    if (value < 2.5) {
      return [144, 238, 144, 200]; // Vert clair
    } else if (value < 4) {
      return [34, 139, 34, 200]; // Vert moyen
    } else {
      return [0, 100, 0, 200]; // Vert foncé
    }
  };

  // Définir les couches
  const regionLayer = new GeoJsonLayer({
    id: 'region-layer',
    data: regionData,
    filled: false, // Pas de remplissage, uniquement les contours
    stroked: true,
    getLineColor: [255, 255, 255, 255], // Bordures blanches
    lineWidthMinPixels: 2,
  });

  const communeLayer = new GeoJsonLayer({
    id: 'commune-layer',
    data: communeData,
    filled: true,
    stroked: true,
    getFillColor: (d) => {
      if (d.properties.reg === selectedRegion) {
        // Récupérer la valeur de l'indicateur (score ou APL)
        const value = d.properties[selectedIndicator];
        if (selectedIndicator === 'score') {
          switch (value) {
            case 0:
              return [50, 205, 50, 200]; // Vert
            case 1:
              return [255, 255, 0, 200]; // Jaune
            case 2:
              return [255, 165, 0, 200]; // Orange
            case 3:
              return [255, 0, 0, 200]; // Rouge
            default:
              return [200, 200, 200, 200]; // Gris par défaut
          }
        } else if (selectedIndicator === 'APL') {
          return getColorFromAPL(value);
        }
      }
      return [0, 0, 0, 0]; // Transparent pour les autres communes
    },
    getLineColor: (d) => {
      if (d.properties.reg === selectedRegion && viewState.zoom >= 7) {
        return [0, 0, 0, 255]; // Noir pour les contours des communes de la région sélectionnée
      }
      return [0, 0, 0, 0]; // Transparent pour les autres
    },
    lineWidthMinPixels: 1,
    pickable: true,
    onHover: ({ object, x, y }) => {
      console.log('onHover déclenché :', object);
      if (object) {
        setHoverInfo({
          name: object.properties.libgeo,
          x,
          y,
        });
      } else {
        setHoverInfo(null);
      }
    },
    updateTriggers: {
      getFillColor: [selectedRegion, selectedIndicator],
      getLineColor: [selectedRegion, viewState.zoom],
    },
  });

  return (
    <div>
      <select
        onChange={handleRegionSelect}
        defaultValue=""
        style={{
          position: 'absolute',
          top: 10,
          left: 2,
          zIndex: 10,
          background: 'white',
          padding: '5px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        <option value="" disabled>
          Choisissez une région
        </option>
        {regionData &&
          regionData.features.map((region) => (
            <option key={region.properties.code} value={region.properties.code}>
              {region.properties.nom}
            </option>
          ))}
      </select>

      <div style={{ position: 'absolute', top: 10, left: 210, zIndex: 1000 }}>
        <select
          onChange={handleIndicatorSelect}
          value={selectedIndicator}
          style={{
            background: 'white',
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          <option value="score">DM</option>
          <option value="APL">APL</option>
        </select>
      </div>

      {/* Info sur la commune survolée */}
      {hoverInfo && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x,
            top: hoverInfo.y,
            background: 'white',
            zIndex: 999999,
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        >
          {hoverInfo.name}
        </div>
      )}

 {/* Légende affichée si le zoom est suffisant */}
{viewState.zoom >= 7 && (
  <div
    style={{
      position: 'absolute',
      bottom: 30,
      left: 10,
      background: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      zIndex: 10,
    }}
  >
    <strong>Légende :</strong>
    {selectedIndicator === 'score' ? (
      <>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(50, 205, 50)', // Vert
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          Pas de difficulté d'accès
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(255, 255, 0)', // Jaune
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          1 Difficulté
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(255, 165, 0)', // Orange
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          2 Difficultés
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(255, 0, 0)', // Rouge
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          Désert médical
        </div>
      </>
    ) : selectedIndicator === 'APL' ? (
      <>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(215, 238, 215)', // Vert clair
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          [0 ; 2.5[
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(48, 166, 48)', // Vert moyen
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          [2.5 ; 4[
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <div
            style={{
              backgroundColor: 'rgb(0, 100, 0)', // Vert foncé
              width: 20,
              height: 20,
              marginRight: 10,
            }}
          ></div>
          [4 ; 100[
        </div>
      </>
    ) : null}
  </div>
)}


      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={[regionLayer, communeLayer]}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          style={{ pointerEvents: 'none' }}
        />
      </DeckGL>
    </div>
  );
};

export default App;
