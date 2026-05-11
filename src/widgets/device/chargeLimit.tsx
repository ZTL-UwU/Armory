import * as Gtk from '@gtkx/ffi/gtk';
import { AdwActionRow, GtkScale } from '@gtkx/react';
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

  const handleChargeChange = (value: number) => {
    const newLimit = Math.round(value);
    setLocalChargeLimit(newLimit);
    // Apply the change immediately
    const success = setChargeLimit(newLimit);
    if (!success) {
      consola.error('Failed to set charge limit to', newLimit);
    }
  };

  return (
    <AdwActionRow title="Charge Limit" subtitle={`${chargeLimit}%`}>
      <AdwActionRow.AddSuffix>
        <GtkScale
          hexpand
          value={chargeLimit}
          lower={0}
          upper={100}
          stepIncrement={1}
          pageIncrement={10}
          pageSize={0}
          marks={[
            { value: 0, label: '0', position: Gtk.PositionType.BOTTOM },
            { value: 50, label: '50', position: Gtk.PositionType.BOTTOM },
            { value: 80, label: '80', position: Gtk.PositionType.BOTTOM },
            { value: 100, label: '100', position: Gtk.PositionType.BOTTOM },
          ]}
          onValueChanged={handleChargeChange}
        />
      </AdwActionRow.AddSuffix>
    </AdwActionRow>
  );
}
