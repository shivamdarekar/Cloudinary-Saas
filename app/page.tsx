import { redirect } from "next/navigation";

export default function Page() {
  // Redirect root `/` to the actual home page at `/home`.
  // Adjust the path if your home page lives at a different route.
  redirect("/home");
  return null;
}
