import React from 'react';
import { Header } from './HeaderHome';

interface LayoutHomeProps {
  children: React.ReactNode;
}

export function LayoutHome({ children }: LayoutHomeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );
}