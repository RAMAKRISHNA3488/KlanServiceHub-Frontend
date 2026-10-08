'use client';
import React, { useEffect, useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

export const MobileSidebar = ({ open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const location = useLocation();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  // Auto-close drawer whenever navigation occurs
  useEffect(() => {
    setIsOpen?.(false);
  }, [location.pathname, setIsOpen]);

  // Global event listener for opening/toggling the mobile sidebar
  useEffect(() => {
    const handleOpen = () => setIsOpen?.(true);
    const handleToggle = () => setIsOpen?.(!isOpen);

    window.addEventListener('klanservicehub-open-mobile-sidebar', handleOpen);
    window.addEventListener('klanservicehub-toggle-mobile-sidebar', handleToggle);

    return () => {
      window.removeEventListener('klanservicehub-open-mobile-sidebar', handleOpen);
      window.removeEventListener('klanservicehub-toggle-mobile-sidebar', handleToggle);
    };
  }, [isOpen, setIsOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="p-0 w-[310px] max-w-[86vw] bg-white h-full flex flex-col z-50">
        <SheetHeader className="sr-only">
          <VisuallyHidden.Root>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root>
            <SheetDescription>Main navigation and workspace switcher drawer</SheetDescription>
          </VisuallyHidden.Root>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pt-4 pb-8">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
};
