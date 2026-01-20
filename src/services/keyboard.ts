import consola from 'consola';
import { exec } from '../utils.js';

export function getCurrentBrightness(): string {
  try {
    const output = exec('asusctl leds get');
    // Expected output format: "Current keyboard led brightness: Med"
    const match = output.match(/brightness:\s+(\w+)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    return 'med'; // Default to 'med' if parsing fails
  }
  catch (error) {
    consola.error('Failed to get current brightness:', error);
    return 'med'; // Default to 'med' on error
  }
}

export type TBrightnessLevel = 'off' | 'low' | 'med' | 'high';
export function setKeyboardBrightness(level: TBrightnessLevel): boolean {
  try {
    exec(`asusctl leds set ${level}`);
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

function findAuraDevicePath(): string | undefined {
  try {
    const output = exec('gdbus introspect --system --dest xyz.ljones.Asusd --object-path /xyz/ljones/aura');
    const regex = /^\s*node\s+([^\s{]+)/gm;
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(output)) !== null) {
      const name = match[1];
      // ignore root listings and absolute paths
      if (name === '{' || name.startsWith('/'))
        continue;
      return `/xyz/ljones/aura/${name}`;
    }
    return undefined;
  }
  catch (error) {
    consola.error('Failed to find aura device path:', error);
    return undefined;
  }
}

export function getKeyboardPowerStates(): TKeyboardPowerStates {
  const defaultStates: TKeyboardPowerStates = {
    boot: true,
    awake: true,
    sleep: true,
    shutdown: true,
  };

  try {
    const path = findAuraDevicePath();
    if (!path) {
      consola.error('No aura device path found');
      return defaultStates;
    }

    // Get all properties and parse LedPower robustly across formats
    const propsOutput = getAuraProperties(path);
    if (!propsOutput) {
      consola.error('Failed to get aura properties');
      return defaultStates;
    }

    // Expected LedPower snippet examples:
    //  - "'LedPower': <byte 0x0f>"
    //  - "'LedPower': <uint32 15>"
    //  - "'LedPower': <int32 15>"
    //  - "'LedPower': <0x0f>" (rare)
    const ledProp = propsOutput.match(/'LedPower':\s*<([^>]+)>/i);
    if (!ledProp) {
      consola.error('Failed to locate LedPower property');
      return defaultStates;
    }

    const raw = ledProp[1];

    // First, try parsing tuple-of-booleans format:
    // Example raw: "([(uint32 1, true, true, true, true)],)"
    const tupleMatch = raw.match(/\(\s*uint32\s+\d+,\s*(true|false),\s*(true|false),\s*(true|false),\s*(true|false)\s*\)/i);
    if (tupleMatch) {
      const [b, a, s, d] = tupleMatch.slice(1, 5).map(v => v.toLowerCase() === 'true');
      return {
        boot: b,
        awake: a,
        sleep: s,
        shutdown: d,
      };
    }

    consola.error(`Unrecognized LedPower format: ${raw}`);
    return defaultStates;
  }
  catch (error) {
    consola.error('Failed to get keyboard power states:', error);
    return defaultStates;
  }
}

export function setKeyboardPowerState(state: TKeyboardPowerStates): boolean {
  try {
    exec(`asusctl aura-power keyboard ${Object.entries(state).map(([k, v]) => v ? `--${k}` : '').join(' ')}`);
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

interface TAuraParamMeta {
  name: string;
  flag: string;
  optional: boolean;
}

function parseAuraUsage(helpOutput: string): { params: TAuraParamMeta[]; usageLine: string | undefined } {
  const usageLine = helpOutput.split('\n').find(line => line.toLowerCase().startsWith('usage:'));
  if (!usageLine)
    return { params: [], usageLine };

  const params: TAuraParamMeta[] = [];
  const flagParamRegex = /(-{1,2}[a-z][\w-]*)(?:,\s*-{1,2}[a-z][\w-]*)?\s*<([^>]+)>/gi;

  for (const match of usageLine.matchAll(flagParamRegex)) {
    const flag = match[1];
    const name = match[2];
    const idx = match.index ?? 0;
    const openBracket = usageLine.lastIndexOf('[', idx);
    const closeBracket = usageLine.lastIndexOf(']', idx);
    const optional = openBracket > closeBracket;
    params.push({ name, flag, optional });
  }

  return { params, usageLine };
}

function getAuraModeHelp(modeId: string): string | undefined {
  try {
    return exec(`asusctl aura ${modeId} --help`);
  }
  catch {
    consola.warn(`Skipping aura mode '${modeId}' due to help error`);
    return undefined;
  }
}

const AURA_MODE_ID_MAP: Record<number, string> = {
  0: 'static',
  1: 'breathe',
  2: 'rainbow-cycle',
  3: 'rainbow-wave',
  4: 'highlight',
  5: 'strobing',
  6: 'colour-cycle',
  7: 'rainbow',
  8: 'starry-night',
  9: 'music',
  10: 'pulse',
};

export interface TCurrentAuraState {
  modeId?: string;
  modeRaw?: number;
  zone?: number;
  colour?: string;
  colour2?: string;
  speed?: string;
  direction?: string;
}

function findAuraDevicePaths(): string[] {
  try {
    const output = exec('gdbus introspect --system --dest xyz.ljones.Asusd --object-path /xyz/ljones/aura');
    const paths: string[] = [];
    const regex = /^\s*node\s+([^\s{]+)/gm;
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(output)) !== null) {
      const name = match[1];
      // ignore root listings and absolute paths
      if (name === '{' || name.startsWith('/'))
        continue;
      paths.push(`/xyz/ljones/aura/${name}`);
    }
    return paths;
  }
  catch (error) {
    consola.error('Failed to discover aura devices via dbus:', error);
    return [];
  }
}

function hasAuraInterface(path: string): boolean {
  try {
    const output = exec(`gdbus introspect --system --dest xyz.ljones.Asusd --object-path ${path}`);
    return output.includes('interface xyz.ljones.Aura');
  }
  catch {
    return false;
  }
}

function getAuraProperties(path: string): string | undefined {
  try {
    if (!hasAuraInterface(path)) {
      return undefined;
    }
    return exec(`gdbus call --system --dest xyz.ljones.Asusd --object-path ${path} --method org.freedesktop.DBus.Properties.GetAll 'xyz.ljones.Aura'`);
  }
  catch (error) {
    consola.error(`Failed to read aura properties from ${path}:`, error);
    return undefined;
  }
}

function parseLedModeData(props: string): TCurrentAuraState | undefined {
  // Example: 'LedModeData': <(uint32 1, uint32 0, (byte 0xb5, byte 0x83, byte 0x5a), (byte 0x26, byte 0xa2, byte 0x69), 'Med', 'Right')>
  const dataRegex = /LedModeData': <\(uint32\s+(\d+),\s+uint32\s+(\d+),\s+\(byte\s+0x([0-9a-f]+),\s+byte\s+0x([0-9a-f]+),\s+byte\s+0x([0-9a-f]+)\),\s+\(byte\s+0x([0-9a-f]+),\s+byte\s+0x([0-9a-f]+),\s+byte\s+0x([0-9a-f]+)\),\s+'([^']+)',\s+'([^']+)'\)>/i;
  const match = props.match(dataRegex);
  if (!match)
    return undefined;

  const modeRaw = Number.parseInt(match[1], 10);
  const zone = Number.parseInt(match[2], 10);
  const c1 = match.slice(3, 6).map(v => Number.parseInt(v, 16));
  const c2 = match.slice(6, 9).map(v => Number.parseInt(v, 16));
  const speed = match[9];
  const direction = match[10];

  const toHex = (rgb: number[]) => rgb.map(v => v.toString(16).padStart(2, '0')).join('');

  return {
    modeRaw,
    modeId: AURA_MODE_ID_MAP[modeRaw],
    zone,
    colour: toHex(c1),
    colour2: toHex(c2),
    speed,
    direction,
  };
}

export function getCurrentAuraState(): TCurrentAuraState | undefined {
  const paths = findAuraDevicePaths();
  for (const path of paths) {
    const props = getAuraProperties(path);
    if (!props)
      continue;
    const state = parseLedModeData(props);
    if (state)
      return state;
  }
  return undefined;
}

export function getAllAuraModes(): TAuraMode[] {
  try {
    const output = exec('asusctl aura');
    // Parse available modes section from default aura output
    const lines = output.split('\n');
    const modes: TAuraMode[] = [];
    const availableIndex = lines.findIndex(line => line.toLowerCase().includes('available modes'));
    if (availableIndex === -1)
      return modes;

    // Collect consecutive non-empty indented lines after "Available modes:"
    for (let i = availableIndex + 1; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw || raw.trim().length === 0)
        break;
      const name = raw.trim();
      const id = name.toLowerCase().replace(/\s+/g, '-');

      const helpOutput = getAuraModeHelp(id);
      if (!helpOutput)
        continue;

      const { params, usageLine } = parseAuraUsage(helpOutput);
      if (!usageLine) {
        consola.warn(`Skipping aura mode '${id}' due to missing usage info`);
        continue;
      }

      const requiredParams = params.filter(p => !p.optional).map(p => p.name);
      const optionalParams = params.filter(p => p.optional).map(p => p.name);

      modes.push({
        id,
        name,
        requiredParams,
        optionalParams,
      });
    }

    return modes;
  }
  catch (error) {
    consola.error('Failed to get aura modes:', error);
    return [];
  }
}

export function setAuraMode(modeId: string, params: TAuraModeParams): boolean {
  try {
    const helpOutput = getAuraModeHelp(modeId);
    if (!helpOutput) {
      consola.error(`Missing usage info for aura mode '${modeId}'`);
      return false;
    }

    const { params: meta, usageLine } = parseAuraUsage(helpOutput);
    if (!usageLine) {
      consola.error(`Missing usage info for aura mode '${modeId}'`);
      return false;
    }

    const requiredArgs: string[] = [];
    const optionalArgs: string[] = [];

    for (const param of meta) {
      const value = params[param.name];
      if (param.optional) {
        if (value !== undefined)
          optionalArgs.push(`${param.flag} ${value}`);
      }
      else {
        if (value === undefined) {
          consola.error(`Missing required parameter '${param.name}' for aura mode '${modeId}'`);
          return false;
        }
        requiredArgs.push(`${param.flag} ${value}`);
      }
    }

    const argString = [...requiredArgs, ...optionalArgs].join(' ');
    exec(`asusctl aura ${modeId} ${argString}`.trim());
    return true;
  }
  catch (error) {
    consola.error('Failed to set aura mode:', error);
    return false;
  }
}
