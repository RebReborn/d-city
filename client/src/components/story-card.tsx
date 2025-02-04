import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import type { SelectStory, SelectUser, SelectComment, InsertComment } from "@db/schema";

export function StoryCard({ story }: { story: SelectStory }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const { data: author } = useQuery<SelectUser>({
    queryKey: [`/api/users/${story.userId}`]
  });

  const { data: comments } = useQuery<SelectComment[]>({
    queryKey: [`/api/stories/${story.id}/comments`],
    enabled: showComments
  });

  const { data: liked } = useQuery<boolean>({
    queryKey: [`/api/stories/${story.id}/liked`]
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/stories/${story.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story.id}/liked`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (data: InsertComment) => {
      await apiRequest("POST", `/api/stories/${story.id}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story.id}/comments`] });
    }
  });

  if (!author) return null;

  return (
    <Card>
      <CardHeader className="flex-row space-x-4 space-y-0">
        <Link href={`/profile/${author.id}`}>
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={author.avatarUrl} alt={author.displayName || author.username} />
            <AvatarFallback>
              {(author.displayName || author.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${author.id}`}>
            <div className="font-semibold cursor-pointer hover:underline">
              {author.displayName || author.username}
            </div>
          </Link>
          <div className="text-sm text-muted-foreground">
            {new Date(story.createdAt!).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap mb-4">{story.content}</p>
        {story.images && story.images.length > 0 && (
          <div className="grid gap-4 mb-4">
            {story.images.map((image, i) => (
              <img 
                key={i} 
                src={image} 
                alt="Story content" 
                className="rounded-lg max-h-96 w-full object-cover"
              />
            ))}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => likeMutation.mutate()}
            className={liked ? "text-red-500" : ""}
          >
            <Heart className="mr-1 h-4 w-4" />
            {story.likes}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Comment
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            <CommentForm onSubmit={(data) => commentMutation.mutate(data)} storyId={story.id} />
            <ScrollArea className="h-48">
              {comments?.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentForm({ onSubmit, storyId }: { 
  onSubmit: (data: InsertComment) => void;
  storyId: number;
}) {
  const { user } = useAuth();
  const form = useForm<InsertComment>({
    defaultValues: {
      userId: user!.id,
      storyId
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Write a comment..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">Post</Button>
      </form>
    </Form>
  );
}

function Comment({ comment }: { comment: SelectComment }) {
  const { data: author } = useQuery<SelectUser>({
    queryKey: [`/api/users/${comment.userId}`]
  });

  if (!author) return null;

  return (
    <div className="flex space-x-2 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={author.avatarUrl} alt={author.displayName || author.username} />
        <AvatarFallback>
          {(author.displayName || author.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-semibold">
          {author.displayName || author.username}
        </div>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
      </div>
    </div>
  );
}
