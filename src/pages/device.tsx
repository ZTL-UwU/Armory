import * as Gtk from '@gtkx/ffi/gtk';
import {
  AdwPreferencesGroup,
  GtkBox,
} from '@gtkx/react';

import { ChargeLimit } from '../widgets/device/chargeLimit.js';
import { DeviceInfo } from '../widgets/device/deviceInfo.js';
import { PowerMode } from '../widgets/device/powerMode.js';

export function DevicePage() {
  return (
    <GtkBox
      vexpand
      hexpand
      orientation={Gtk.Orientation.VERTICAL}
      spacing={24}
      marginTop={24}
      marginBottom={24}
      marginStart={40}
      marginEnd={40}
    >
      <AdwPreferencesGroup title="Power Settings">
        <ChargeLimit />
        <PowerMode />
      </AdwPreferencesGroup>

      <AdwPreferencesGroup title="Device Info">
        <DeviceInfo></DeviceInfo>
      </AdwPreferencesGroup>
    </GtkBox>
  );
}
