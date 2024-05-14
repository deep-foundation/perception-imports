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
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { useSaver } from "./saver";
import { useDevice } from "./device";

interface Position {
  id?: Id;
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

interface GeolocationProviderProps {
  children?: any;
  interval: number;
  saver?: boolean;
}

export function useGeolocationSync (positionRef, setPosition) {
  const deep = useDeep();
  const device = useDevice();
  const save = useSaver({
    mode: 'geolocation',
    getType: () => deep.id('@deep-foundation/deepmemo-links', 'Position'),
  });
  return useCallback(async (position: Position) => {
    console.log('useGeolocationSync sync', position);
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
  saver = false,
}: GeolocationProviderProps) {
  const device = useDevice();
  const [status, setStatus] = useState<boolean>(null);
  const [watcher, setWatcher] = useState<any>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const positionRef = useRef<Position | null>(null);
  const PositionRef = useRef<Id | null>(null);
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
    return () => clearInterval(listenerRef.current);
  }, [watcher]);
  useEffect(() => {
    setWatcher(createGeolocation());
  }, [interval]);
  const sync = useGeolocationSync(positionRef, setPosition);
  useEffect(() => {
    !!position && saver && sync(position);
  }, [position, saver, device?.id]);
  return <>
    <geolocationContext.Provider value={{ _spg: watcher, position, timestamp, status, check, request }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export function GeolocationProviderCapacitor({
  children,
  interval = 1000,
  saver = false,
}: GeolocationProviderProps) {
  const device = useDevice();
  const [permission, setPermission] = useState<PermissionStatus>({ coarseLocation: 'prompt', location: 'prompt' });
  const [position, setPosition] = useState<Position | null>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const positionRef = useRef<Position | null>(null);
  const PositionRef = useRef<Id | null>(null);
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
      console.log('useGeolocationSync', position);
      if (!isEqual(positionRef.current, position.coords)) {
        positionRef.current = position.coords;
        const p: Position = { ...position.coords };
        if (positionRef.current.id) p.id = positionRef.current.id;
        setPosition(p);
      }
      setTimestamp(position.timestamp);
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
  const sync = useGeolocationSync(positionRef, setPosition);
  useEffect(() => {
    !!position && saver && sync(position);
  }, [position, saver, device?.id]);
  return <>
    <geolocationContext.Provider value={{ _cap: permission, position, timestamp, status, check, request }}>
      {children}
    </geolocationContext.Provider>
  </>
}

export const GeolocationProvider = Capacitor.getPlatform() === 'web' ? GeolocationProviderBrowser  : GeolocationProviderCapacitor;
