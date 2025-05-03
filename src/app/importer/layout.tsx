/* eslint-disable tailwindcss/no-custom-classname */
'use client';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import TopNavBar from '@/components/navBarTopRight';
import { Separator } from '@radix-ui/react-separator';
import DynamicBreadcrumb from '@/components/dynamicBreadcrumb';
import { usePathname } from 'next/navigation';
import { DrugImporterSidebar } from '@/components/sideBar/ImporterSidebar';
import { useEffect } from 'react';
import { checkTokenValidity } from '@/lib/axios';

export default function DImporterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the current path to check if we're on the register page
  const pathname = usePathname();

  // Check token validity periodically
  useEffect(() => {
    // Check token on initial load
    checkTokenValidity();
    
    // Set up interval to check token validity every minute
    const intervalId = setInterval(() => {
      checkTokenValidity();
    }, 60000); // 1 minute
    
    return () => clearInterval(intervalId);
  }, []);

  // If we're on the register page, just render the children without the layout
  if (pathname === '/importer/register' || pathname === '/auth/login') {
    return <>{children}</>;
  }
  
  // Otherwise, render the full layout
  return (
    <SidebarProvider>
      <DrugImporterSidebar />
      <SidebarInset className='dark:bg-background'>
        <header className='bg-accent flex h-16 shrink-0 items-center justify-between pr-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <DynamicBreadcrumb />
          </div>
          <TopNavBar />
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}