import * as Gio from '@gtkx/ffi/gio';
import * as GLib from '@gtkx/ffi/glib';

/** Well-known name for asusd (matches `rog-dbus` generated proxies). */
export const ASUSD_SERVICE = 'xyz.ljones.Asusd';

export const PLATFORM_IFACE = 'xyz.ljones.Platform';
export const PLATFORM_PATH = '/xyz/ljones';

export const AURA_IFACE = 'xyz.ljones.Aura';
/** Default object path from `rog-dbus/src/zbus_aura.rs`. */
export const AURA_PATH = '/xyz/ljones/Aura';

export function createSystemProxy(objectPath: string, interfaceName: string): Gio.DBusProxy {
  return Gio.DBusProxy.newForBusSync(
    Gio.BusType.SYSTEM,
    Gio.DBusProxyFlags.NONE,
    ASUSD_SERVICE,
    objectPath,
    interfaceName,
  );
}

export function getProperty(proxy: Gio.DBusProxy, propertyName: string): GLib.Variant | null {
  return proxy.getCachedProperty(propertyName);
}

export function setProperty(
  proxy: Gio.DBusProxy,
  interfaceName: string,
  propertyName: string,
  value: GLib.Variant,
): void {
  proxy.callSync(
    'org.freedesktop.DBus.Properties.Set',
    Gio.DBusCallFlags.NONE,
    -1,
    GLib.Variant.newTuple([
      GLib.Variant.newString(interfaceName),
      GLib.Variant.newString(propertyName),
      GLib.Variant.newVariant(value),
    ], 3),
  );
}

/** Resolve every object exporting `interfaceName` (ObjectManager on `/`). */
export function findInterfaceProxies(interfaceName: string): Gio.DBusProxy[] {
  const manager = Gio.DBusObjectManagerClient.newForBusSync(
    Gio.BusType.SYSTEM,
    Gio.DBusObjectManagerClientFlags.NONE,
    ASUSD_SERVICE,
    '/',
  );

  return manager
    .getObjects()
    .map(object => object.getInterface(interfaceName))
    .filter((iface): iface is NonNullable<typeof iface> => iface !== null)
    .map(iface => iface as unknown as Gio.DBusProxy);
}
