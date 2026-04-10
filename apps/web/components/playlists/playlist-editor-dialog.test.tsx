"use client";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlaylistEditorDialog } from "./playlist-editor-dialog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PlaylistEditorDialog", () => {
  it("shows validation feedback when the title is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <PlaylistEditorDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        mode="create"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create playlist" }));

    expect(await screen.findByText("Add a playlist title.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("normalizes submitted playlist metadata and preserves visibility", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <PlaylistEditorDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        mode="edit"
        initialValues={{
          title: "  Night Drive  ",
          description: "  Late hour selections  ",
          visibility: "private",
        }}
      />,
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "  Night Drive Reprise  ");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "  Curated after-hours set  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Night Drive Reprise",
      description: "Curated after-hours set",
      visibility: "private",
    });
  });
});
