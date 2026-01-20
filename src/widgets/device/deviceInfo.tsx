import { AdwActionRow } from '@gtkx/react';
import { getDeviceInfo } from '../../services/device.js';

export function DeviceInfo() {
  const deviceInfo = getDeviceInfo();

  return (
    deviceInfo.map(info => (
      <AdwActionRow
        cssClasses={['property']}
        key={info.key}
        title={info.name}
        subtitle={info.content}
      />
    ))
  );
}
