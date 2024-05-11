import { BatteryInfo, Device as CapacitorDevice, DeviceInfo, GetLanguageCodeResult, LanguageTag } from '@capacitor/device';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';

interface DeviceContext {
  id?: Id;
  name: string;
  info: DeviceInfo;
  battery: BatteryInfo;
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
}: {
  children?: any;
  containerId: Id;
}) {
  const deep = useDeep();
  const [device, setDevice] = useState<DeviceContext | null>(null);
  useEffect(() => {
    (async () => {
      const Contain = await deep.id('@deep-foundation/core', 'Contain');
      const Device = await deep.id('@deep-foundation/deepmemo-links', 'Device');
      const device: DeviceContext = {
        name: (await CapacitorDevice.getId()).identifier,
        info: await CapacitorDevice.getInfo(),
        battery: await CapacitorDevice.getBatteryInfo(),
        language: (await CapacitorDevice.getLanguageCode()).value,
        tag: (await CapacitorDevice.getLanguageTag()).value,
      };
      const { data: contains } = await deep.select({ type_id: Contain, from_id: containerId, string: { value: device.name } });
      if (!contains.length) {
        const { data: [{ id }] } = await deep.insert({
          type_id: Device,
          in: { data: { type_id: Contain, from_id: containerId, string: device.name } },
          object: device,
        });
        device.id = id;
      } else {
        await deep.update(contains[0].to_id, { value: device }, { table: 'objects' });
        device.id = contains[0].to_id;
      }
      setDevice(device);
    })()
    return () => {
      // uninitialize
    };
  }, []);
  return <>
    <deviceContext.Provider value={device}>
      {children}
    </deviceContext.Provider>
  </>
}