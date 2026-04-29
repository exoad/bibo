// === Main App Component ===
// Provides Router, QueryClient providers, and the layout shell

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Layout } from './components/layout/Layout';
import { SessionsView } from './components/sessions/SessionsView';
import { SessionDetail } from './components/sessions/SessionDetail';
import { BrainView } from './components/brain/BrainView';
import { VaultView } from './components/vault/VaultView';
import { VaultNoteView } from './components/vault/VaultNoteView';
import { QuestsView } from './components/quests/QuestsView';
import { SkillsView } from './components/skills/SkillsView';
import { ConfigView } from './components/config/ConfigView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/sessions" replace />} />
            <Route path="/sessions" element={<SessionsView />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/brain" element={<BrainView />} />
            <Route path="/vault" element={<VaultView />} />
            <Route path="/vault/:slug" element={<VaultNoteView />} />
            <Route path="/quests" element={<QuestsView />} />
            <Route path="/skills" element={<SkillsView />} />
            <Route path="/config" element={<ConfigView />} />
            <Route path="*" element={<Navigate to="/sessions" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
