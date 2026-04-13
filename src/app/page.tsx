import { redirect } from "next/navigation";

/**
 * Root redirect — point visitors to the install flow.
 */
export default function RootPage() {
  redirect("/install");
}
