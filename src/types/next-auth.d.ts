import "next-auth"

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
      verificationLevel?: string
    }
  }

  interface User {
    verificationLevel?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userRole?: string
    verificationLevel?: string
  }
}
