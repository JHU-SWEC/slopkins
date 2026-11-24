"use client";

import { useEffect } from "react";
import { markActivitySeen } from "./actions";

// Once the Activity page is on screen, remember that you've seen it.
// (This page keeps its "New" highlights until you come back next time.)
export function MarkActivitySeen() {
  useEffect(() => {
    void markActivitySeen();
  }, []);
  return null;
}
