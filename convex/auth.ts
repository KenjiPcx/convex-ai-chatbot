import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password({ id: "password" })],
});

export { auth as middleware } from "@convex-dev/auth/server";