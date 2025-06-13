
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { UserCog, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onAccountClick?: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onAccountClick }) => {
  return (
    <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-card sticky top-0 z-40 w-full">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src="https://placehold.co/40x40.png"
          alt="Hafsa Madrassa Logo"
          width={32}
          height={32}
          data-ai-hint="islamic education logo"
          className="h-8 w-8 rounded-md"
        />
        <h1 className="text-md sm:text-lg font-semibold text-primary truncate">
          Hafsa Madrassa
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Change language">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => console.log('English selected')}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.log('Amharic selected')}>
              Amharic (አማርኛ)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.log('Arabic selected')}>
              Arabic (العربية)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={onAccountClick} aria-label="Account settings">
          <UserCog className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
