import { Grid3X3, Briefcase, Gavel, Mail, User, Settings, LogOut, CircleArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  currentPath: string;
  displayName: string;
  displayEmail: string;
  profilePictureUrl?: string;
  unreadMessageCount?: number;
  isVerifiedStudent?: boolean;
  onSignOut: () => void;
}

export const AppSidebar = ({ currentPath, displayName, displayEmail, profilePictureUrl, unreadMessageCount, isVerifiedStudent, onSignOut }: AppSidebarProps) => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: Grid3X3, label: 'Dashboard', showForAll: true },
    { path: '/projects', icon: Briefcase, label: 'Projects', showForAll: true },
    { path: '/bids', icon: Gavel, label: 'Bids', showForAll: true },
    { path: '/messages', icon: Mail, label: 'Messages', showForAll: true },
    { path: '/community', icon: Users, label: 'Community', showForAll: false },
    { path: '/profile', icon: User, label: 'Profile', showForAll: true },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border/60 p-5 flex flex-col justify-between fixed left-0 top-0 h-screen">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <CircleArrowRight className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-foreground text-lg font-bold tracking-tight">THEUNOiA</h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col">
          {navItems.map((item) => {
            // Hide community item if user is not a verified student
            if (!item.showForAll && !isVerifiedStudent) {
              return null;
            }

            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium rounded-xl'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <p className="text-[0.9375rem]">{item.label}</p>
                {item.path === '/messages' && unreadMessageCount && unreadMessageCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-3">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          <p className="text-[0.9375rem]">Settings</p>
        </a>
        <div className="border-t border-border/60 my-1"></div>
        <div className="flex items-center gap-3 px-2">
          {profilePictureUrl ? (
            <img 
              src={profilePictureUrl} 
              alt="Profile" 
              className="aspect-square bg-cover rounded-full size-10 shadow-sm object-cover"
            />
          ) : (
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-primary to-accent shadow-sm" />
          )}
          <div className="flex flex-col">
            <h1 className="text-foreground text-sm font-semibold">{displayName}</h1>
            <p className="text-muted-foreground text-xs">{displayEmail}</p>
          </div>
          <button 
            onClick={onSignOut}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
