'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { OfferCard } from '@/lib/homepage';

/**
 * Shared selection between the hero, the sticky fare bar and the destination
 * bands: picking a scene or an offer card anywhere updates the bar. In the
 * original design this was a module-level variable; here it is context, so
 * the server-rendered sections in between can stay server components.
 */
interface FareSelectionValue {
  offers: Record<string, OfferCard>;
  selectedOfferId: string | null;
  selectedOffer: OfferCard | undefined;
  selectOffer: (id: string) => void;
  trip: 'return' | 'oneway';
  setTrip: (trip: 'return' | 'oneway') => void;
  pax: number;
  setPax: (updater: (current: number) => number) => void;
}

const FareSelectionContext = createContext<FareSelectionValue | null>(null);

export function useFareSelection(): FareSelectionValue {
  const value = useContext(FareSelectionContext);
  if (value === null) {
    throw new Error('useFareSelection must be used inside FareSelectionProvider');
  }
  return value;
}

export function FareSelectionProvider({
  offers,
  initialOfferId,
  children,
}: {
  offers: Record<string, OfferCard>;
  initialOfferId: string | null;
  children: React.ReactNode;
}) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(initialOfferId);
  const [trip, setTrip] = useState<'return' | 'oneway'>('return');
  const [pax, setPaxState] = useState(2);

  const selectOffer = useCallback((id: string) => {
    setSelectedOfferId(id);
  }, []);

  const setPax = useCallback((updater: (current: number) => number) => {
    setPaxState((current) => Math.min(9, Math.max(1, updater(current))));
  }, []);

  const value = useMemo<FareSelectionValue>(
    () => ({
      offers,
      selectedOfferId,
      selectedOffer: selectedOfferId ? offers[selectedOfferId] : undefined,
      selectOffer,
      trip,
      setTrip,
      pax,
      setPax,
    }),
    [offers, selectedOfferId, selectOffer, trip, pax, setPax]
  );

  return (
    <FareSelectionContext.Provider value={value}>{children}</FareSelectionContext.Provider>
  );
}
