import type { TBrightnessLevel } from '../../services/keyboard.js';
import { AdwComboRow, x } from '@gtkx/react';

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
      onSelectionChanged={handleSelectionChanged}
    >
      <x.SimpleListItem id="off" value="Off" />
      <x.SimpleListItem id="low" value="Low" />
      <x.SimpleListItem id="med" value="Mid" />
      <x.SimpleListItem id="high" value="High" />
    </AdwComboRow>
  );
}
