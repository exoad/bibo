// === Main App Component ===
// Flat, utilitarian dashboard — no decoration, pure information density

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import Dashboard from './components/Dashboard';
import { SessionDetail } from './components/sessions/SessionDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Session detail view - full screen */}
          <Route path="/sessions/:id" element={<SessionDetail />} />
          {/* Main app layout with sidebar */}
          <Route path="/*" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
