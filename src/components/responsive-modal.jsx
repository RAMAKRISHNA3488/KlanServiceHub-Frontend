import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useMedia } from 'react-use';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
export const ResponsiveModal = ({ children, title, description, open, onOpenChange }) => {
    const isDesktop = useMedia('(min-width: 1024px)', true);
    if (isDesktop) {
        return (<Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hide-scrollbar max-h-[85vh] w-full overflow-y-auto border-none p-0 sm:max-w-lg">
          <VisuallyHidden.Root>
            <DialogTitle>{title}</DialogTitle>

            <DialogDescription>{description}</DialogDescription>
          </VisuallyHidden.Root>
          {children}
        </DialogContent>
      </Dialog>);
    }
    return (<Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <VisuallyHidden.Root>
          <DrawerTitle>{title}</DrawerTitle>

          <DrawerDescription>{description}</DrawerDescription>
        </VisuallyHidden.Root>
        <div className="hide-scrollbar max-h-[85vh] overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>);
};
