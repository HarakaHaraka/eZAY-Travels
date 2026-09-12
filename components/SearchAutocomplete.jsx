import React, { useState, useEffect, useRef } from 'react';

/*
  eZAY SearchAutocomplete v2 — FIXED
  ----------------------------------
  What changed vs v1:
  1. User CANNOT search with free-typed text. A real airport must be
     picked from the dropdown. If they type and don't pick, the box
     clears itself and shows "Please pick an airport from the list".
     This kills the OND/IRO garbage at the source.
  2. The FULL airport object is passed up (name, city, IATA code),
     so the results page can show "London Heathrow (LHR)" instead
     of a bare code.
  3. Results are validated: anything without a 3-letter IATA code
     is thrown away before it reaches the screen.
*/

export default function SearchAutocomplete({ label, onSelectDestination }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState(null);   // the locked-in airport
  const [warning, setWarning] = useState('');
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  const fetchAirports = async (query) => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/duffel-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();

      // VALIDATION: only keep entries with a real 3-letter IATA code and a name
      const clean = (data.places || []).filter(
        (p) => p && typeof p.iata_code === 'string'
            && /^[A-Z]{3}$/.test(p.iata_code)
            && p.name
      );
      setResults(clean);
      setShowResults(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelected(null);          // typing again = previous pick no longer valid
    setWarning('');
    onSelectDestination(null);  // tell the parent form: nothing valid selected
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchAirports(value), 300);
  };

  const handleSelectResult = (place) => {
    const display = `${place.name} (${place.iata_code})`;
    setSearchQuery(display);
    setSelected(place);
    setShowResults(false);
    setResults([]);
    setWarning('');

    // Pass EVERYTHING up — name included — so results pages never
    // have to show a bare code again.
    onSelectDestination({
      iataCode: place.iata_code,
      name: place.name,
      cityName: place.city_name || place.name,
      type: place.type,
      id: place.id,
      display
    });
  };

  // If the user typed something but never picked from the list,
  // clear it when they click away — free text must never survive.
  const handleBlurCheck = () => {
    if (searchQuery && !selected) {
      setWarning('Please pick an airport from the list');
      setSearchQuery('');
      setResults([]);
      onSelectDestination(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        handleBlurCheck();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#001f3f' }}>
          {label}
        </label>
      )}
      <input
        type="text"
        placeholder="Type a city or airport, then pick from the list"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => searchQuery && setShowResults(true)}
        style={{
          width: '100%', padding: '12px', fontSize: '16px',
          border: selected ? '2px solid #2e7d32' : '2px solid #008B8B',
          borderRadius: '4px', fontFamily: 'inherit'
        }}
      />

      {warning && (
        <div style={{ marginTop: 4, fontSize: 13, color: '#b71c1c', fontWeight: 600 }}>
          {warning}
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, padding: '12px',
          backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '4px',
          fontSize: '14px', color: '#666', zIndex: 1000
        }}>
          Searching airports…
        </div>
      )}

      {showResults && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          listStyle: 'none', padding: 0, margin: '4px 0 0 0',
          backgroundColor: '#fff', border: '2px solid #008B8B', borderRadius: '4px',
          maxHeight: '300px', overflowY: 'auto', zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {results.map((place, index) => (
            <li
              key={place.id || index}
              onClick={() => handleSelectResult(place)}
              style={{
                padding: '10px 12px', cursor: 'pointer',
                borderBottom: index < results.length - 1 ? '1px solid #eee' : 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontWeight: 'bold', color: '#001f3f' }}>
                {place.name} ({place.iata_code})
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {place.type === 'airport' ? 'Airport' : 'City'}
                {place.city_name && place.city_name !== place.name && ` • ${place.city_name}`}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showResults && searchQuery && results.length === 0 && !loading && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, padding: '12px',
          backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '4px',
          fontSize: '14px', color: '#666', zIndex: 1000
        }}>
          No airports found — try the city name (e.g. “Nairobi”)
        </div>
      )}
    </div>
  );
}
