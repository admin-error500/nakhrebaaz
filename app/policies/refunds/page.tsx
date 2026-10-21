import { permanentRedirect } from "next/navigation";
export default function RefundPolicyRedirect() {
  permanentRedirect("/policies/returns");
}
