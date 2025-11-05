import HomePage from "@/components/HomePage";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <SessionProvider>
      <HomePage />
    </SessionProvider>
  );
}
