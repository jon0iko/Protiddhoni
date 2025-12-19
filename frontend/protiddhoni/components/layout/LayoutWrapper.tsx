'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditorPage = pathname === '/write/editor';

  return (
    <>
      {!isEditorPage && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!isEditorPage && <Footer />}
    </>
  );
}
