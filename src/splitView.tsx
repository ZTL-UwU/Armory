import {
  AdwHeaderBar,
  AdwNavigationSplitView,
  AdwToolbarView,
  GtkBox,
  GtkImage,
  GtkLabel,
  GtkListBox,
  GtkScrolledWindow,
  x,
} from '@gtkx/react';
import { useState } from 'react';

import { DevicePage } from './pages/device.js';
import { KeyboardPage } from './pages/keyboard.js';

interface Item {
  id: string;
  title: string;
  icon: string;
}

const items: Item[] = [
  { id: 'device', title: 'Device', icon: 'computer-symbolic' },
  { id: 'keyboard', title: 'Keyboard Aura', icon: 'org.gnome.Settings-keyboard-symbolic' },
  { id: 'fan', title: 'Fan Curve', icon: 'function-linear-symbolic' },
  { id: 'slash', title: 'Slash', icon: 'preferences-color-symbolic' },
];

function Page({ selected }: { selected: Item }) {
  if (selected.id === 'device')
    return (<DevicePage />);
  else if (selected.id === 'keyboard')
    return (<KeyboardPage />);
}

export function SplitView() {
  const [selected, setSelected] = useState(items[0]);

  return (
    <AdwNavigationSplitView
      sidebarWidthFraction={0.25}
      minSidebarWidth={200}
      maxSidebarWidth={300}
    >
      <x.NavigationPage for={AdwNavigationSplitView} id="sidebar" title="ROG Center">
        <AdwToolbarView>
          <x.ToolbarTop>
            <AdwHeaderBar />
          </x.ToolbarTop>
          <GtkScrolledWindow vexpand>
            <GtkListBox
              cssClasses={['navigation-sidebar']}
              onRowSelected={(_, row) => {
                if (!row)
                  return;
                const item = items[row.getIndex()];
                if (item)
                  setSelected(item);
              }}
            >
              {items.map(item => (
                <GtkBox key={item.id} spacing={12} marginStart={6} marginEnd={6} marginTop={12} marginBottom={12}>
                  <GtkImage iconName={item.icon} />
                  <GtkLabel label={item.title}></GtkLabel>
                </GtkBox>
              ))}
            </GtkListBox>
          </GtkScrolledWindow>
        </AdwToolbarView>
      </x.NavigationPage>

      <x.NavigationPage
        for={AdwNavigationSplitView}
        id="content"
        title={selected?.title ?? ''}
      >
        <AdwToolbarView>
          <x.ToolbarTop>
            <AdwHeaderBar />
          </x.ToolbarTop>
          <Page selected={selected}></Page>
        </AdwToolbarView>
      </x.NavigationPage>
    </AdwNavigationSplitView>
  );
}
