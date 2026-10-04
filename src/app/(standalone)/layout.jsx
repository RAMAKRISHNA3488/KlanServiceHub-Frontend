import { Logo } from '@/components/logo';
import { UserButton } from '@/features/auth/components/user-button';

const StandaloneLayout = ({ children }) => {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <main className="flex-1">
          <div className="mx-auto max-w-screen-2xl px-4">
            <nav className="flex h-[73px] items-center justify-between">
              <Logo />

              <div className="flex items-center gap-x-2.5">
                <UserButton />
              </div>
            </nav>

            <div className="flex flex-col items-center justify-center py-6">{children}</div>
          </div>
        </main>
      </div>
    );
};
export default StandaloneLayout;
