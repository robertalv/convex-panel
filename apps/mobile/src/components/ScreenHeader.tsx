/**
 * Screen Header Component
 *
 * Simple header for Account, Subscription screens
 * Uses the universal AppHeader component for consistency
 */

import React from "react";
import { useSheet } from "../contexts/SheetContext";
import { AppHeader } from "./AppHeader";

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const { openSheet } = useSheet();

  const handleOpenMenuSheet = () => openSheet("menu");

  return (
    <AppHeader
      title={title}
      actions={[
        {
          icon: "more-vertical",
          onPress: handleOpenMenuSheet,
        },
      ]}
    />
  );
}
