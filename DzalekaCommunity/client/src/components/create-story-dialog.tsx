import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImagePlus, Loader2 } from "lucide-react";
import type { InsertStory } from "@db/schema";

export function CreateStoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<InsertStory>({
    defaultValues: {
      userId: user!.id,
      images: [],
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: InsertStory) => {
      await apiRequest("POST", "/api/stories", { ...data, images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      form.reset();
      setImages([]);
      onOpenChange(false);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", files[0]);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      setImages([...images, url]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Story</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createStoryMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What's on your mind?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {images.length > 0 && (
              <div className="grid gap-4">
                {images.map((image, i) => (
                  <img
                    key={i}
                    src={image}
                    alt="Uploaded content"
                    className="rounded-lg max-h-48 w-full object-cover"
                  />
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </Button>

              <Button
                type="submit"
                disabled={createStoryMutation.isPending}
              >
                {createStoryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Post
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
