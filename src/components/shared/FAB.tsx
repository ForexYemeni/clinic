'use client';

import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon?: typeof Plus;
  className?: string;
}

export function FAB({ onClick, icon: Icon = Plus, className = '' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={`fab bottom-24 left-6 bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
