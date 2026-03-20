import { redirect } from "next/navigation";

interface WelcomePageProps {
  searchParams?: {
    claim?: string;
    ref?: string;
  };
}

export default function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = new URLSearchParams();

  if (searchParams?.claim) {
    params.set("claim", searchParams.claim);
  }

  if (searchParams?.ref) {
    params.set("ref", searchParams.ref);
  }

  const destination = params.toString() ? `/onboarding?${params.toString()}` : "/onboarding";
  redirect(destination);
}
