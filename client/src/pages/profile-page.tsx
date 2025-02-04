import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoryCard } from "@/components/story-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PenSquare } from "lucide-react";
import type { SelectUser, SelectStory } from "@db/schema";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  const { data: profile, isLoading: loadingProfile } = useQuery<SelectUser>({
    queryKey: [`/api/users/${id}`]
  });

  const { data: stories, isLoading: loadingStories } = useQuery<SelectStory[]>({
    queryKey: [`/api/users/${id}/stories`]
  });

  if (loadingProfile || loadingStories) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container py-8">
      <Card>
        <CardHeader className="relative">
          <div className="absolute top-4 right-4">
            {currentUser?.id === parseInt(id) && (
              <Button variant="outline" size="sm">
                <PenSquare className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName || profile.username} />
              <AvatarFallback>
                {(profile.displayName || profile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
              {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stories">
            <TabsList>
              <TabsTrigger value="stories">Stories</TabsTrigger>
            </TabsList>
            <TabsContent value="stories">
              <div className="space-y-8 mt-6">
                {stories?.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
