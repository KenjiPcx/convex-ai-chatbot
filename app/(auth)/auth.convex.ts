// New Convex Auth implementation
import { convexAuth } from "@convex-dev/auth/server";
import { api } from "../../convex/_generated/api";

export type UserType = 'guest' | 'regular';

export const { auth, signIn, signOut } = convexAuth({
  providers: [
    {
      id: "password",
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        
        // Use Convex query to authenticate user
        const user = await api.users.getUserByEmail({ email });
        
        if (!user || !user.password) {
          return null;
        }

        // Verify password (assuming we have a utility function)
        const passwordsMatch = await verifyPassword(password, user.password);
        
        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user._id,
          email: user.email,
          type: user.isGuest ? 'guest' : 'regular' as UserType,
        };
      },
    },
    {
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        // Create guest user via Convex mutation
        const guestUser = await api.users.createGuestUser();
        
        return {
          id: guestUser.id,
          email: guestUser.email,
          type: 'guest' as UserType,
        };
      },
    },
  ],
});

// Utility function to verify password (this should match the one in Convex)
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const { compareSync } = await import("bcrypt-ts");
  return compareSync(password, hashedPassword);
}