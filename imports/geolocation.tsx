import { App } from "@capacitor/app";
import { Geolocation, GeolocationPlugin, PermissionStatus } from "@capacitor/geolocation";
import {
  createGeolocation,
  createGeolocationWatcher,
} from "@solid-primitives/geolocation";
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import { useLocalStore } from '@deep-foundation/store/local';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from "@capacitor/core";

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitudeAccuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
}

interface GeolocationContext {
  _cap?: PermissionStatus;
  _spg?: any;
  status: boolean | null;
  position?: Position;
  timestamp?: number;
  check: () => Promise<boolean | null>;
  request: () => Promise<boolean | null>;
}

export const geolocationContext = createContext<GeolocationContext | null>(null);

export function useGeolocation() {
  return useContext(geolocationContext);
}

export function GeolocationProviderBrowser({
  children,
  containerId,
  interval = 1000,
}: {
  children?: any;
  containerId: Id;
  interval: number;
}) {
  const deep = useDeep();
  const [status, setStatus] = useState<boolean>(null);
  const [watcher, setWatcher] = useState<any>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const check: GeolocationContext['check'] = useCallback(async (): Promise<GeolocationContext['status']> => status, []) as any;
  const request: GeolocationContext['request'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    setWatcher(createGeolocation());
    return null;
  }, []) as any;
  useEffect(() => setStatus(!!position), [position]);
  const listenerRef = useRef<any>();
  useEffect(() => {
    if (listenerRef.current) clearInterval(listenerRef.current);
    listenerRef.current = setInterval(() => {
      try {
        const p = watcher[0]();
        setPosition(p ? {
          accuracy: p?.accuracy,
          altitude: p?.altitude,
          altitudeAccuracy: p?.altitudeAccuracy,
          heading: p?.heading,
          latitude: p?.latitude,
          longitude: p?.longitude,
          speed: p?.speed,
        } : null);
      } catch(e) {
        setPosition(null);
        setTimestamp(new Date().valueOf());
      }
    }, interval);
    return () => clearInterval(listenerRef.current);
  }, [watcher]);
  useEffect(() => {
    setWatcher(createGeolocation());
  }, [interval]);
  return <>
    <geolocationContext.Provider value={{ _spg: watcher, position, timestamp, status, check, request }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export function GeolocationProviderCapacitor({
  children,
  containerId,
  interval = 1000,
}: {
  children?: any;
  containerId: Id;
  interval: number;
}) {
  const deep = useDeep();
  const [permission, setPermission] = useState<PermissionStatus>({ coarseLocation: 'prompt', location: 'prompt' });
  const [position, setPosition] = useState<Position | null>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const getStatus = useCallback((permission) => permission.location === 'denied' ? false : permission.location === 'granted' ? true : null || permission.coarseLocation === 'denied' ? false : permission.coarseLocation === 'granted' ? true : null, []);
  const status = useMemo(() => {
    return getStatus(permission);
  }, [permission]);
  const check: GeolocationContext['check'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    const permission = await Geolocation.checkPermissions();
    setPermission(permission);
    return getStatus(permission);
  }, []) as any;
  const request: GeolocationContext['request'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    const permission = await Geolocation.requestPermissions();
    return getStatus(permission);
  }, []) as any;
  useEffect(() => {
    Geolocation.watchPosition({ timeout: interval }, (position, error) => {
      setTimestamp(position.timestamp);
      setPosition(position.coords);
      console.error(error);
    });
  }, [status]);
  useEffect(() => {
    if (!status) request()
    const resumeListener = App.addListener("resume", request);
    return () => {
      resumeListener.then((resumeListener) => resumeListener.remove());
    }
  }, []);
  return <>
    <geolocationContext.Provider value={{ _cap: permission, position, timestamp, status, check, request }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export function GeolocationProvider(props) {
  return Capacitor.getPlatform() === 'web' ? <GeolocationProviderBrowser {...props}/> :  <GeolocationProviderCapacitor {...props}/>;
}