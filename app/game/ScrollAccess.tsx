"use client";

import { useEffect } from "react";

/**
 * The game shell can lock touch gestures at the document level. This route is
 * a reading/gallery page; restore pan gestures only while it is mounted.
 */
export default function ScrollAccess() {
  useEffect(() => {
    const roots = [document.documentElement, document.body];
    const before = roots.map((element) => ({
      value: element.style.getPropertyValue("touch-action"),
      priority: element.style.getPropertyPriority("touch-action"),
    }));
    roots.forEach((element) => element.style.setProperty("touch-action", "auto", "important"));
    return () => roots.forEach((element, index) => {
      const previous = before[index];
      if (previous.value) element.style.setProperty("touch-action", previous.value, previous.priority);
      else element.style.removeProperty("touch-action");
    });
  }, []);
  return null;
}
