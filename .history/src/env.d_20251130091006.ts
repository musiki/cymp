/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
} | null;

declare namespace App {
  interface Locals {
    session: Session;
  }
}
