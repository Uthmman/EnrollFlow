
import EnrollmentForm from '@/components/enrollment-form';
import { School } from 'lucide-react'; // Using School as a generic icon

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 lg:p-24 bg-gradient-to-br from-background to-primary/10">
      <div className="w-full max-w-4xl">
        <header className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-full mb-3 sm:mb-4 shadow-lg">
            <School size={36} className="sm:size-48" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary">
            Welcome to EnrollFlow
          </h1>
          <p className="mt-2 sm:mt-3 text-md sm:text-lg md:text-xl text-foreground/80">
            Begin by creating your parent account, then register your children and complete the payment.
          </p>
        </header>
        
        <EnrollmentForm />

        <footer className="mt-10 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EnrollFlow. All rights reserved.</p>
          <p>Powered by Awesome Technology™</p>
        </footer>
      </div>
    </main>
  );
}
