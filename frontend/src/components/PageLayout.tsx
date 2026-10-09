import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      {children}
    </div>
  );
}
