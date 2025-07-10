import React from 'react';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { motion } from 'framer-motion';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface ClerkAuthWrapperProps {
  children: React.ReactNode;
}

const ClerkAuthWrapper: React.FC<ClerkAuthWrapperProps> = ({ children }) => {
  // Debug logging


  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm"
        >
          <h1 className="text-2xl font-bold mb-4 text-red-400">Clerk Configuration Error</h1>
          <p className="text-gray-300 mb-4">Missing Clerk publishable key in environment variables.</p>
          <div className="text-left bg-gray-900/50 p-4 rounded-md">
            <p className="text-sm text-gray-400 mb-2">Please ensure you have:</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Created a .env file in your project root</li>
              <li>• Added: VITE_CLERK_PUBLISHABLE_KEY=your_key_here</li>
              <li>• Restarted your development server</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: 'rgba(17, 24, 39, 0.8)',
          colorInputBackground: 'rgba(55, 65, 81, 0.5)',
          colorInputText: '#ffffff',
          borderRadius: '0.5rem',
        },
        elements: {
          card: 'backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-300',
          socialButtonsBlockButton: 'bg-white/10 border border-white/20 hover:bg-white/20 text-white backdrop-blur-sm',
          formFieldLabel: 'text-white',
          formFieldInput: 'bg-white/10 border-white/30 text-white placeholder:text-gray-400 backdrop-blur-sm',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkAuthWrapper;