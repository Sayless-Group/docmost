import { useState } from "react";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { Button, Divider, Stack } from "@mantine/core";
import { IconLock, IconServer } from "@tabler/icons-react";
// import { IAuthProvider } from "@/ee/security/types/security.types.ts"; // DISABLED: Security feature removed
// import { buildSsoLoginUrl } from "@/ee/security/sso.utils.ts"; // DISABLED: Security feature removed
// import { SSO_PROVIDER } from "@/ee/security/contants.ts"; // DISABLED: Security feature removed
import { GoogleIcon } from "@/components/icons/google-icon.tsx";
import { isCloud } from "@/lib/config.ts";
import { LdapLoginModal } from "@/ee/components/ldap-login-modal.tsx";

export default function SsoLogin() {
  // DISABLED: Security feature removed
  return null;
}
