import { ModalProvider } from '@/components/modal-provider';
import { JiraTopNavbar } from '@/components/jira-top-navbar';
import { Sidebar } from '@/components/sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7]">
      <ModalProvider />

      {/* Jira Global Top Navbar */}
      <JiraTopNavbar />

      <div className="flex flex-1 size-full">
        {/* Jira Left Project & Workspace Sidebar */}
        <div className="hidden lg:block w-[260px] shrink-0 border-r border-neutral-200/90 bg-white sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main Work Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
