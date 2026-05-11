import * as GLib from '@gtkx/ffi/glib';
import { createRef } from '@gtkx/native';
import consola from 'consola';

import { createSystemProxy, getProperty, PLATFORM_IFACE, PLATFORM_PATH, setProperty } from './dbus.js';

/**
 * Charge limit from asusd (`ChargeControlEndThreshold` on `xyz.ljones.Platform`).
 */
export function getChargeLimit(): number {
  try {
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    const limit = getProperty(proxy, 'ChargeControlEndThreshold');
    if (limit)
      return limit.getByte() || 100;
    return 100;
  }
  catch (error) {
    consola.error('Failed to get charge limit:', error);
    return 100;
  }
}

export function setChargeLimit(limit: number): boolean {
  try {
    if (limit < 0 || limit > 100) {
      consola.error('Charge limit must be between 0 and 100');
      return false;
    }
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    setProperty(proxy, PLATFORM_IFACE, 'ChargeControlEndThreshold', GLib.Variant.newByte(limit));
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

/** Matches `rog_platform::platform::PlatformProfile` (u32 enum in DBus). */
const POWER_MODE_NAMES: Record<number, string> = {
  0: 'Balanced',
  1: 'Performance',
  2: 'Quiet',
  3: 'Low Power',
  4: 'Custom',
};

function modeIdFromValue(value: number): string {
  return POWER_MODE_NAMES[value]?.toLowerCase().replace(/\s+/g, '-') ?? String(value);
}

function modeValueFromId(id: string): number | undefined {
  return Object.keys(POWER_MODE_NAMES)
    .map(Number)
    .find(value => modeIdFromValue(value) === id);
}

function getUintVariant(value: GLib.Variant): number {
  switch (value.getTypeString()) {
    case 'u':
      return value.getUint32();
    case 'y':
      return value.getByte();
    case 'i':
      return value.getInt32();
    default:
      return Number(value.print(false));
  }
}

export function listPowerModes(): TPowerMode[] {
  try {
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    const choices = getProperty(proxy, 'PlatformProfileChoices');
    if (!choices)
      return [];

    return Array.from({ length: choices.nChildren() }, (_, i) => getUintVariant(choices.getChildValue(i))).map(
      value => ({
        id: modeIdFromValue(value),
        name: POWER_MODE_NAMES[value] ?? `Mode ${value}`,
      }),
    );
  }
  catch (error) {
    consola.error('Failed to list power modes:', error);
    return [];
  }
}

export function getCurrentPowerMode(): string | undefined {
  try {
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    const mode = getProperty(proxy, 'PlatformProfile');
    if (!mode)
      return undefined;
    return modeIdFromValue(getUintVariant(mode));
  }
  catch (error) {
    consola.error('Failed to get current power mode:', error);
    return undefined;
  }
}

export function setPowerMode(modeId: string): boolean {
  try {
    const modeValue = modeValueFromId(modeId);
    if (modeValue === undefined) {
      consola.error('Invalid power mode ID:', modeId);
      return false;
    }
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    setProperty(proxy, PLATFORM_IFACE, 'PlatformProfile', GLib.Variant.newUint32(modeValue));
    return true;
  }
  catch (error) {
    consola.error('Failed to set power mode:', error);
    return false;
  }
}

export interface TDeviceInfo {
  key: string;
  name: string;
  content: string;
}

function readDmiValue(name: string): string | undefined {
  try {
    const contents = createRef<number[]>([]);
    const length = createRef(0);
    GLib.fileGetContents(`/sys/class/dmi/id/${name}`, contents, length);
    return String.fromCharCode(...contents.value.slice(0, length.value)).trim() || undefined;
  }
  catch {
    return undefined;
  }
}

export function getDeviceInfo(): TDeviceInfo[] {
  try {
    const infoList: TDeviceInfo[] = [];
    const proxy = createSystemProxy(PLATFORM_PATH, PLATFORM_IFACE);
    const version = getProperty(proxy, 'Version')?.getString();
    const productFamily = readDmiValue('product_family');
    const boardName = readDmiValue('board_name');

    if (version) {
      infoList.push({
        key: 'version',
        name: 'asusd Version',
        content: version,
      });
    }
    if (productFamily) {
      infoList.push({
        key: 'product_family',
        name: 'Product Family',
        content: productFamily,
      });
    }
    if (boardName) {
      infoList.push({
        key: 'board_name',
        name: 'Board Name',
        content: boardName,
      });
    }
    return infoList;
  }
  catch (error) {
    consola.error('Failed to get device model:', error);
    return [];
  }
}
