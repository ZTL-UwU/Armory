import type { TBrightnessLevel } from '../../services/keyboard.js';
import { AdwComboRow } from '@gtkx/react';

import { useEffect, useState } from 'react';
import { getCurrentBrightness, setKeyboardBrightness } from '../../services/keyboard.js';

export function KeyboardBrightness() {
  const [selectedId, setSelectedId] = useState(getCurrentBrightness);

  useEffect(() => {
    // Polling to update the current power mode every second
    const interval = setInterval(() => {
      const currentBrightness = getCurrentBrightness();
      setSelectedId(currentBrightness);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function handleSelectionChanged(id: string) {
    setKeyboardBrightness(id as TBrightnessLevel);
    setSelectedId(id);
  }

  return (
    <AdwComboRow
      title="Brightness"
      subtitle="Adjust the keyboard brightness level"
      selectedId={selectedId}
      items={[
        { id: 'off', value: 'Off' },
        { id: 'low', value: 'Low' },
        { id: 'med', value: 'Mid' },
        { id: 'high', value: 'High' },
      ]}
      onSelectionChanged={handleSelectionChanged}
    />
  );
}
