// === Layout Component ===
// Main layout shell with Header, Sidebar, MainContent, and Footer

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-bg0 text-fg1">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          {children || <Outlet />}
        </main>
      </div>
      <Footer />
    </div>
  );
}
