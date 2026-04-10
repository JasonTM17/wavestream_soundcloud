"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AUDIO_MIME_TYPES,
  GENRES,
  IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  TrackPrivacy,
  TrackStatus,
} from "@wavestream/shared";
import { AudioLines, ImagePlus, Info, Music4, UploadCloud } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDuration, type CreateTrackInput, type GenreSummary, type TrackSummary, type UpdateTrackInput } from "@/lib/wavestream-api";

const NONE_VALUE = "__none";

const trackFormSchema = z.object({
  title: z.string().trim().min(2, "Add a track title.").max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .max(4000, "Description is too long.")
    .optional()
    .or(z.literal("")),
  genre: z.string().optional(),
  tagsInput: z.string().max(240, "Keep tags concise.").optional().or(z.literal("")),
  privacy: z.nativeEnum(TrackPrivacy),
  status: z.nativeEnum(TrackStatus),
  allowDownloads: z.boolean(),
  commentsEnabled: z.boolean(),
});

type TrackFormValues = z.infer<typeof trackFormSchema>;

type CreateTrackFormProps = {
  mode: "create";
  genres?: GenreSummary[];
  initialTrack?: TrackSummary | null;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: CreateTrackInput) => Promise<void>;
};

type EditTrackFormProps = {
  mode: "edit";
  genres?: GenreSummary[];
  initialTrack?: TrackSummary | null;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: UpdateTrackInput) => Promise<void>;
};

type TrackFormProps = CreateTrackFormProps | EditTrackFormProps;

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
};

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeTags = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const isSupportedAudioFile = (file: File) => AUDIO_MIME_TYPES.includes(file.type as (typeof AUDIO_MIME_TYPES)[number]);
const isSupportedImageFile = (file: File) => IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number]);

const getDefaultValues = (track?: TrackSummary | null): TrackFormValues => ({
  title: track?.title ?? "",
  description: track?.description ?? "",
  genre: track?.genre?.name ?? "",
  tagsInput: track?.tags?.map((tag) => tag.name).join(", ") ?? "",
  privacy: (track?.privacy as TrackPrivacy | undefined) ?? TrackPrivacy.PUBLIC,
  status: (track?.status as TrackStatus | undefined) ?? TrackStatus.PUBLISHED,
  allowDownloads: track?.allowDownloads ?? false,
  commentsEnabled: track?.commentsEnabled ?? true,
});

function FileSummary({
  icon,
  label,
  hint,
  className,
  children,
}: React.PropsWithChildren<{
  icon: React.ReactNode;
  label: string;
  hint: string;
  className?: string;
}>) {
  return (
    <div className={cn("rounded-[1.75rem] border border-border/70 bg-background/70 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function TrackForm({
  mode,
  genres = [],
  initialTrack,
  isPending = false,
  onCancel,
  onSubmit,
}: TrackFormProps) {
  const form = useForm<TrackFormValues>({
    resolver: zodResolver(trackFormSchema),
    defaultValues: getDefaultValues(initialTrack),
  });
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [coverError, setCoverError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = React.useState<number | null>(null);
  const [audioInputKey, setAudioInputKey] = React.useState(0);
  const [coverInputKey, setCoverInputKey] = React.useState(0);
  const audioInputRef = React.useRef<HTMLInputElement | null>(null);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    form.reset(getDefaultValues(initialTrack));
    setSubmitError(null);
  }, [form, initialTrack]);

  React.useEffect(() => {
    if (!audioFile) {
      setAudioDurationSeconds(null);
      return;
    }

    const objectUrl = URL.createObjectURL(audioFile);
    const audio = document.createElement("audio");
    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
      setAudioDurationSeconds(duration);
    };
    const handleError = () => {
      setAudioDurationSeconds(null);
    };

    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    audio.src = objectUrl;

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioFile]);

  const coverPreviewUrl = React.useMemo(() => {
    if (!coverImage) {
      return mode === "edit" ? initialTrack?.coverUrl ?? null : null;
    }

    return URL.createObjectURL(coverImage);
  }, [coverImage, initialTrack?.coverUrl, mode]);

  React.useEffect(() => {
    return () => {
      if (coverPreviewUrl && coverImage) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverImage, coverPreviewUrl]);

  const genreOptions = (() => {
    const values = new Set<string>([...GENRES, ...genres.map((genre) => genre.name)]);
    if (initialTrack?.genre?.name) {
      values.add(initialTrack.genre.name);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  })();

  const validateAudioFile = React.useCallback((file: File | null) => {
    if (!file) {
      return "Audio file is required";
    }

    if (!isSupportedAudioFile(file)) {
      return "Unsupported audio format";
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return "Audio file exceeds the allowed size";
    }

    return null;
  }, []);

  const validateCoverFile = React.useCallback((file: File | null) => {
    if (!file) {
      return null;
    }

    if (!isSupportedImageFile(file)) {
      return "Unsupported image format";
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return "Image exceeds the allowed size";
    }

    return null;
  }, []);

  const handleAudioSelection = (file: File | null) => {
    setAudioFile(file);
    setAudioError(validateAudioFile(file));
  };

  const handleCoverSelection = (file: File | null) => {
    setCoverImage(file);
    setCoverError(validateCoverFile(file));
  };

  const resetCreateState = () => {
    form.reset(getDefaultValues());
    setAudioFile(null);
    setCoverImage(null);
    setAudioError(null);
    setCoverError(null);
    setSubmitError(null);
    setAudioDurationSeconds(null);
    setAudioInputKey((value) => value + 1);
    setCoverInputKey((value) => value + 1);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    const description = normalizeOptionalText(values.description);
    const genre = normalizeOptionalText(values.genre);
    const tags = normalizeTags(values.tagsInput);

    try {
      if (mode === "create") {
        const audioValidationError = validateAudioFile(audioFile);
        const coverValidationError = validateCoverFile(coverImage);

        setAudioError(audioValidationError);
        setCoverError(coverValidationError);

        if (audioValidationError || coverValidationError || !audioFile) {
          return;
        }

        await onSubmit({
          audioFile,
          coverImage,
          title: values.title.trim(),
          description,
          genre,
          tags,
          privacy: values.privacy,
          status: values.status,
          allowDownloads: values.allowDownloads,
          commentsEnabled: values.commentsEnabled,
        });
        resetCreateState();
        return;
      }

      await onSubmit({
        title: values.title.trim(),
        description,
        genre,
        tags,
        privacy: values.privacy,
        status: values.status,
        allowDownloads: values.allowDownloads,
        commentsEnabled: values.commentsEnabled,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-track-title`}>Title</Label>
          <Input id={`${mode}-track-title`} placeholder="Track title" {...form.register("title")} />
          {form.formState.errors.title ? (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-genre`}>Genre</Label>
          <Controller
            control={form.control}
            name="genre"
            render={({ field }) => (
              <Select
                value={field.value?.trim() ? field.value : NONE_VALUE}
                onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
              >
                <SelectTrigger id={`${mode}-genre`}>
                  <SelectValue placeholder="Choose a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No genre</SelectItem>
                  {genreOptions.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.genre ? (
            <p className="text-sm text-destructive">{form.formState.errors.genre.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-description`}>Description</Label>
        <Textarea
          id={`${mode}-description`}
          placeholder="Describe the track, collaborators, and release notes."
          className="min-h-32 rounded-[1.75rem]"
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-tags`}>Tags</Label>
          <Input
            id={`${mode}-tags`}
            placeholder="night-drive, synth, demo"
            {...form.register("tagsInput")}
          />
          <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
          {form.formState.errors.tagsInput ? (
            <p className="text-sm text-destructive">{form.formState.errors.tagsInput.message}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-privacy`}>Privacy</Label>
            <Controller
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value as TrackPrivacy)}>
                  <SelectTrigger id={`${mode}-privacy`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TrackPrivacy.PUBLIC}>Public</SelectItem>
                    <SelectItem value={TrackPrivacy.UNLISTED}>Unlisted</SelectItem>
                    <SelectItem value={TrackPrivacy.PRIVATE}>Private</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-status`}>Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value as TrackStatus)}>
                  <SelectTrigger id={`${mode}-status`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TrackStatus.PUBLISHED}>Published</SelectItem>
                    <SelectItem value={TrackStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={TrackStatus.HIDDEN}>Hidden</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border/70 bg-background/70">
          <CardContent className="p-4">
            <Label className="flex items-center justify-between gap-3">
              <span className="space-y-1">
                <span className="block font-medium">Allow downloads</span>
                <span className="block text-sm font-normal text-muted-foreground">
                  Give listeners a direct download option when the track is public.
                </span>
              </span>
              <Controller
                control={form.control}
                name="allowDownloads"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </Label>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/70 bg-background/70">
          <CardContent className="p-4">
            <Label className="flex items-center justify-between gap-3">
              <span className="space-y-1">
                <span className="block font-medium">Comments enabled</span>
                <span className="block text-sm font-normal text-muted-foreground">
                  Keep timestamped feedback open or lock comments for a private preview.
                </span>
              </span>
              <Controller
                control={form.control}
                name="commentsEnabled"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </Label>
          </CardContent>
        </Card>
      </div>

      {mode === "create" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <FileSummary
            icon={<Music4 className="h-5 w-5" />}
            label="Audio file"
            hint={`Accepted: ${AUDIO_MIME_TYPES.join(", ")}. Max ${Math.round(MAX_AUDIO_SIZE_BYTES / (1024 * 1024))} MB.`}
          >
            <input
              key={audioInputKey}
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.webm,audio/*"
              className="sr-only"
              onChange={(event) => handleAudioSelection(event.target.files?.[0] ?? null)}
            />
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => audioInputRef.current?.click()}
                disabled={isPending}
              >
                <UploadCloud className="h-4 w-4" />
                {audioFile ? "Replace audio file" : "Choose audio file"}
              </Button>
              {audioFile ? (
                <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {audioFile.type || "Unknown format"} | {formatFileSize(audioFile.size)}
                        {audioDurationSeconds ? ` | ${formatDuration(audioDurationSeconds)}` : ""}
                      </p>
                    </div>
                    <Badge variant="soft">
                      <AudioLines className="h-3.5 w-3.5" />
                      Audio ready
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick the master or demo audio file that should be streamed.
                </p>
              )}
              {audioError ? <p className="text-sm text-destructive">{audioError}</p> : null}
            </div>
          </FileSummary>

          <FileSummary
            icon={<ImagePlus className="h-5 w-5" />}
            label="Cover image"
            hint={`Accepted: ${IMAGE_MIME_TYPES.join(", ")}. Max ${Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024))} MB.`}
          >
            <input
              key={coverInputKey}
              ref={coverInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/*"
              className="sr-only"
              onChange={(event) => handleCoverSelection(event.target.files?.[0] ?? null)}
            />
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => coverInputRef.current?.click()}
                disabled={isPending}
              >
                <ImagePlus className="h-4 w-4" />
                {coverImage ? "Replace cover art" : "Choose cover art"}
              </Button>
              {coverPreviewUrl ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80">
                  <div
                    className="aspect-[4/3] w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${coverPreviewUrl})` }}
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{coverImage?.name ?? "Cover preview"}</p>
                      <p className="text-xs text-muted-foreground">
                        {coverImage ? `${coverImage.type || "Unknown format"} | ${formatFileSize(coverImage.size)}` : "Using selected artwork"}
                      </p>
                    </div>
                    <Badge variant="soft">Artwork</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Optional, but a strong cover makes the track feel ready to ship.
                </p>
              )}
              {coverError ? <p className="text-sm text-destructive">{coverError}</p> : null}
            </div>
          </FileSummary>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Editing metadata only</p>
              <p className="text-sm text-muted-foreground">
                This flow updates title, description, tags, privacy, publishing state, and listener settings without changing the original uploaded media.
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError ? (
        <div className="rounded-[1.5rem] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (mode === "create" ? "Uploading..." : "Saving...") : mode === "create" ? "Publish track" : "Save changes"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="soft">{mode === "create" ? "Multipart upload" : "Metadata patch"}</Badge>
          <span>
            {mode === "create"
              ? "Audio streams through the existing track API once the upload completes."
              : "Changes refresh your uploads, analytics, and discovery surfaces after save."}
          </span>
        </div>
      </div>
    </form>
  );
}
