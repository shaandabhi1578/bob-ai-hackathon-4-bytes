import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  CloudRain,
  Truck,
  Layers,
  ArrowRight,
  ShieldAlert,
  Compass,
  Radio,
  Clock,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Wrench,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { GridAsset, Crew } from '../../types';
import { getTileLayers } from '../../services/mapService';
import { RepairReportModal } from '../common/RepairReportModal';

export const RealLeafletMap: React.FC = () => {
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    crews,
    setActiveTab,
    nearestCrewToSelected,
    assignCrew,
    unassignAssetCrew,
    activeWeatherRegion,
    infrastructurePOIs,
    getPOIUpstreamRisk,
  } = useGrid();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markersGroup: L.LayerGroup;
    linesGroup: L.LayerGroup;
    crewsGroup: L.LayerGroup;
    weatherGroup: L.LayerGroup;
    routeGroup: L.LayerGroup;
    infrastructureGroup: L.LayerGroup;
  } | null>(null);

  const [repairModalAsset, setRepairModalAsset] = useState<GridAsset | null>(null);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [poiCategory, setPoiCategory] = useState<'ALL' | 'Healthcare' | 'Education' | 'Emergency'>('ALL');

  const availableTileLayers = getTileLayers();
  const [selectedLayerId, setSelectedLayerId] = useState(availableTileLayers[0]?.id || 'maptiler-dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [showCrews, setShowCrews] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Critical' | 'Warning' | 'Healthy'>('All');

  // Center of Ahmedabad / Gujarat Power Grid
  const gridCenter: [number, number] = [23.055, 72.565];

  // Invalidate map size whenever fullscreen toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: gridCenter,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create Layer Groups
    const linesGroup = L.layerGroup().addTo(map);
    const weatherGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const crewsGroup = L.layerGroup().addTo(map);
    const infrastructureGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    layersRef.current = {
      markersGroup,
      linesGroup,
      crewsGroup,
      weatherGroup,
      routeGroup,
      infrastructureGroup,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const activeLayer = availableTileLayers.find((l) => l.id === selectedLayerId) || availableTileLayers[0];
    L.tileLayer(activeLayer.url, {
      maxZoom: activeLayer.maxZoom,
      subdomains: 'abcd',
      attribution: activeLayer.attribution,
    }).addTo(map);
  }, [selectedLayerId]);

  // Render Markers, Transmission Lines, Crews, Route & Weather
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    // 1. Clear previous layers
    layers.markersGroup.clearLayers();
    layers.linesGroup.clearLayers();
    layers.crewsGroup.clearLayers();
    layers.weatherGroup.clearLayers();
    layers.routeGroup.clearLayers();
    layers.infrastructureGroup.clearLayers();

    // 2. Weather Storm Hazard Polygon Overlay dynamically linked to activeWeatherRegion
    if (showWeather) {
      const isHighRisk = activeWeatherRegion.gridWeatherRisk === 'HIGH';
      const isMedRisk = activeWeatherRegion.gridWeatherRisk === 'MEDIUM';

      const stormPolygon = L.polygon(
        [
          [23.14, 72.48],
          [23.16, 72.62],
          [23.05, 72.68],
          [23.01, 72.58],
          [23.02, 72.46],
        ],
        {
          color: isHighRisk ? '#dc2626' : isMedRisk ? '#d97706' : '#059669',
          weight: isHighRisk ? 2.5 : 1.5,
          dashArray: isHighRisk ? '6, 6' : '4, 4',
          fillColor: isHighRisk ? '#ef4444' : isMedRisk ? '#f59e0b' : '#10b981',
          fillOpacity: isHighRisk ? 0.25 : isMedRisk ? 0.16 : 0.08,
        }
      ).bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;font-weight:700;color:${isHighRisk ? '#991b1b' : isMedRisk ? '#92400e' : '#065f46'};">
          ${isHighRisk ? '⛈ SEVERE SQUALL / THERMAL HAZARD' : isMedRisk ? '⚠️ ELEVATED ATMOSPHERIC EXPOSURE' : '☀️ NOMINAL METEOROLOGICAL ZONE'}<br/>
          Region: ${activeWeatherRegion.name} • Wind: ${activeWeatherRegion.windSpeed} km/h • Precip: ${activeWeatherRegion.rainfallProb}%
        </div>`,
        { sticky: true }
      );
      layers.weatherGroup.addLayer(stormPolygon);
    }

    // 3. Transmission Lines between Substations
    if (showLines) {
      const subCoords: Record<string, [number, number]> = {
        'S-17': [23.0825, 72.5654],
        'S-04': [23.036, 72.529],
        'S-09': [22.985, 72.385],
        'S-02': [23.195, 72.632],
        'S-07': [23.068, 72.671],
        'S-22': [23.018, 72.482],
        'S-11': [22.972, 72.518],
      };

      const linePairs = [
        { from: 'S-17', to: 'S-04', kv: 400 },
        { from: 'S-04', to: 'S-09', kv: 220 },
        { from: 'S-17', to: 'S-02', kv: 220 },
        { from: 'S-04', to: 'S-22', kv: 132 },
        { from: 'S-04', to: 'S-07', kv: 220 },
        { from: 'S-04', to: 'S-11', kv: 220 },
      ];

      linePairs.forEach((l) => {
        const c1 = subCoords[l.from];
        const c2 = subCoords[l.to];
        if (c1 && c2) {
          const polyline = L.polyline([c1, c2], {
            color: l.kv === 400 ? '#475569' : '#94a3b8',
            weight: l.kv === 400 ? 2.5 : 1.5,
            dashArray: l.kv === 400 ? undefined : '5, 5',
          });
          layers.linesGroup.addLayer(polyline);
        }
      });
    }

    // 4. Dynamic Proximity Route Line (for assigned crew or nearest available crew)
    const targetAsset = assets.find((a) => a.id === selectedAssetId) || selectedAsset;
    const activeAssignedCrew = targetAsset.assignedCrewId
      ? crews.find((c) => c.id === targetAsset.assignedCrewId)
      : null;
    const routeTargetCrew = activeAssignedCrew || nearestCrewToSelected.crew;

    if (showRoute && targetAsset && routeTargetCrew) {
      const assetLat = targetAsset.coordinates.lat;
      const assetLng = targetAsset.coordinates.lng;
      const crewLat = routeTargetCrew.coordinates.lat;
      const crewLng = routeTargetCrew.coordinates.lng;

      const isAlreadyAssigned = !!activeAssignedCrew;

      // Draw dashed dispatch route line
      const routeLine = L.polyline(
        [
          [crewLat, crewLng],
          [assetLat, assetLng],
        ],
        {
          color: isAlreadyAssigned ? '#16a34a' : '#2563eb',
          weight: 3,
          dashArray: isAlreadyAssigned ? '8, 4' : '6, 6',
        }
      ).bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;font-weight:700;color:${isAlreadyAssigned ? '#15803d' : '#1e40af'};">
          ${isAlreadyAssigned ? `✓ DISPATCHED UNIT: ${routeTargetCrew.id}` : `🚨 DISPATCH CORRIDOR: ${routeTargetCrew.id} → ${targetAsset.id}`}<br/>
          Proximity: ${nearestCrewToSelected.distanceKm} km • ETA: ${nearestCrewToSelected.etaMinutes} mins
        </div>`,
        { permanent: true, direction: 'center', className: 'scada-route-tooltip' }
      );

      layers.routeGroup.addLayer(routeLine);
    }

    // 5. Crews Fleet Markers
    if (showCrews) {
      crews.forEach((crew) => {
        const isAssigned = crew.status === 'Assigned';
        const isOffDuty = crew.status === 'Off Duty';
        const isTargetCrew = crew.id === 'Crew 04';

        const crewHtml = `
          <div style="
            background: ${isAssigned ? '#f59e0b' : isOffDuty ? '#94a3b8' : '#2563eb'};
            color: #ffffff;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
          ">
            ${crew.id.replace('Crew ', 'C')}
          </div>
        `;

        const crewIcon = L.divIcon({
          html: crewHtml,
          className: 'custom-crew-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const crewMarker = L.marker([crew.coordinates.lat, crew.coordinates.lng], {
          icon: crewIcon,
        }).bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;padding:4px;">
            <strong>${crew.id} (${crew.name})</strong><br/>
            Lead: ${crew.lead}<br/>
            Status: <span style="font-weight:700;color:${isAssigned ? '#d97706' : '#16a34a'}">${crew.status}</span><br/>
            Specialization: ${crew.specialization}<br/>
            Location: ${crew.currentLocation}
          </div>
        `);

        layers.crewsGroup.addLayer(crewMarker);
      });
    }

    // 6. Grid Assets Markers
    const filtered = assets.filter((a) => {
      if (filterStatus === 'All') return true;
      return a.status === filterStatus;
    });

    filtered.forEach((asset) => {
      const isSelected = asset.id === selectedAssetId;
      const isCritical = asset.status === 'Critical';
      const isWarning = asset.status === 'Warning';
      const color = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#16a34a';

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; cursor: pointer;">
          ${
            isCritical
              ? `<div style="
                  position: absolute;
                  inset: -6px;
                  border-radius: 50%;
                  background: rgba(220, 38, 38, 0.25);
                  animation: scada-pulse 2s infinite ease-in-out;
                "></div>`
              : ''
          }
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: ${color};
            border: ${isSelected ? '3px solid #0f172a' : '2px solid #ffffff'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            font-family: var(--font-mono);
          ">
            ${asset.id.slice(0, 4)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-asset-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([asset.coordinates.lat, asset.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : isCritical ? 500 : 100,
      });

      marker.on('click', () => {
        setSelectedAssetId(asset.id);
      });

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;font-weight:600;">
          <strong>${asset.name}</strong> • ${asset.failureRisk}% Risk<br/>
          Status: ${asset.status} • Impact: ${asset.gridImpactCustomers.toLocaleString()} customers
        </div>`,
        { direction: 'top', offset: [0, -12] }
      );

      layers.markersGroup.addLayer(marker);
    });

    // 7. Critical Civil Infrastructure POIs (Hospitals, Schools, Fire, Water)
    if (showInfrastructure) {
      const filteredPOIs = infrastructurePOIs.filter((p) => {
        if (poiCategory === 'ALL') return true;
        return p.category === poiCategory;
      });

      filteredPOIs.forEach((poi) => {
        const upstreamInfo = getPOIUpstreamRisk(poi);
        const isHospital = poi.type === 'Hospital';
        const isEdu = poi.type === 'School' || poi.type === 'University';
        const isFire = poi.type === 'FireStation';

        const bg = isHospital ? '#dc2626' : isEdu ? '#2563eb' : isFire ? '#ea580c' : '#0891b2';
        const iconEmoji = isHospital ? '🏥' : isEdu ? '🎓' : isFire ? '🚒' : '💧';

        const poiHtml = `
          <div style="position: relative; width: 28px; height: 28px; cursor: pointer;">
            ${
              upstreamInfo.isAtRisk
                ? `<div style="
                    position: absolute;
                    inset: -5px;
                    border-radius: 50%;
                    background: rgba(220, 38, 38, 0.35);
                    animation: scada-pulse 2s infinite ease-in-out;
                  "></div>`
                : ''
            }
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 6px;
              background: ${bg};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              ${iconEmoji}
            </div>
          </div>
        `;

        const poiIcon = L.divIcon({
          html: poiHtml,
          className: 'custom-poi-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([poi.coordinates.lat, poi.coordinates.lng], {
          icon: poiIcon,
          zIndexOffset: 350,
        }).bindPopup(`
          <div style="font-family: sans-serif; min-width: 260px; padding: 4px; font-size: 12px; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <strong>${iconEmoji} ${poi.name}</strong>
              <span style="font-size: 10px; background: ${bg}18; color: ${bg}; border: 1px solid ${bg}40; padding: 1px 5px; border-radius: 3px; font-weight: 700;">
                ${poi.category}
              </span>
            </div>
            <div style="color: #475569; font-size: 11px; margin-bottom: 4px;">
              📍 ${poi.address}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 6px; background: #f8fafc; padding: 6px; border-radius: 4px;">
              <div><strong>Capacity:</strong> ${poi.capacity}</div>
              <div><strong>Priority:</strong> ${poi.priorityLevel.split(' - ')[0]}</div>
              <div style="grid-column: span 2;"><strong>Backup Power:</strong> ${poi.backupGenerator}</div>
              <div style="grid-column: span 2;"><strong>Contact:</strong> ${poi.contactPerson} (${poi.contactPhone})</div>
            </div>
            <div style="font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
              <strong>Connected Grid Substation:</strong> ${poi.connectedSubstationName}<br/>
              <strong>Feeder Line:</strong> ${poi.feederId}
            </div>
            <div style="margin-top: 6px; font-size: 11px; padding: 5px 8px; border-radius: 4px; ${
              upstreamInfo.isAtRisk
                ? 'background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;'
                : 'background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;'
            }">
              ${
                upstreamInfo.isAtRisk
                  ? `⚠️ <strong>UPSTREAM GRID THREAT:</strong> ${upstreamInfo.upstreamSubstation} is operating at ${upstreamInfo.riskScore}% risk! Secondary feeder line & backup generators primed.`
                  : `✓ <strong>GRID NOMINAL:</strong> Primary feeder power stable via ${upstreamInfo.upstreamSubstation}.`
              }
            </div>
          </div>
        `);

        marker.bindTooltip(
          `<div style="font-family:sans-serif;font-size:11px;font-weight:700;">
            ${iconEmoji} ${poi.name} (${poi.category})<br/>
            ${upstreamInfo.isAtRisk ? '⚠️ Upstream Grid Warning' : '✓ Grid Power Stable'}
          </div>`,
          { direction: 'top', offset: [0, -12] }
        );

        layers.infrastructureGroup.addLayer(marker);
      });
    }
  }, [
    assets,
    selectedAssetId,
    crews,
    showLines,
    showCrews,
    showWeather,
    showRoute,
    showInfrastructure,
    poiCategory,
    filterStatus,
    nearestCrewToSelected,
    infrastructurePOIs,
    getPOIUpstreamRisk,
  ]);

  // Center on selected asset smoothly
  const handleCenterOnSelected = () => {
    const map = mapInstanceRef.current;
    if (map && selectedAsset) {
      map.flyTo([selectedAsset.coordinates.lat, selectedAsset.coordinates.lng], 13, {
        duration: 1.2,
      });
    }
  };

  return (
    <div
      className="control-card"
      style={{
        height: isFullscreen ? '100vh' : '640px',
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 99999 : 'auto',
        borderRadius: isFullscreen ? 0 : '10px',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map Control Bar */}
      <div className="control-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="control-card-title">
            <Navigation size={16} color="#2563eb" />
            <span>Real-Time Geospatial SCADA Map</span>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #1e293b',
              padding: '0.18rem 0.55rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Live Geospatial SCADA Active
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Ahmedabad & Gujarat 400kV / 220kV Telemetry
          </span>
        </div>

        {/* Map Layers & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.15rem', borderRadius: '6px' }}>
            {(['All', 'Critical', 'Warning', 'Healthy'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: filterStatus === st ? 600 : 400,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: filterStatus === st ? '#ffffff' : 'transparent',
                  color: filterStatus === st ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: filterStatus === st ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Tile switch */}
          <select
            value={selectedLayerId}
            onChange={(e) => setSelectedLayerId(e.target.value)}
            className="form-select"
            style={{ width: '170px', height: '30px', fontSize: '0.74rem' }}
          >
            {availableTileLayers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>

          {/* Route toggle */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className="btn-secondary btn-sm"
            style={{
              background: showRoute ? '#eff6ff' : '#ffffff',
              borderColor: showRoute ? '#93c5fd' : '#cbd5e1',
              color: showRoute ? '#1e40af' : '#475569',
              fontWeight: showRoute ? 600 : 400,
            }}
            title="Toggle Dynamic Nearest Crew Route Line"
          >
            <Navigation size={12} />
            <span>Route</span>
          </button>

          {/* Storm toggle */}
          <button
            onClick={() => setShowWeather(!showWeather)}
            className="btn-secondary btn-sm"
            style={{
              background: showWeather ? '#eff6ff' : '#ffffff',
              borderColor: showWeather ? '#93c5fd' : '#cbd5e1',
              color: showWeather ? '#1e40af' : '#475569',
              fontWeight: showWeather ? 600 : 400,
            }}
          >
            <CloudRain size={12} />
            <span>Storm</span>
          </button>

          {/* Crews toggle */}
          <button
            onClick={() => setShowCrews(!showCrews)}
            className="btn-secondary btn-sm"
            style={{
              background: showCrews ? '#eff6ff' : '#ffffff',
              borderColor: showCrews ? '#93c5fd' : '#cbd5e1',
              color: showCrews ? '#1e40af' : '#475569',
              fontWeight: showCrews ? 600 : 400,
            }}
          >
            <Truck size={12} />
            <span>Crews</span>
          </button>

          {/* Lines toggle */}
          <button
            onClick={() => setShowLines(!showLines)}
            className="btn-secondary btn-sm"
            style={{
              background: showLines ? '#eff6ff' : '#ffffff',
              borderColor: showLines ? '#93c5fd' : '#cbd5e1',
              color: showLines ? '#1e40af' : '#475569',
              fontWeight: showLines ? 600 : 400,
            }}
          >
            <Layers size={12} />
            <span>Lines</span>
          </button>

          {/* Civil POIs toggle & filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button
              onClick={() => setShowInfrastructure(!showInfrastructure)}
              className="btn-secondary btn-sm"
              style={{
                background: showInfrastructure ? '#eff6ff' : '#ffffff',
                borderColor: showInfrastructure ? '#93c5fd' : '#cbd5e1',
                color: showInfrastructure ? '#1e40af' : '#475569',
                fontWeight: showInfrastructure ? 600 : 400,
              }}
              title="Toggle Critical Public Infrastructure (Hospitals, Schools, Water Works, Fire Stations)"
            >
              <span>🏥 Civil POIs</span>
            </button>
            {showInfrastructure && (
              <select
                value={poiCategory}
                onChange={(e) => setPoiCategory(e.target.value as any)}
                className="form-select"
                style={{ width: '115px', height: '28px', fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
                title="Filter Infrastructure Category"
              >
                <option value="ALL">All Categories</option>
                <option value="Healthcare">Hospitals</option>
                <option value="Education">Colleges/Univ</option>
                <option value="Emergency">Emergency</option>
              </select>
            )}
          </div>

          {/* Fullscreen toggle button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary btn-sm"
            style={{
              background: isFullscreen ? '#0f172a' : '#ffffff',
              borderColor: isFullscreen ? '#0f172a' : '#cbd5e1',
              color: isFullscreen ? '#38bdf8' : '#0f172a',
              fontWeight: 600,
            }}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Map Mode'}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Map Surface & Compact Overlay Panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Recenter button */}
        <button
          onClick={handleCenterOnSelected}
          className="btn-secondary btn-sm"
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Compass size={13} />
          <span>Center on {selectedAsset.id}</span>
        </button>

        {/* Compact Asset Inspection Panel (Floating Right Side of Map) */}
        {selectedAsset && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '330px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              padding: '1.1rem',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedAsset.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {selectedAsset.substation}
                </div>
              </div>
              <span
                className={`badge ${
                  selectedAsset.status === 'Critical'
                    ? 'badge-critical'
                    : selectedAsset.status === 'Warning'
                    ? 'badge-warning'
                    : 'badge-healthy'
                }`}
              >
                {selectedAsset.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Failure Risk</div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: selectedAsset.failureRisk >= 80 ? '#dc2626' : selectedAsset.failureRisk >= 50 ? '#d97706' : '#16a34a',
                  }}
                >
                  {selectedAsset.failureRisk}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Predicted Failure</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedAsset.predictedFailureWindow}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Grid Impact</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  {selectedAsset.gridImpactCustomers.toLocaleString()} customers
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>
                  {selectedAsset.assignedCrewId ? 'Active Field Unit' : 'Nearest Available'}
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: selectedAsset.assignedCrewId ? '#16a34a' : nearestCrewToSelected.crew ? '#2563eb' : '#94a3b8',
                  }}
                >
                  {selectedAsset.assignedCrewId
                    ? `✓ ${selectedAsset.assignedCrewId} Assigned`
                    : nearestCrewToSelected.crew
                    ? `${nearestCrewToSelected.crew.id} (${nearestCrewToSelected.distanceKm} km)`
                    : 'None Available'}
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Recommended Action
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: selectedAsset.status === 'Critical' ? '#991b1b' : '#334155',
                  background: selectedAsset.status === 'Critical' ? '#fef2f2' : '#f8fafc',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '4px',
                  border: `1px solid ${selectedAsset.status === 'Critical' ? '#fecaca' : '#e2e8f0'}`,
                }}
              >
                {selectedAsset.recommendedAction}
              </div>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setActiveTab('failure-prediction');
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View AI Failure Prediction</span>
                <ArrowRight size={14} />
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setActiveTab('asset-health');
                  }}
                  className="btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span>Sensors</span>
                </button>

                <button
                  onClick={() => setRepairModalAsset(selectedAsset)}
                  className="btn-secondary btn-sm"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d',
                    fontWeight: 600,
                  }}
                  title="Submit post-maintenance diagnostic report & restore health"
                >
                  <Wrench size={12} />
                  <span>Repair</span>
                </button>

                {selectedAsset.assignedCrewId ? (
                  <button
                    onClick={() => unassignAssetCrew(selectedAsset.id)}
                    className="btn-secondary btn-sm"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: '#fff7ed',
                      borderColor: '#fed7aa',
                      color: '#c2410c',
                      fontWeight: 600,
                    }}
                    title={`Release unit ${selectedAsset.assignedCrewId} back to available status`}
                  >
                    <span>Release</span>
                  </button>
                ) : nearestCrewToSelected.crew ? (
                  <button
                    onClick={() => {
                      assignCrew(nearestCrewToSelected.crew!.id, selectedAsset.id);
                    }}
                    className="btn-secondary btn-sm"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: '#eff6ff',
                      borderColor: '#93c5fd',
                      color: '#1d4ed8',
                      fontWeight: 600,
                    }}
                    title={`Dispatch nearest unit ${nearestCrewToSelected.crew.id}`}
                  >
                    <span>Dispatch</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary btn-sm"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: '#f1f5f9',
                      borderColor: '#cbd5e1',
                      color: '#94a3b8',
                      cursor: 'not-allowed',
                    }}
                  >
                    <span>No Crew</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Repair Report Modal */}
      {repairModalAsset && (
        <RepairReportModal
          asset={repairModalAsset}
          onClose={() => setRepairModalAsset(null)}
        />
      )}
    </div>
  );
};
