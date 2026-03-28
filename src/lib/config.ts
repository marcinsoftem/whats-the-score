/**
 * Global Application Configuration.
 * Central place to manage app settings, third-party endpoints, and generation parameters.
 */
export const APP_CONFIG = {
  avatars: {
    // Base endpoint for DiceBear avatars
    endpoint: "https://api.dicebear.com/9.x/personas/svg",
    
    // Helper function to generate avatar URLs consistently
    generateUrl: (seed: string) => {
      // You can add additional query parameters here in the future
      return `${APP_CONFIG.avatars.endpoint}?seed=${encodeURIComponent(seed)}`;
    }
  },
  author: {
    // Unique identifier for the author's profile in the database
    profileId: "a4958742-3316-406a-870c-9ff53cb3bfb1",
    email: "marcin@softem.pl"
  }
};
