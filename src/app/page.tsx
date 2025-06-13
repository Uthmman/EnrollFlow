
"use client";

import { useState } from 'react';
import EnrollmentForm from '@/components/enrollment-form';
import AppHeader from '@/components/app-header'; // Import AppHeader
import { UserPlus } from 'lucide-react';

export default function HomePage() {
  const [formStage, setFormStage] = useState<'initial' | 'accountCreated'>('initial');
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  const handleFormStageChange = (stage: 'initial' | 'accountCreated') => {
    setFormStage(stage);
  };

  const handleAccountIconClick = () => {
    setShowAccountDialog(true);
  };

  const handleCloseAccountDialog = () => {
    setShowAccountDialog(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-background to-primary/10">
      {/* AppHeader is now always rendered here, but its content (account icon) is conditional */}
      <AppHeader 
        showAccountIcon={formStage === 'accountCreated'} 
        onAccountClick={handleAccountIconClick} 
      />
      
      <div className="w-full max-w-4xl p-4 sm:p-8 md:p-12 lg:p-24 pt-2 sm:pt-4 md:pt-6 lg:pt-8"> {/* Adjusted padding */}
        {formStage === 'initial' && (
          <header className="mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-full mb-3 sm:mb-4 shadow-lg">
              <UserPlus size={30} className="sm:size-36" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary">
              Welcome to Hafsa Madrassa Programs
            </h1>
            <p className="mt-2 sm:mt-3 text-md sm:text-lg md:text-xl text-foreground/80">
              Begin by creating a primary account. Then, you can add participants or enroll yourself in our programs.
            </p>
          </header>
        )}
        
        <EnrollmentForm 
          onStageChange={handleFormStageChange}
          showAccountDialogFromParent={showAccountDialog}
          onCloseAccountDialog={handleCloseAccountDialog}
        />

        <footer className="mt-10 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Hafsa Madrassa. All rights reserved.</p>
          <p>Quality Islamic Education</p>
        </footer>
      </div>
    </main>
  );
}
