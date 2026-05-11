import * as Gio from '@gtkx/ffi/gio';
import * as GLib from '@gtkx/ffi/glib';
import consola from 'consola';

import { AURA_IFACE, AURA_PATH, createSystemProxy, findInterfaceProxies, getProperty, setProperty } from './dbus.js';

function getAuraProxies(): Gio.DBusProxy[] {
  try {
    const proxies = findInterfaceProxies(AURA_IFACE);
    if (proxies.length > 0)
      return proxies;
  }
  catch {
    // No ObjectManager on older asusd: use default Aura path from `rog-dbus`.
  }
  return [createSystemProxy(AURA_PATH, AURA_IFACE)];
}

function getFirstAuraProxy(): Gio.DBusProxy {
  return getAuraProxies()[0];
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

export function getCurrentBrightness(): string {
  try {
    const brightness = getProperty(getFirstAuraProxy(), 'Brightness');
    if (!brightness)
      return 'med';
    return BRIGHTNESS_BY_VALUE[getUintVariant(brightness)] ?? 'med';
  }
  catch (error) {
    consola.error('Failed to get current brightness:', error);
    return 'med';
  }
}

export type TBrightnessLevel = 'off' | 'low' | 'med' | 'high';

const BRIGHTNESS_BY_VALUE: Record<number, TBrightnessLevel> = {
  0: 'off',
  1: 'low',
  2: 'med',
  3: 'high',
};

const BRIGHTNESS_VALUE: Record<TBrightnessLevel, number> = {
  off: 0,
  low: 1,
  med: 2,
  high: 3,
};

export function setKeyboardBrightness(level: TBrightnessLevel): boolean {
  try {
    for (const proxy of getAuraProxies()) {
      setProperty(proxy, AURA_IFACE, 'Brightness', GLib.Variant.newUint32(BRIGHTNESS_VALUE[level]));
    }
    return true;
  }
  catch (error) {
    consola.error('Failed to set keyboard brightness:', error);
    return false;
  }
}

export type TPowerZone = 'boot' | 'awake' | 'sleep' | 'shutdown';

export interface TKeyboardPowerStates {
  boot: boolean;
  awake: boolean;
  sleep: boolean;
  shutdown: boolean;
}

/** `PowerZones::Keyboard` in `rog-aura` (DBus `u`). */
const POWER_ZONE_KEYBOARD = 1;

export function getKeyboardPowerStates(): TKeyboardPowerStates {
  const defaultStates: TKeyboardPowerStates = {
    boot: true,
    awake: true,
    sleep: true,
    shutdown: true,
  };

  try {
    const power = getProperty(getFirstAuraProxy(), 'LedPower');
    if (!power)
      return defaultStates;

    const states = power.getChildValue(0);
    for (let i = 0; i < states.nChildren(); i += 1) {
      const state = states.getChildValue(i);
      if (getUintVariant(state.getChildValue(0)) !== POWER_ZONE_KEYBOARD)
        continue;
      return {
        boot: state.getChildValue(1).getBoolean(),
        awake: state.getChildValue(2).getBoolean(),
        sleep: state.getChildValue(3).getBoolean(),
        shutdown: state.getChildValue(4).getBoolean(),
      };
    }
    return defaultStates;
  }
  catch (error) {
    consola.error('Failed to get keyboard power states:', error);
    return defaultStates;
  }
}

export function setKeyboardPowerState(state: TKeyboardPowerStates): boolean {
  try {
    const value = GLib.Variant.parse(
      `([(uint32 ${POWER_ZONE_KEYBOARD}, ${state.boot}, ${state.awake}, ${state.sleep}, ${state.shutdown})],)`,
      new GLib.VariantType('(a(ubbbb))'),
    );
    for (const proxy of getAuraProxies()) {
      setProperty(proxy, AURA_IFACE, 'LedPower', value);
    }
    return true;
  }
  catch (error) {
    consola.error(`Failed to set keyboard power state for ${state}:`, error);
    return false;
  }
}

export interface TAuraMode {
  id: string;
  name: string;
  requiredParams: string[];
  optionalParams: string[];
}

export type TAuraModeParams = Record<string, string>;

/** `rog_aura::builtin_modes::AuraModeNum` (DBus `u`). */
const AURA_MODE_ID_MAP: Record<number, string> = {
  0: 'static',
  1: 'breathe',
  2: 'rainbow-cycle',
  3: 'rainbow-wave',
  4: 'stars',
  5: 'rain',
  6: 'highlight',
  7: 'laser',
  8: 'ripple',
  10: 'pulse',
  11: 'comet',
  12: 'flash',
};

const AURA_MODES: Array<TAuraMode & { value: number }> = [
  { id: 'static', name: 'Static', value: 0, requiredParams: ['colour'], optionalParams: ['zone'] },
  { id: 'breathe', name: 'Breathe', value: 1, requiredParams: ['colour', 'colour2', 'speed'], optionalParams: ['zone'] },
  { id: 'rainbow-cycle', name: 'Rainbow Cycle', value: 2, requiredParams: ['speed'], optionalParams: ['zone'] },
  { id: 'rainbow-wave', name: 'Rainbow Wave', value: 3, requiredParams: ['speed', 'direction'], optionalParams: ['zone'] },
  { id: 'stars', name: 'Stars', value: 4, requiredParams: ['colour', 'colour2', 'speed'], optionalParams: ['zone'] },
  { id: 'rain', name: 'Rain', value: 5, requiredParams: ['speed'], optionalParams: ['zone'] },
  { id: 'highlight', name: 'Highlight', value: 6, requiredParams: ['colour', 'speed'], optionalParams: ['zone'] },
  { id: 'laser', name: 'Laser', value: 7, requiredParams: ['colour', 'speed'], optionalParams: ['zone'] },
  { id: 'ripple', name: 'Ripple', value: 8, requiredParams: ['colour', 'speed'], optionalParams: ['zone'] },
  { id: 'pulse', name: 'Pulse', value: 10, requiredParams: ['colour'], optionalParams: ['zone'] },
  { id: 'comet', name: 'Comet', value: 11, requiredParams: ['colour'], optionalParams: ['zone'] },
  { id: 'flash', name: 'Flash', value: 12, requiredParams: ['colour'], optionalParams: ['zone'] },
];

/** Lazy: constructing `VariantType` at module load breaks Vite SSR (GTK not started). */
let auraEffectTypeCache: GLib.VariantType | null = null;
function auraEffectVariantType(): GLib.VariantType {
  if (!auraEffectTypeCache)
    auraEffectTypeCache = new GLib.VariantType('(uu(yyy)(yyy)ss)');
  return auraEffectTypeCache;
}

export interface TCurrentAuraState {
  modeId?: string;
  modeRaw?: number;
  zone?: number;
  colour?: string;
  colour2?: string;
  speed?: string;
  direction?: string;
}

function colourToHex(colour: GLib.Variant): string {
  return Array.from({ length: 3 }, (_, i) =>
    colour.getChildValue(i).getByte().toString(16).padStart(2, '0'),
  ).join('');
}

function parseLedModeData(data: GLib.Variant): TCurrentAuraState | undefined {
  const modeRaw = getUintVariant(data.getChildValue(0));
  const zone = getUintVariant(data.getChildValue(1));
  return {
    modeRaw,
    modeId: AURA_MODE_ID_MAP[modeRaw],
    zone,
    colour: colourToHex(data.getChildValue(2)),
    colour2: colourToHex(data.getChildValue(3)),
    speed: data.getChildValue(4).getString(),
    direction: data.getChildValue(5).getString(),
  };
}

export function getCurrentAuraState(): TCurrentAuraState | undefined {
  for (const proxy of getAuraProxies()) {
    const data = getProperty(proxy, 'LedModeData');
    if (!data)
      continue;
    const state = parseLedModeData(data);
    if (state)
      return state;
  }
  return undefined;
}

export function getAllAuraModes(): TAuraMode[] {
  try {
    const supported = getProperty(getFirstAuraProxy(), 'SupportedBasicModes');
    if (!supported)
      return [];
    const supportedValues = new Set(
      Array.from({ length: supported.nChildren() }, (_, i) => getUintVariant(supported.getChildValue(i))),
    );
    return AURA_MODES.filter(mode => supportedValues.has(mode.value));
  }
  catch (error) {
    consola.error('Failed to get aura modes:', error);
    return [];
  }
}

function parseHexColour(hex: string | undefined): [number, number, number] {
  const normalized = hex?.replace(/^#/, '').padEnd(6, '0').slice(0, 6) ?? 'ffffff';
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function titleCaseEnum(value: string | undefined, fallback: string, allowed: string[]): string {
  const normalized = value?.toLowerCase() ?? fallback;
  return allowed.includes(normalized)
    ? normalized[0].toUpperCase() + normalized.slice(1)
    : fallback[0].toUpperCase() + fallback.slice(1);
}

function auraEffectVariant(modeValue: number, params: TAuraModeParams): GLib.Variant {
  const zone = Number.parseInt(params.zone ?? '0', 10) || 0;
  const [r1, g1, b1] = parseHexColour(params.colour);
  const [r2, g2, b2] = parseHexColour(params.colour2);
  const speed = titleCaseEnum(params.speed, 'med', ['low', 'med', 'high']);
  const direction = titleCaseEnum(params.direction, 'right', ['up', 'down', 'left', 'right']);

  return GLib.Variant.parse(
    `(uint32 ${modeValue}, uint32 ${zone}, (byte ${r1}, byte ${g1}, byte ${b1}), (byte ${r2}, byte ${g2}, byte ${b2}), '${speed}', '${direction}')`,
    auraEffectVariantType(),
  );
}

export function setAuraMode(modeId: string, params: TAuraModeParams): boolean {
  try {
    const mode = AURA_MODES.find(m => m.id === modeId);
    if (!mode)
      return false;
    const effect = auraEffectVariant(mode.value, params);
    for (const proxy of getAuraProxies()) {
      setProperty(proxy, AURA_IFACE, 'LedModeData', effect);
    }
    return true;
  }
  catch (error) {
    consola.error('Failed to set aura mode:', error);
    return false;
  }
}
