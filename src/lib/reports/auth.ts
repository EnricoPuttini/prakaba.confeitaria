import "server-only";
import { requireCurrentProfile, type CurrentProfile } from "@/lib/auth/current-profile";

const REPORT_ROLES = ["OWNER", "MANAGER", "FINANCE"] as const;

export async function getReportProfile(): Promise<CurrentProfile | null> {
  const profile = await requireCurrentProfile();
  return REPORT_ROLES.includes(profile.role as (typeof REPORT_ROLES)[number]) ? profile : null;
}
