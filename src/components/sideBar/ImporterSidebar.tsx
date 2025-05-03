'use client';
import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import data from './navData/importerNavData';
import { toast } from 'react-hot-toast';
import { tokenService } from '@/lib/axios';

export function DrugImporterSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { theme } = useTheme();
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  const pageName =
    pathSegments.length > 2 ? pathSegments[2]?.replaceAll('-', ' ') : undefined;

  // State for active navigation item
  const [activeNavName, setActiveNavName] = useState<string>(
    pageName !== undefined ? pageName : 'Dashboard'
  );

  // Update active nav name when pathname changes
  useEffect(() => {
    if (pageName !== undefined) {
      setActiveNavName(pageName);
    }
  }, [pathname, pageName]);

  const { state } = useSidebar();
  const navData = data;

  // Handle logout
  const handleLogout = () => {
    tokenService.clearToken(); // Clear all auth data from storage
    toast.success('Logged out successfully');
    router.push('/auth/login'); // Redirect to login page
  };

  // Determine logo path based on theme
  const logoPath =
    theme === 'dark' ? '/images/logo-dark.png' : '/images/logo.png';

  return (
    <Sidebar
      collapsible='icon'
      className='border-border dark:bg-background/95 border-r'
      {...props}
    >
      <SidebarHeader className='border-border/50 border-b py-2'>
        {state === 'expanded' ? (
          <div className='flex flex-row items-center justify-center gap-2 px-4 font-bold'>
            <span>
              <Image
                src={logoPath}
                width={28}
                height={28}
                priority
                alt='MediPharm logo'
                className='h-7 w-7 object-contain'
              />
            </span>
            <span className='text-lg'>MediPharm</span>
          </div>
        ) : (
          <div className='flex flex-row items-center justify-center'>
            <span>
              <Image
                src={logoPath}
                width={28}
                height={28}
                priority
                alt='MediPharm logo'
                className='h-7 w-7 object-contain'
              />
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className='px-1 py-2'>
        <SidebarMenu>
          {navData.map((item) => 
            item.type !== 'sub' && (
              <SidebarMenuItem
                key={item.name}
                onClick={() => setActiveNavName(item.name)}
              >
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.name.toLowerCase() === activeNavName?.toLowerCase()
                  }
                  tooltip={state === 'collapsed' ? item.name : undefined}
                  className='hover:bg-accent/80'
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className='size-5' />}
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className='border-border/50 border-t py-2'>
        <div className="px-2 py-2">
          {/* User Profile Section - Simple version without user data */}
          <div className={`flex items-center gap-3 mb-2 ${state === 'collapsed' ? 'justify-center' : ''}`}>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            
            {state === 'expanded' && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">Drug Importer</p>
                <p className="text-xs text-muted-foreground truncate">User</p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className={`w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${state === 'collapsed' ? 'justify-center' : ''}`}
            type="button"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            {state === 'expanded' && <span>Logout</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}