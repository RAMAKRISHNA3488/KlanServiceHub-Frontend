import { ModalProvider } from '@/components/modal-provider';
import { KlanserviceHubTopNavbar } from '@/components/klanservicehub-top-navbar';
import { Sidebar } from '@/components/sidebar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-[#F4F5F7] overflow-hidden">
      <ModalProvider />

      {/* KlanserviceHub Global Top Navbar (Fixed at top) */}
      <div className="shrink-0 z-40">
        <KlanserviceHubTopNavbar />
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileSidebar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* KlanserviceHub Left Project & Workspace Sidebar (Desktop, fixed left with independent scroll) */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-neutral-200/90 bg-white h-full overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Middle / Center Work Area (Independently scrollable) */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto overflow-x-hidden">
          <main className="flex-1 p-3.5 sm:p-5 md:p-8 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Real-World Mobile Bottom Navigation Bar (Mobile / Tablet) */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
