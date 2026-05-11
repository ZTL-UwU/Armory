import * as Gdk from '@gtkx/ffi/gdk';
import {
  AdwActionRow,
  AdwComboRow,
  GtkColorDialogButton,
} from '@gtkx/react';

import consola from 'consola';
import { useEffect, useState } from 'react';
import { getAllAuraModes, getCurrentAuraState, setAuraMode } from '../../services/keyboard.js';

export function KeyboardAura() {
  const [primaryColor, setPrimaryColor] = useState<Gdk.RGBA>(() => toGdkRgba(getCurrentAuraState()?.colour));
  const [secondaryColor, setSecondaryColor] = useState<Gdk.RGBA>(() => toGdkRgba(getCurrentAuraState()?.colour2));
  const [selectedMode, setSelectedMode] = useState<string | null>(() => getCurrentAuraState()?.modeId || null);
  const [selectedSpeed, setSelectedSpeed] = useState<string | null>(() => getCurrentAuraState()?.speed?.toLowerCase() || 'med');
  const [selectedDirection, setSelectedDirection] = useState<string | null>(() => getCurrentAuraState()?.direction?.toLowerCase() || 'right');

  const auraModes = getAllAuraModes();

  function toGdkRgba(hex: string | undefined): Gdk.RGBA {
    // Default to white
    if (!hex)
      return new Gdk.RGBA({ red: 1, green: 1, blue: 1, alpha: 1 });

    return new Gdk.RGBA({
      red: Number.parseInt(hex.slice(0, 2), 16) / 255,
      green: Number.parseInt(hex.slice(2, 4), 16) / 255,
      blue: Number.parseInt(hex.slice(4, 6), 16) / 255,
      alpha: 1,
    });
  }

  const rgbaToHex = (rgba: Gdk.RGBA | null): string => {
    if (!rgba)
      return 'ffffff';
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `${toHex(rgba.red)}${toHex(rgba.green)}${toHex(rgba.blue)}`;
  };

  const applyAura = (modeId: string, primary: Gdk.RGBA | null, secondary: Gdk.RGBA | null, speed: string | null = null, direction: string | null = null) => {
    const primaryHex = rgbaToHex(primary);
    const secondaryHex = rgbaToHex(secondary);

    const params: Record<string, string> = {
      colour: primaryHex,
      colour2: secondaryHex,
      speed: speed ?? selectedSpeed ?? 'med',
      direction: direction ?? selectedDirection ?? 'right',
      zone: '0',
    };

    const ok = setAuraMode(modeId, params);
    if (!ok)
      consola.error('Failed to set aura mode', modeId);
  };

  useEffect(() => {
    // Polling to update the current power mode every second
    const interval = setInterval(() => {
      const currentAuraMode = getCurrentAuraState();
      setPrimaryColor(toGdkRgba(currentAuraMode?.colour));
      setSecondaryColor(toGdkRgba(currentAuraMode?.colour2));
      setSelectedMode(currentAuraMode?.modeId || null);
      setSelectedSpeed(currentAuraMode?.speed?.toLowerCase() || 'med');
      setSelectedDirection(currentAuraMode?.direction?.toLowerCase() || 'right');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleColorChanged = (setter: (color: Gdk.RGBA) => void, isPrimary: boolean) => (rgba: Gdk.RGBA) => {
    setter(rgba);

    if (selectedMode) {
      const primary = isPrimary ? rgba : primaryColor;
      const secondary = isPrimary ? secondaryColor : rgba;
      applyAura(selectedMode, primary, secondary);
    }
  };
  const handlePrimaryColorChanged = handleColorChanged(setPrimaryColor, true);
  const handleSecondaryColorChanged = handleColorChanged(setSecondaryColor, false);

  function handleSpeedChanged(id: string) {
    setSelectedSpeed(id);
    if (selectedMode)
      applyAura(selectedMode, primaryColor, secondaryColor, id, selectedDirection);
  }

  function handleDirectionChanged(id: string) {
    setSelectedDirection(id);
    if (selectedMode)
      applyAura(selectedMode, primaryColor, secondaryColor, selectedSpeed, id);
  }

  function handleSelectionChanged(id: string) {
    setSelectedMode(id);
    applyAura(id, primaryColor, secondaryColor);
  }

  return (
    <>
      <AdwComboRow
        title="Aura Mode"
        subtitle="Select the keyboard aura mode"
        selectedId={selectedMode}
        items={auraModes.map(mode => ({ id: mode.id, value: mode.name }))}
        onSelectionChanged={handleSelectionChanged}
      />
      <AdwActionRow
        title="Color"
        subtitle="Select the keyboard backlight color"
      >
        <AdwActionRow.AddSuffix>
          <GtkColorDialogButton
            rgba={primaryColor}
            onRgbaChanged={handlePrimaryColorChanged}
          />
        </AdwActionRow.AddSuffix>
      </AdwActionRow>
      {
        auraModes.find(mode => mode.id === selectedMode)?.requiredParams.includes('colour2') && (
          <AdwActionRow
            title="Secondary Color"
            subtitle="Select the secondary keyboard backlight color"
          >
            <AdwActionRow.AddSuffix>
              <GtkColorDialogButton
                rgba={secondaryColor}
                onRgbaChanged={handleSecondaryColorChanged}
              />
            </AdwActionRow.AddSuffix>
          </AdwActionRow>

        )
      }
      {
        (auraModes.find(mode => mode.id === selectedMode)?.requiredParams.includes('speed')
          || auraModes.find(mode => mode.id === selectedMode)?.optionalParams.includes('speed')) && (
          <AdwComboRow
            title="Speed"
            subtitle="Select the effect speed"
            selectedId={selectedSpeed}
            onSelectionChanged={handleSpeedChanged}
            items={[
              { id: 'low', value: 'Low' },
              { id: 'med', value: 'Med' },
              { id: 'high', value: 'High' },
            ]}
          />
        )
      }
      {
        (auraModes.find(mode => mode.id === selectedMode)?.requiredParams.includes('direction')
          || auraModes.find(mode => mode.id === selectedMode)?.optionalParams.includes('direction')) && (
          <AdwComboRow
            title="Direction"
            subtitle="Select the effect direction"
            selectedId={selectedDirection}
            onSelectionChanged={handleDirectionChanged}
            items={[
              { id: 'up', value: 'Up' },
              { id: 'down', value: 'Down' },
              { id: 'left', value: 'Left' },
              { id: 'right', value: 'Right' },
            ]}
          />
        )
      }
    </>
  );
}
