/**
 * Credit State Management
 *
 * Manages user credit balance, tracking remaining, used, and purchased credits.
 * Provides actions for refreshing credits from API and decrementing on usage.
 */

import { create } from 'zustand';

interface CreditState {
  // Credit balance state
  creditsRemaining: number;
  creditsUsed: number;
  creditsPurchased: number;

  // Actions
  refreshCredits: () => Promise<void>;
  decrementCredits: (amount: number) => void;
  addCredits: (amount: number) => void;

  // Reset store to initial state
  reset: () => void;
}

export const useCreditStore = create<CreditState>((set, get) => ({
  // Initial state (default starting balance)
  creditsRemaining: 1000,
  creditsUsed: 0,
  creditsPurchased: 0,

  // Actions
  refreshCredits: async () => {
    // TODO: Implement API call to fetch current credits
    // This will be implemented when backend API is available
    // Example implementation:
    // const response = await fetch('/api/credits');
    // const data = await response.json();
    // set({
    //   creditsRemaining: data.remaining,
    //   creditsUsed: data.used,
    //   creditsPurchased: data.purchased,
    // });
    console.log('TODO: Implement API call to fetch current credits');
  },

  decrementCredits: (amount) =>
    set((state) => ({
      creditsRemaining: Math.max(0, state.creditsRemaining - amount),
      creditsUsed: state.creditsUsed + amount,
    })),

  addCredits: (amount) =>
    set((state) => ({
      creditsRemaining: state.creditsRemaining + amount,
      creditsPurchased: state.creditsPurchased + amount,
    })),

  reset: () =>
    set({
      creditsRemaining: 1000,
      creditsUsed: 0,
      creditsPurchased: 0,
    }),
}));
