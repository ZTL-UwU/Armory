import { AdwSwitchRow } from '@gtkx/react';
import { useState } from 'react';
import { getKeyboardPowerStates, setKeyboardPowerState } from '../../services/keyboard.js';

export function KeyboardPower() {
  const powerStates = getKeyboardPowerStates();
  const [powerStatesActual, setPowerStatesActual] = useState(() => getKeyboardPowerStates());

  const handleToggle = (zone: 'boot' | 'awake' | 'sleep' | 'shutdown', enabled: boolean) => {
    setPowerStatesActual(prevStates => ({ ...prevStates, [zone]: enabled }));
    setKeyboardPowerState({ ...powerStatesActual, [zone]: enabled });
  };

  return (
    <>
      <AdwSwitchRow
        title="Boot"
        subtitle="Enable keyboard backlight on system startup"
        active={powerStates.boot}
        onActiveChanged={active => handleToggle('boot', active)}
      >
      </AdwSwitchRow>
      <AdwSwitchRow
        title="Awake"
        subtitle="Keep keyboard backlight on when system is awake"
        active={powerStates.awake}
        onActiveChanged={active => handleToggle('awake', active)}
      >
      </AdwSwitchRow>
      <AdwSwitchRow
        title="Sleep"
        subtitle="Keep keyboard backlight on when system is sleeping"
        active={powerStates.sleep}
        onActiveChanged={active => handleToggle('sleep', active)}
      >
      </AdwSwitchRow>
      <AdwSwitchRow
        title="Shutdown"
        subtitle="Keep keyboard backlight on when system is shut down"
        active={powerStates.shutdown}
        onActiveChanged={active => handleToggle('shutdown', active)}
      >
      </AdwSwitchRow>
    </>
  );
}
