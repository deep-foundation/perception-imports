import { Device } from '@capacitor/device';
import React from 'react';

console.log('RRRR', React);

export function DeviceProvider({ children }: { children?: any }) {
  React.useEffect(() => {
    (async () => {
      const id = await Device.getId();
      const info = await Device.getInfo();
      const battery = await Device.getBatteryInfo();
      const language = await Device.getLanguageCode();
      const tag = await Device.getLanguageTag();
      console.log({
        id,
        info,
        battery,
        language,
        tag,
      });
    })()
    return () => {
      // uninitialize
    };
  }, []);
  return <>
    {children}
  </>
}