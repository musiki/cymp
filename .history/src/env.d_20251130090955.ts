/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
} | null;

declare namespace App {
  interface Locals {
    session: Session;
  }
}
