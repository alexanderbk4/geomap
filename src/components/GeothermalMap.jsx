import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON } from 'react-leaflet';
import { MapPin, Mail, Globe } from 'lucide-react';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';

const GeothermalMap = () => {
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showMunicipalities, setShowMunicipalities] = useState(true);
  const [showGreenhouses, setShowGreenhouses] = useState(true);
  const [showBaseMap, setShowBaseMap] = useState(true);  const [municipalitiesData, setMunicipalitiesData] = useState(null);
  const [tempSystem, setTempSystem] = useState(null);



  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/your-geothermal-data.csv');
        const text = await response.text();
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            setSystems(results.data);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Your existing CSV loading code
        const csvResponse = await fetch('/your-geothermal-data.csv');
        const text = await csvResponse.text();
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            setSystems(results.data);
          }
        });
  
        // Add this new part for GeoJSON loading
        const geoResponse = await fetch('/greenhouse-per-municipality-wgs84.geojson');
        const geoData = await geoResponse.json();
        setMunicipalitiesData(geoData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MapPin size={24} />
          Dutch Geothermal Systems Overview
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowBaseMap(!showBaseMap)}
            style={{
              padding: '8px 16px',
              backgroundColor: showBaseMap ? '#2563eb' : '#fff',
              color: showBaseMap ? '#fff' : '#2563eb',
              border: '1px solid #2563eb',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showBaseMap ? 'Hide' : 'Show'} Base Map
          </button>
          <button 
            onClick={() => setShowMunicipalities(!showMunicipalities)}
            style={{
              padding: '8px 16px',
              backgroundColor: showMunicipalities ? '#2563eb' : '#fff',
              color: showMunicipalities ? '#fff' : '#2563eb',
              border: '1px solid #2563eb',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showMunicipalities ? 'Hide' : 'Show'} Municipalities
          </button>
          <button 
            onClick={() => setShowGreenhouses(!showGreenhouses)}
            style={{
              padding: '8px 16px',
              backgroundColor: showGreenhouses ? '#2563eb' : '#fff',
              color: showGreenhouses ? '#fff' : '#2563eb',
              border: '1px solid #2563eb',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showGreenhouses ? 'Hide' : 'Show'} Greenhouse Data
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
        <div style={{ width: '50%', height: '100%' }}>
          <MapContainer 
            center={[52.1326, 5.2913]}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
          >
            {showBaseMap && (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            {showMunicipalities && municipalitiesData && (
              <GeoJSON
                data={municipalitiesData}
                style={() => ({
                  color: '#000000',
                  weight: 1,
                  fillOpacity: 1,
                  fillColor: '#ffffff'
                })}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(feature.properties.statnaam, { 
                    permanent: false,
                    direction: 'center'
                  });
                }}
              />
            )}
            {showGreenhouses && municipalitiesData && (              
              <GeoJSON
                data={municipalitiesData}
                style={(feature) => {
                  const value = feature.properties['2024'];
                  const getColor = (m2) => {
                    if (!m2) return '#ffffff';
                    if (m2 > 20000000) return '#000000';  // Very dark green
                    if (m2 > 2000000) return '#0a641c';   // Dark green
                    if (m2 > 500000) return '#439458';    // Medium-dark green
                    if (m2 > 200000) return '#70b47a';    // Medium green
                    if (m2 > 50000) return '#aede8f';     // Light-medium green
                    if (m2 > 20000) return '#e4ffd1';     // Light green
                    if (m2 > 1000) return '#f3fbed';     // Light green
                    return '#ffffff';                      // White
                  };
                  return {
                    color: '#000000',
                    weight: 1,
                    fillOpacity: 1,
                    fillColor: getColor(value)
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const value = feature.properties['2024'];
                  layer.bindTooltip(
                    `${feature.properties.Gemeente}: ${value?.toLocaleString() || 0} m²`,
                    { 
                      permanent: false,
                      direction: 'center'
                    }
                  );
                }}
              />
            )}
            {systems.map((system, index) => (
              system['Latitude WGS84'] && system['Longitude WGS84'] ? (
                <CircleMarker
                  key={index}
                  pane="markerPane"
                  center={[
                    parseFloat(system['Latitude WGS84']),
                    parseFloat(system['Longitude WGS84'])
                  ]}
                  radius={3}
                  fillColor={selectedSystem === system ? '#2563eb' : '#3b82f6'}
                  fillOpacity={selectedSystem === system ? 0.9 : 0.6}
                  color={selectedSystem === system ? '#1e40af' : '#2563eb'}
                  weight={2}
                  eventHandlers={{
                    click: () => setSelectedSystem(system),
                    mouseover: (e) => {
                      e.target.setStyle({
                        fillOpacity: 0.9,
                        radius: 5
                      });
                      // Temporarily show this system's data
                      if (selectedSystem !== system) {
                        setTempSystem(system);
                      }
                    },
                    mouseout: (e) => {
                      if (selectedSystem !== system) {
                        e.target.setStyle({
                          fillOpacity: 0.6,
                          radius: 3
                        });
                        // Reset to show selected system's data
                        setTempSystem(null);
                      }
                    }
                  }}
                >
                  <Tooltip>
                    <strong>{system['Name energy installation']}</strong>
                  </Tooltip>
                </CircleMarker>
              ) : null
            ))}

          <div style={{
              position: 'absolute',
              top: '20px',
              left: '50px',
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '4px',
              boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '2px solid #2563eb'
              }} />
              <span style={{ fontSize: '12px' }}>Hydrothermal wells</span>
            </div>

          </MapContainer>
        </div>
        <div style={{ width: '50%', padding: '20px', backgroundColor: 'white', overflowY: 'auto' }}>
          {(tempSystem || selectedSystem) ? (
            <div>
              <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                System Details {tempSystem && !selectedSystem && "(Hovering)"}
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151', width: '40%' }}>Current Owner</td>
                    <td style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(tempSystem || selectedSystem)['Website'] ? (
                          <a 
                            href={(tempSystem || selectedSystem)['Website'].startsWith('http') ? 
                              (tempSystem || selectedSystem)['Website'] : 
                              `${(tempSystem || selectedSystem)['Website']}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {(tempSystem || selectedSystem)['Current owner']}
                          </a>
                        ) : (
                          (tempSystem || selectedSystem)['Current owner']
                        )}
                        {(tempSystem || selectedSystem)['Email'] && (
                          <a
                            href={(tempSystem || selectedSystem)['Email'].includes('@') ? 
                              `mailto:${(tempSystem || selectedSystem)['Email']}` : 
                              `${(tempSystem || selectedSystem)['Email']}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}
                          >
                            <Mail size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>Installation Name</td>
                    <td style={{ padding: '8px 0' }}>{(tempSystem || selectedSystem)['Name energy installation']}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>Borehole Name</td>
                    <td style={{ padding: '8px 0' }}>{(tempSystem || selectedSystem)['Boreholen name']}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>End Drilling</td>
                    <td style={{ padding: '8px 0' }}>{formatDate((tempSystem || selectedSystem)['End drilling'])}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>Municipality</td>
                    <td style={{ padding: '8px 0' }}>{(tempSystem || selectedSystem)['Municipality']}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>Well Status</td>
                    <td style={{ padding: '8px 0' }}>{(tempSystem || selectedSystem)['Well status']}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#374151' }}>Borehole depth (m)</td>
                    <td style={{ padding: '8px 0' }}>{(tempSystem || selectedSystem)['Boorgatdiepte TVD t.o.v. NAP / MSL']}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>Click on a marker to view detailed system information</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeothermalMap;