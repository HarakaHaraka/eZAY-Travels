'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * An airport-autocomplete field for the fare bar.
 *
 * Type "london" → dropdown offers London (all airports), Heathrow, Gatwick,
 * Stansted, Luton, City. Picking one locks in its IATA code. The visible
 * text keeps the .well look the bar already has; the dropdown floats under
 * the field.
 *
 * The parent owns the value: { text, code }. `code` is null until a real
 * suggestion is picked (or the parent resolves it another way) — free text
 * on its own never carries a code, which is what kills the OND/IRO bug.
 */

export interface AirportValue {
  text: string;
  code: string | null;
}

export interface PlaceSuggestion {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  metro: boolean;
}

export function AirportField({
  id,
  label,
  value,
  onChange,
  inputRef,
  onUserType,
}: {
  id: string;
  label: string;
  value: AirportValue;
  onChange: (next: AirportValue) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Called on every keystroke — the bar uses it to pause scene rotation. */
  onUserType?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(query: string) {
    try {
      const res = await fetch(`/api/places?query=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      const places: PlaceSuggestion[] = Array.isArray(data?.places) ? data.places : [];
      setSuggestions(places);
      setOpen(places.length > 0);
      setActive(-1);
    } catch {
      /* dropdown quietly stays closed */
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    onUserType?.();
    onChange({ text, code: null }); // typing invalidates any earlier pick
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => fetchSuggestions(text), 250);
  }

  function pick(place: PlaceSuggestion) {
    onChange({ text: `${place.name} (${place.code})`, code: place.code });
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="well f1" style={{ position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        value={value.text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
      />
      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: 260,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 60,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((place, index) => (
            <li
              key={place.code}
              role="option"
              aria-selected={index === active}
              onMouseDown={(e) => {
                e.preventDefault(); // beat the input's blur
                pick(place);
              }}
              onMouseEnter={() => setActive(index)}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                background: index === active ? 'rgba(0,0,0,0.06)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                {place.name} <span style={{ opacity: 0.65 }}>({place.code})</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                {place.metro
                  ? 'All airports'
                  : [place.city, place.country].filter(Boolean).join(' · ') || 'Airport'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
