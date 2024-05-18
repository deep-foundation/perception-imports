import { BatteryInfo, Device as CapacitorDevice, DeviceInfo, GetLanguageCodeResult, LanguageTag } from '@capacitor/device';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import isEqual from 'lodash/isEqual';
import { useSaver } from './saver';

interface DeviceContext {
  id?: Id;
  name: string;
  info: DeviceInfo | {};
  battery: BatteryInfo | {};
  language: string;
  tag: string;
}

export const deviceContext = createContext<DeviceContext | null>(null);

export function useDevice() {
  return useContext(deviceContext);
}

export function DeviceProvider({
  children,
  containerId,
  interval = 1000,
  saver = false,
}: {
  children?: any;
  containerId: Id;
  interval?: number;
  saver?: boolean;
}) {
  const deep = useDeep();
  const [device, setDevice] = useState<DeviceContext | null>(null);
  const deviceRef = useRef<DeviceContext | null>(null);
  const save = useSaver({
    mode: 'geolocation',
    getType: () => deep.id('@deep-foundation/deepmemo-links', 'Device'),
  });
  const sync = useCallback(async (device: DeviceContext, containerId: Id) => {
    if (deep && containerId) {
      let { id, ...object } = device;
      id = await save(object, id, object.name, containerId);
      if (!deviceRef?.current?.id && !!id) {
        deviceRef.current.id = id;
        setDevice({ id, ...object });
      }
    }
  }, []);
  useEffect(() => {
    const i = setInterval(async () => {
      const device: DeviceContext = {
        ...(deviceRef.current || {}),
        name: (await CapacitorDevice.getId()).identifier,
        info: await (async () => { try { return await CapacitorDevice.getInfo() } catch(e) { return {} }})(),
        battery: await (async () => { try { return await CapacitorDevice.getBatteryInfo() } catch(e) { return {} }})(),
        language: await (async () => { try { return (await CapacitorDevice.getLanguageCode()).value } catch(e) { return 'en' }})(),
        tag: await (async () => { try { return (await CapacitorDevice.getLanguageTag()).value } catch(e) { return 'en' }})(),
      };
      if (!deviceRef.current || !isEqual(deviceRef.current, device)) {
        deviceRef.current = device;
        setDevice(device);
      }
    }, interval);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    !!device && saver && sync(device, containerId);
  }, [device, saver, containerId]);
  return <>
    <deviceContext.Provider value={device}>
      {children}
    </deviceContext.Provider>
  </>
}