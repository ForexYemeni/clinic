'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ModalSheet({ open, onClose, title, children }: ModalSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 overflow-hidden">
        <SheetHeader className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="overflow-y-auto custom-scrollbar p-4" style={{ maxHeight: 'calc(85vh - 65px)' }}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
