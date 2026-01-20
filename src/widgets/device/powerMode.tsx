import { AdwComboRow, x } from '@gtkx/react';
import { useEffect, useState } from 'react';
import { getCurrentPowerMode, listPowerModes, setPowerMode } from '../../services/device.js';

export function PowerMode() {
  const [selectedId, setSelectedId] = useState(getCurrentPowerMode);

  const powerModes = listPowerModes();

  useEffect(() => {
    // Polling to update the current power mode every second
    const interval = setInterval(() => {
      const currentMode = getCurrentPowerMode();
      setSelectedId(currentMode);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function handleSelectionChanged(id: string) {
    setPowerMode(id);
    setSelectedId(id);
  }

  return (
    <AdwComboRow
      title="Power Mode"
      subtitle="Select the desired power mode"
      selectedId={selectedId}
      onSelectionChanged={handleSelectionChanged}
    >
      {
        powerModes.map(mode => (
          <x.SimpleListItem key={mode.id} id={mode.id} value={mode.name} />
        ))
      }
    </AdwComboRow>
  );
}
