import * as Gtk from '@gtkx/ffi/gtk';
import { AdwActionRow, GtkScale, x } from '@gtkx/react';
import consola from 'consola';
import { useEffect, useState } from 'react';

import { getChargeLimit, setChargeLimit } from '../../services/device.js';

export function ChargeLimit() {
  const [chargeLimit, setLocalChargeLimit] = useState(getChargeLimit);

  useEffect(() => {
    // Polling to update the current power mode every second
    const interval = setInterval(() => {
      const currentLimit = getChargeLimit();
      setLocalChargeLimit(currentLimit);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChargeChange = (scale: any) => {
    const newLimit = Math.round(scale.getValue());
    setLocalChargeLimit(newLimit);
    // Apply the change immediately
    const success = setChargeLimit(newLimit);
    if (!success) {
      consola.error('Failed to set charge limit to', newLimit);
    }
  };

  return (
    <AdwActionRow title="Charge Limit" subtitle={`${chargeLimit}%`}>
      <x.ActionRowSuffix>
        <GtkScale
          hexpand
          adjustment={new Gtk.Adjustment(chargeLimit, 0, 100, 1, 10, 0)}
          onValueChanged={handleChargeChange}
        >
          <x.ScaleMark value={0} label="0" position={Gtk.PositionType.BOTTOM} />
          <x.ScaleMark value={50} label="50" position={Gtk.PositionType.BOTTOM} />
          <x.ScaleMark value={80} label="80" position={Gtk.PositionType.BOTTOM} />
          <x.ScaleMark value={100} label="100" position={Gtk.PositionType.BOTTOM} />
        </GtkScale>
      </x.ActionRowSuffix>
    </AdwActionRow>
  );
}
