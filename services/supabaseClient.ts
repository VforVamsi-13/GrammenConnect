
/**
 * Supabase client is no longer in use.
 * The application has transitioned to local persistence (localStorage) for user sessions and mandi items.
 */
export const supabase = {
  auth: {
    // Mock for compatibility if needed, though strictly not used by the updated App.tsx
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {},
  }
};
