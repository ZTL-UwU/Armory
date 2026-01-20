import * as Gtk from '@gtkx/ffi/gtk';
import {
  AdwPreferencesGroup,
  GtkBox,
} from '@gtkx/react';

import { KeyboardAura } from '../widgets/keyboard/aura.js';
import { KeyboardBrightness } from '../widgets/keyboard/brightness.js';
import { KeyboardPower } from '../widgets/keyboard/power.js';

export function KeyboardPage() {
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
      <AdwPreferencesGroup>
        <KeyboardBrightness />
        <KeyboardAura />
      </AdwPreferencesGroup>
      <AdwPreferencesGroup title="Keyboard Power Settings">
        <KeyboardPower />
      </AdwPreferencesGroup>
    </GtkBox>
  );
}
