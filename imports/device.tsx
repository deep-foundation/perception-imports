import { BatteryInfo, Device as CapacitorDevice, DeviceInfo, GetLanguageCodeResult, LanguageTag } from '@capacitor/device';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import isEqual from 'lodash/isEqual';

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
}: {
  children?: any;
  containerId: Id;
  interval?: number;
}) {
  const deep = useDeep();
  const [device, setDevice] = useState<DeviceContext | null>(null);
  const deviceRef = useRef<DeviceContext | null>(null);
  const DeviceRef = useRef<Id | null>(null);
  const sync = useCallback(async (device: DeviceContext, containerId: Id) => {
    if (deep && containerId) {
      const Contain = deep.idLocal('@deep-foundation/core', 'Contain');
      const Device = DeviceRef.current = DeviceRef.current || await deep.id('@deep-foundation/deepmemo-links', 'Device');
      let { id, ..._device } = device;
      if (id) {
        await deep.update({ link_id: id }, { value: _device }, { table: 'objects' });
      } else {
        const { data: contains } = await deep.select({ type_id: Contain, from_id: containerId, string: { value: _device.name } });
        if (!contains.length) {
          const { data: [{ id }] } = await deep.insert({
            type_id: Device,
            in: { data: { type_id: Contain, from_id: containerId, string: _device.name } },
            object: _device,
          });
        } else {
          id = contains[0].to_id;
          await deep.update({ link_id: id }, { value: _device }, { table: 'objects' });
        }
      }
      if (!deviceRef?.current?.id) {
        deviceRef.current.id = id;
        setDevice({ id, ..._device });
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
      console.log(isEqual(deviceRef.current, device), deviceRef.current, device);
      if (!isEqual(deviceRef.current, device)) {
        deviceRef.current = device;
        setDevice(device);
      }
    }, interval);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    !!device && sync(device, containerId);
  }, [device]);
  return <>
    <deviceContext.Provider value={device}>
      {children}
    </deviceContext.Provider>
  </>
}