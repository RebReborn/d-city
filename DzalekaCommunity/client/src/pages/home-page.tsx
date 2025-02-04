import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryCard } from "@/components/story-card";
import { CreateStoryDialog } from "@/components/create-story-dialog";
import { useState } from "react";
import type { SelectStory } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: stories, isLoading } = useQuery<SelectStory[]>({ 
    queryKey: ["/api/stories"]
  });

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Community Stories</h1>
          <p className="text-muted-foreground">
            Share and connect with stories from the Dzaleka community
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          Share Your Story
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-8 pb-8">
            {stories?.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </ScrollArea>
      )}

      <CreateStoryDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
