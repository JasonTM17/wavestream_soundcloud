'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileMusic, Lock, Sparkles } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type PlaylistVisibility = 'public' | 'private';

export type PlaylistEditorValues = {
  title: string;
  description: string;
  visibility: PlaylistVisibility;
};

const playlistEditorSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Add a playlist title.')
    .max(120, 'Keep the title under 120 characters.'),
  description: z
    .string()
    .max(2000, 'Keep the description under 2,000 characters.')
    .optional()
    .or(z.literal('')),
  visibility: z.enum(['public', 'private']),
});

type PlaylistEditorFormValues = z.infer<typeof playlistEditorSchema>;

export type PlaylistEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  dialogTitle?: string;
  dialogDescription?: string;
  initialValues?: Partial<PlaylistEditorValues>;
  isPending?: boolean;
  showVisibility?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: PlaylistEditorValues) => Promise<void> | void;
};

const getDefaultValues = (
  initialValues?: Partial<PlaylistEditorValues>,
): PlaylistEditorFormValues => ({
  title: initialValues?.title ?? '',
  description: initialValues?.description ?? '',
  visibility: initialValues?.visibility ?? 'public',
});

export function PlaylistEditorDialog({
  open,
  onOpenChange,
  mode = 'create',
  dialogTitle,
  dialogDescription,
  initialValues,
  isPending = false,
  showVisibility = true,
  submitLabel,
  cancelLabel = 'Cancel',
  onSubmit,
}: PlaylistEditorDialogProps) {
  const form = useForm<PlaylistEditorFormValues>({
    resolver: zodResolver(playlistEditorSchema),
    defaultValues: getDefaultValues(initialValues),
  });
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(initialValues));
    }
  }, [form, initialValues, open]);

  const normalizedSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() ?? '',
      visibility: values.visibility,
    });
  });

  const heading = dialogTitle ?? (mode === 'create' ? 'Create playlist' : 'Edit playlist');
  const bodyCopy =
    dialogDescription ??
    (mode === 'create'
      ? 'Create a curated collection for your tracks, queue, and listener handoff.'
      : 'Update the playlist metadata without changing its track order or listeners.');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,40rem)]">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {mode === 'create' ? (
              <FileMusic className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>{bodyCopy}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={normalizedSubmit}>
          <div className="space-y-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              placeholder="Night Drive Sessions"
              autoComplete="off"
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              placeholder="A late-night playlist for the long road home."
              className="min-h-28 rounded-md"
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          {showVisibility ? (
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Controller
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as PlaylistVisibility)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Public playlists appear in discovery and profile surfaces. Private playlists stay
                inside the signed-in account.
              </p>
            </div>
          ) : null}

          <div className="rounded-md bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Owner-safe metadata edits</p>
                <p className="text-sm text-muted-foreground">
                  This dialog is designed for playlist titles, descriptions, and visibility only.
                  Track ordering and membership stay outside this form on purpose.
                </p>
              </div>
            </div>
            <Badge variant="soft" className="mt-4">
              {mode === 'create' ? 'New playlist' : 'Metadata edit'}
            </Badge>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : (submitLabel ?? (mode === 'create' ? 'Create playlist' : 'Save changes'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
