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
      // example: return `${APP_CONFIG.avatars.endpoint}?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`
      return `${APP_CONFIG.avatars.endpoint}?seed=${encodeURIComponent(seed)}`;
    }
  }
};
