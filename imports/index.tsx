import React from 'react';
import { useDevice } from './device';

export default function Test({
  afterDevice = null
}: {
  afterDevice?: any;
}) {
  const device = useDevice();
  return <div>
    <div>device</div>
    <pre>{JSON.stringify(device, null, 2)}</pre>
    {afterDevice}
  </div>;
}