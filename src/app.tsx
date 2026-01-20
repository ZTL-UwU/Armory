import { AdwApplicationWindow, quit } from '@gtkx/react';
import { SplitView } from './splitView.js';

export function App() {
  return (
    <AdwApplicationWindow title="Rog Center" defaultWidth={800} defaultHeight={600} onClose={quit}>
      <SplitView />
    </AdwApplicationWindow>
  );
}

export default App;
