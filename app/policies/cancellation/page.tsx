import { permanentRedirect } from "next/navigation";
export default function CancellationPolicyRedirect() {
  permanentRedirect("/policies/terms");
}
