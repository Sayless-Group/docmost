import React, { useState } from "react";
import { Modal, TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { IAuthProvider } from "@/ee/security/types/security.types"; // DISABLED: Security feature removed
import APP_ROUTE from "@/lib/app-route";
// import { ldapLogin } from "@/ee/security/services/ldap-auth-service"; // DISABLED: Security feature removed

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

interface LdapLoginModalProps {
  opened: boolean;
  onClose: () => void;
  provider: any; // DISABLED: Security feature removed - was IAuthProvider
  workspaceId: string;
}

export function LdapLoginModal({
  opened,
  onClose,
  provider,
  workspaceId,
}: LdapLoginModalProps) {
  // DISABLED: Security feature removed
  return null;
}
