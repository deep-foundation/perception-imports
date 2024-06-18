import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import {
  createGeolocation
} from "@solid-primitives/geolocation";
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDevice } from "./device";
import { useSaver } from "./saver";

export interface Position {
  id?: Id;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitudeAccuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
}

export interface GeolocationContext {
  _cap?: PermissionStatus;
  _spg?: any;
  _cbg?: number;
  status: boolean | null;
  position?: Position;
  timestamp?: number;
  check: () => Promise<boolean | null>;
  request: () => Promise<boolean | null>;
  stop: () => Promise<boolean | null>;
}

interface GeolocationProviderProps {
  children?: any;
  interval: number;
  saver?: boolean;
  manual?: boolean;
}

export function useGeolocationSync (positionRef, setPosition, mode = 'geolocation') {
  const deep = useDeep();
  const device = useDevice();
  const save = useSaver({
    mode,
    getType: () => deep.id('@deep-foundation/deepmemo-links', 'Position'),
  });
  return useCallback(async (position: Position) => {
    console.log(`useGeolocationSync ${device?.id}`);
    if (deep && device?.id) {
      let { id, ...object } = position;
      id = await save(omitBy(object, isNil), id, 'position', device.id);
      if (!positionRef?.current?.id && !!id) {
        positionRef.current.id = id;
        setPosition({ id, ...object });
      }
    }
  }, [deep, device?.id]);
};

export const geolocationContext = createContext<GeolocationContext | null>(null);

export function useGeolocation() {
  return useContext(geolocationContext);
}

export function GeolocationProviderBrowser({
  children,
  interval = 1000,
  manual = false,
  saver = false,
}: GeolocationProviderProps) {
  const device = useDevice();
  const [status, setStatus] = useState<boolean>(null);
  const [watcher, setWatcher] = useState<any>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const positionRef = useRef<Position | null>(null);
  const check: GeolocationContext['check'] = useCallback(async (): Promise<GeolocationContext['status']> => status, [status]) as any;
  const request: GeolocationContext['request'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    setWatcher(createGeolocation());
    return null;
  }, []) as any;
  const stop: GeolocationContext['stop'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    setWatcher(false);
    return false;
  }, [watcher]);
  useEffect(() => setStatus(!!position), [position]);
  const listenerRef = useRef<any>();
  useEffect(() => {
    if (listenerRef.current) clearInterval(listenerRef.current);
    if (watcher) {
      listenerRef.current = setInterval(() => {
        try {
          const p = watcher[0]();
          const position: Position = p ? {
            accuracy: p?.accuracy,
            altitude: p?.altitude,
            altitudeAccuracy: p?.altitudeAccuracy,
            heading: p?.heading,
            latitude: p?.latitude,
            longitude: p?.longitude,
            speed: p?.speed,
          } : null;
          if (!positionRef.current || !isEqual(positionRef.current, position)) {
            if (positionRef?.current?.id) position.id = positionRef.current.id;
            positionRef.current = position;
            setPosition(position);
          }
        } catch(e) {
          console.error(e);
          setPosition(null);
        }
        setTimestamp(new Date().valueOf());
      }, interval);
    }
    return () => clearInterval(listenerRef.current);
  }, [watcher]);
  useEffect(() => {
    if (!manual) setWatcher(createGeolocation());
  }, [manual, interval]);
  const sync = useGeolocationSync(positionRef, setPosition);
  useEffect(() => {
    !!position && saver && sync(position);
  }, [position, saver, device?.id]);
  return <>
    <geolocationContext.Provider value={{ _spg: watcher, position, timestamp, status, check, request, stop }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export function GeolocationProviderCapacitor({
  children,
  interval = 1000,
  manual = false,
  saver = false,
}: GeolocationProviderProps) {
  const device = useDevice();
  const [permission, setPermission] = useState<PermissionStatus>({ coarseLocation: 'prompt', location: 'prompt' });
  const [position, setPosition] = useState<Position | null>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const positionRef = useRef<Position | null>(null);
  const [watcher, setWatcher] = useState<string>(null);
  const getStatus = useCallback((permission) => (!!watcher && (permission.location === 'denied' ? false : permission.location === 'granted' ? true : null || permission.coarseLocation === 'denied' ? false : permission.coarseLocation === 'granted' ? true : null)), [watcher]);
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
  const stop: GeolocationContext['stop'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    if (watcher) await Geolocation.clearWatch({ id: watcher });
    return false;
  }, [watcher]);
  useEffect(() => {
    Geolocation.watchPosition({ timeout: interval }, (position, error) => {
      if (!isEqual(positionRef.current, position.coords)) {
        positionRef.current = position.coords;
        const p: Position = { ...position.coords };
        if (positionRef.current.id) p.id = positionRef.current.id;
        setPosition(p);
      }
      setTimestamp(position.timestamp);
    }).then(watcher => setWatcher(watcher));
  }, [status]);
  const appListenerRef = useRef<any>();
  const manualRef = useRef<boolean>(manual);
  manualRef.current = manual;
  useEffect(() => {
    if (!manual) {
      if (!status) request();
    }
    appListenerRef.current = App.addListener("resume", () => {
      if (!manualRef.current) request();
    });
    return () => {
      appListenerRef.current.then((resumeListener) => resumeListener.remove());
    }
  }, [manual]);
  const sync = useGeolocationSync(positionRef, setPosition);
  useEffect(() => {
    !!position && saver && sync(position);
  }, [position, saver, device?.id]);
  return <>
    <geolocationContext.Provider value={{ _cap: permission, position, timestamp, status, check, request, stop }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export const GeolocationProvider = Capacitor.getPlatform() === 'web' ? GeolocationProviderBrowser  : GeolocationProviderCapacitor;
