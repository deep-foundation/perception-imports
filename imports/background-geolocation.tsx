import { registerPlugin } from "@capacitor/core";
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
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { GeolocationContext, Position, useGeolocationSync } from "./geolocation";

interface BackgroundGeolocationProviderProps {
  children?: any;
  manual?: boolean;
  saver?: boolean;
}

export const backgroundGeolocationContext = createContext<GeolocationContext | null>(null);

export function useBackgroundGeolocation() {
  return useContext(backgroundGeolocationContext);
}

function convertBearingToHeading(bearing) {
  return bearing >= 0 && bearing <= 180 ? bearing : bearing > 180 && bearing <= 360 ? 360 - bearing : bearing;
}

export function BackgroundGeolocationProvider({
  children,
  manual = false,
  saver = false,
}: BackgroundGeolocationProviderProps) {
  const device = useDevice();
  const plugin = useMemo(() => registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation"), []);
  const [watcher, setWatcher] = useState<string>();
  const [position, setPosition] = useState<Position | null>(null);
  const [timestamp, setTimestamp] = useState<GeolocationContext['timestamp']>(null);
  const positionRef = useRef<Position | null>(null);
  const status = useMemo(() => {
    return !!plugin && !!watcher;
  }, [plugin, watcher]);
  const saverRef = useRef(saver);
  saverRef.current = saver;
  const check: GeolocationContext['check'] = useCallback(async (): Promise<GeolocationContext['status']> => !!watcher, [watcher]) as any;
  const request: GeolocationContext['request'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    if (!!watcher) return true;
    else {
      return new Promise((res, rej) => {
        console.log('DeepmemoBackgroundGeolocation plugin.addWatcher');
        plugin.addWatcher({
          backgroundMessage: "Cancel to prevent battery drain.",
          backgroundTitle: "Tracking You.",
          requestPermissions: true,
          stale: false,
          distanceFilter: 50
        }, (location, error) => {
          console.log(`DeepmemoBackgroundGeolocation addWatcher`);
          if (error) {
            console.log(`DeepmemoBackgroundGeolocation error ${error.code} ${error.toString()}`);
            if (error.code === "NOT_AUTHORIZED") {
              if (window.confirm(
                "This app needs your location, " +
                "but does not have permission.\n\n" +
                "Open settings now?"
              )) {
                plugin.openSettings();
              }
            }
            return console.error(error);
          }
          const p: Position = {
            accuracy: location?.accuracy,
            altitude: location?.altitude,
            altitudeAccuracy: location?.altitudeAccuracy,
            heading: convertBearingToHeading(location?.bearing),
            latitude: location?.latitude,
            longitude: location?.longitude,
            speed: location?.speed,
          };
          if (positionRef?.current?.id) p.id = positionRef.current.id;
          console.log('DeepmemoBackgroundGeolocation set');
          console.log(JSON.stringify(p));
          setPosition(p);
          setTimestamp(location?.time);
          if (saverRef.current) sync(p);
          console.log('DeepmemoBackgroundGeolocation synced');
          console.log(JSON.stringify(p));
        }
        ).then(function after_the_watcher_has_been_added(watcher_id) {
          console.log(`DeepmemoBackgroundGeolocation after_the_watcher_has_been_added ${watcher_id}`);
          setWatcher(watcher_id);
          res(true);
        }).catch((error) => {
          console.log(`DeepmemoBackgroundGeolocation catch ${error.toString()}`);
          setWatcher(null);
          res(false);
        });
      });
    }
  }, [watcher]) as any;
  const stop: GeolocationContext['stop'] = useCallback(async (): Promise<GeolocationContext['status']> => {
    await plugin.removeWatcher({ id: watcher });
    return false;
  }, [watcher]);
  useEffect(() => {
    if (!manual) {
      if (!status) request();
    }
    return () => {}
  }, [manual]);
  const sync = useGeolocationSync(positionRef, setPosition, 'background-geolocation');
  return <>
    <backgroundGeolocationContext.Provider value={{ _cbg: +watcher, position, timestamp, status, check, request, stop }}>
      {children}
    </backgroundGeolocationContext.Provider>
  </>
}
