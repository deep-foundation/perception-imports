import { Geolocation, GeolocationPlugin } from "@capacitor/geolocation";
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import React, { createContext, useCallback, useContext } from 'react';

interface GeolocationContext {
}

export const geolocationContext = createContext<GeolocationContext | null>(null);

export function useGeolocation() {
  return useContext(geolocationContext);
}

export function GeolocationProvider({
  children,
  containerId,
}: {
  children?: any;
  containerId: Id;
}) {
  const deep = useDeep();
  const check = useCallback(async () => {
    return await Geolocation.checkPermissions();
  }, []);
  return <>
    <geolocationContext.Provider value={{ check }}>
      {children}
    </geolocationContext.Provider>
  </>
}