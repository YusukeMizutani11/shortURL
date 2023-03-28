import 'express-session';

declare module 'express-session' {
  export interface Session {
    clearSession(): Promise<void>; // DO NOT MODIFY THIS!

    // NOTES: Our example app's custom session properties:
    authenticatedUserForPro: {
      userId: string;
    };
    authenticatedUserForAdmin: {
      username: string;
    };

    isLoggedIn: boolean;
    // logInAttempts: number; not required for this project
    logInTimeout: string;
  }
}
