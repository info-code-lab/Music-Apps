import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Search, ArrowRight, Music } from "lucide-react";
import toast from "react-hot-toast";
import type { Artist } from "@shared/schema";

export default function OnboardingArtists() {
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { updateProfile, updateProfileMutation } = useAuth();

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Artist[]>({
    queryKey: ["/api/artists/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const displayArtists = searchQuery ? searchResults : artists;

  const handleArtistToggle = (artistId: string) => {
    setSelectedArtists(prev => {
      if (prev.includes(artistId)) {
        return prev.filter(id => id !== artistId);
      } else {
        return [...prev, artistId];
      }
    });
  };

  const handleFinishOnboarding = async () => {
    try {
      // Save preferred artists first
      if (selectedArtists.length > 0) {
        for (const artistId of selectedArtists) {
          await apiRequest("/api/user/preferred-artists", "POST", { artistId });
        }
      }

      // Mark onboarding as completed
      await updateProfile({
        onboardingCompleted: true,
      });
      
      toast.success("Welcome to Harmony! Your preferences have been saved.");
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    }
  };

  const selectedArtistObjects = displayArtists.filter(artist => 
    selectedArtists.includes(artist.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl bg-black/20 backdrop-blur-md border-white/10">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Choose Your Favorite Artists
          </CardTitle>
          <p className="text-gray-300 text-lg">
            Select artists you love to personalize your music experience
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              data-testid="input-search-artists"
            />
          </div>

          {/* Artists Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/10 rounded-lg animate-pulse"
                />
              ))
            ) : displayArtists.length > 0 ? (
              displayArtists.map((artist) => (
                <Button
                  key={artist.id}
                  variant={selectedArtists.includes(artist.id) ? "default" : "outline"}
                  className={`aspect-square flex-col gap-2 p-4 transition-all duration-200 ${
                    selectedArtists.includes(artist.id)
                      ? "bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
                      : "bg-white/5 hover:bg-white/10 border-white/20 text-gray-300 hover:text-white"
                  }`}
                  onClick={() => handleArtistToggle(artist.id)}
                  data-testid={`artist-option-${artist.id}`}
                >
                  {artist.profilePic ? (
                    <img
                      src={artist.profilePic}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Music className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-center line-clamp-2">
                    {artist.name}
                  </span>
                  {selectedArtists.includes(artist.id) && (
                    <Heart className="w-4 h-4 text-white absolute top-2 right-2 fill-current" />
                  )}
                </Button>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                {searchQuery ? "No artists found" : "No artists available"}
              </div>
            )}
          </div>

          {/* Selected Artists */}
          {selectedArtists.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 pt-4">
                <span className="text-gray-300 font-medium">Selected Artists:</span>
                {selectedArtistObjects.map((artist) => (
                  <Badge
                    key={artist.id}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30"
                    data-testid={`selected-artist-${artist.id}`}
                  >
                    {artist.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            <Button
              variant="outline"
              onClick={() => setLocation("/onboarding/language")}
              className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
              data-testid="button-back"
            >
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleFinishOnboarding}
                disabled={updateProfileMutation.isPending}
                className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
                data-testid="button-skip"
              >
                Skip for Now
              </Button>
              
              <Button
                onClick={handleFinishOnboarding}
                disabled={updateProfileMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 flex items-center gap-2"
                data-testid="button-finish"
              >
                {updateProfileMutation.isPending ? (
                  "Finishing..."
                ) : (
                  <>
                    Finish Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 pt-2">
            Step 2 of 2 - You can always change these preferences later in your profile
          </div>
        </CardContent>
      </Card>
    </div>
  );
}