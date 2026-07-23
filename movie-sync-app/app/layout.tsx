import type { Metadata } from 'next';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MovieSync',
  description: 'Watch movies together in real-time',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-slate-950 text-white">
          {/* Global Header */}
          <header className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              <h1 className="text-xl font-bold tracking-tight text-white">MovieSync</h1>
            </div>

            <div>
              <Show when="signed-out">
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </Show>

              <Show when="signed-in">
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      userButtonOuterIdentifier: 'text-gray-200 font-medium text-sm',
                    },
                  }}
                />
              </Show>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}