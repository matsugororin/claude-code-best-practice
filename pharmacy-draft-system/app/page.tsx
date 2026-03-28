import { redirect } from "next/navigation";

// Root redirects to the main generate page
export default function Home() {
  redirect("/generate");
}
