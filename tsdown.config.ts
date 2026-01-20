import { defineConfig } from 'tsdown';

export default defineConfig({
  format: 'esm',
  entry: [
    './src/app.tsx',
    './src/dev.tsx',
    './src/index.tsx',
    './src/splitView.tsx',
    './src/utils.ts',
    './src/pages/device.tsx',
    './src/pages/keyboard.tsx',
    './src/services/device.ts',
    './src/services/keyboard.ts',
    './src/widgets/device/chargeLimit.tsx',
    './src/widgets/device/deviceInfo.tsx',
    './src/widgets/device/powerMode.tsx',
    './src/widgets/keyboard/aura.tsx',
    './src/widgets/keyboard/brightness.tsx',
    './src/widgets/keyboard/power.tsx',
  ],
});
