import * as Gio from '@gtkx/ffi/gio';
import consola from 'consola';
import { exec } from '../utils.js';

/**
 * Get the current charge limit from asusd via D-Bus
 */
export function getChargeLimit(): number {
  try {
    const proxy = Gio.DBusProxy.newForBusSync(
      Gio.BusType.SYSTEM,
      Gio.DBusProxyFlags.NONE,
      'xyz.ljones.Asusd',
      '/xyz/ljones',
      'xyz.ljones.Platform',
    );

    const limit = proxy.getCachedProperty('ChargeControlEndThreshold');
    if (limit) {
      return limit.getByte() || 100;
    }
    return 100; // Default to 100 if no result
  }
  catch (error) {
    consola.error('Failed to get charge limit:', error);
    return 100; // Default to 100 on error
  }
}

/**
 * Set the charge limit via asusctl
 */
export function setChargeLimit(limit: number): boolean {
  try {
    if (limit < 0 || limit > 100) {
      consola.error('Charge limit must be between 0 and 100');
      return false;
    }
    exec(`asusctl battery limit ${limit}`);
    return true;
  }
  catch (error) {
    consola.error('Failed to set charge limit:', error);
    return false;
  }
}

export interface TPowerMode {
  id: string;
  name: string;
}

export function listPowerModes(): TPowerMode[] {
  try {
    const output = exec('asusctl profile list');
    // Expected output format: "Quiet\nBalanced\nPerformance"
    return output.split('\n').filter(mode => mode.length > 0).map(
      (mode: string) => ({
        id: mode.toLowerCase(),
        name: mode,
      }),
    ) || [];
  }
  catch (error) {
    consola.error('Failed to list power modes:', error);
    return [];
  }
}

export function getCurrentPowerMode(): string | undefined {
  try {
    const powerModes = listPowerModes();
    if (powerModes.length === 0)
      return undefined;

    const output = exec('asusctl profile get');
    // Expected output format: "Active profile: Performance\nAC profile Performance\nBattery profile Quiet"
    return powerModes.find(
      mode => mode.name === output.match(/Active profile:\s*(\w+)/)?.[1],
    )?.id || undefined;
  }
  catch (error) {
    consola.error('Failed to get current power mode:', error);
    return undefined;
  }
}

export function setPowerMode(modeId: string): boolean {
  try {
    const powerModes = listPowerModes();
    const mode = powerModes.find(m => m.id === modeId);
    if (!mode) {
      consola.error('Invalid power mode ID:', modeId);
      return false;
    }
    exec(`asusctl profile set ${mode.name}`);
    return true;
  }
  catch (error) {
    consola.error('Failed to set power mode:', error);
    return false;
  }
}

/*
example output of `asusctl info`:
asusctl v6.3.0

Software version: 6.3.0
  Product family: ROG Zephyrus G14
      Board name: GA403UV
*/
export interface TDeviceInfo {
  key: string;
  name: string;
  content: string;
}
export function getDeviceInfo(): TDeviceInfo[] {
  try {
    const output = exec('asusctl info');
    const infoList: TDeviceInfo[] = [];
    // Parse the output as needed
    if (output.match(/asusctl v([\d.]+)/)?.[1]) {
      infoList.push({
        key: 'version',
        name: 'asusctl Version',
        content: output.match(/asusctl v([\d.]+)/)?.[1] || 'Unknown',
      });
    }
    if (output.match(/Product family:\s*(.+)/)?.[1]) {
      infoList.push({
        key: 'product_family',
        name: 'Product Family',
        content: output.match(/Product family:\s*(.+)/)?.[1] || 'Unknown',
      });
    }
    if (output.match(/Board name:\s*(.+)/)?.[1]) {
      infoList.push({
        key: 'board_name',
        name: 'Board Name',
        content: output.match(/Board name:\s*(.+)/)?.[1] || 'Unknown',
      });
    }
    return infoList;
  }
  catch (error) {
    consola.error('Failed to get device model:', error);
    return [];
  }
}
