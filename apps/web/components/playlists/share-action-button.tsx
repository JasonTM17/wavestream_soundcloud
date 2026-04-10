"use client";

import * as React from "react";
import { Check, Loader2, Share2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

export type ShareActionMethod = "native" | "clipboard" | "custom";

export type ShareActionButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  title?: string;
  text?: string;
  url?: string;
  shareData?: ShareData;
  clipboardText?: string;
  pendingLabel?: string;
  successLabel?: string;
  children?: React.ReactNode;
  onShare?: () => Promise<void> | void;
  onSuccess?: (method: ShareActionMethod, sharedValue?: string) => void;
  onError?: (error: Error) => void;
};

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Unable to copy link to clipboard.");
  }
}

export function ShareActionButton({
  title,
  text,
  url,
  shareData,
  clipboardText,
  pendingLabel = "Sharing...",
  successLabel = "Shared",
  children,
  onShare,
  onSuccess,
  onError,
  disabled,
  ...buttonProps
}: ShareActionButtonProps) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success">("idle");

  const handleClick = async () => {
    if (disabled || isSharing) {
      return;
    }

    setIsSharing(true);
    setStatus("idle");

    try {
      if (onShare) {
        await onShare();
        setStatus("success");
        onSuccess?.("custom");
        return;
      }

      const resolvedShareData: ShareData =
        shareData ??
        ({
          title,
          text,
          url: url ?? window.location.href,
        } satisfies ShareData);

      if (navigator.share) {
        await navigator.share(resolvedShareData);
        setStatus("success");
        onSuccess?.("native", resolvedShareData.url);
        return;
      }

      const clipboardValue =
        clipboardText ?? resolvedShareData.url ?? url ?? window.location.href;

      if (!clipboardValue) {
        throw new Error("No share target available.");
      }

      await copyTextToClipboard(clipboardValue);
      setStatus("success");
      onSuccess?.("clipboard", clipboardValue);
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error("Failed to share.");
      onError?.(nextError);
    } finally {
      setIsSharing(false);
    }
  };

  const resolvedLabel = status === "success" ? successLabel : children ?? "Share";

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isSharing}
      aria-busy={isSharing}
      onClick={handleClick}
      {...buttonProps}
    >
      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "success" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {isSharing ? pendingLabel : resolvedLabel}
    </Button>
  );
}
