import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) return false;
          
          // Periksa apakah email ada di tabel donors
          const donors = await query("SELECT id FROM donors WHERE email = $1 LIMIT 1", [user.email]);
          
          if (donors && donors.length > 0) {
            // Tambahkan ID donor ke object user agar bisa disematkan ke token
            user.id = donors[0].id.toString();
            return true;
          } else {
            // Jika tidak ada, tolak login
            return "/login?error=AccessDenied";
          }
        } catch (error) {
          console.error("Error checking donor email:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.donor_id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.donor_id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
