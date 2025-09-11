import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Languages, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

export default function OnboardingLanguage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [, setLocation] = useLocation();
  const { updateProfile, updateProfileMutation } = useAuth();

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        // Don't allow removing all languages
        if (prev.length === 1) {
          toast.error("Please select at least one language");
          return prev;
        }
        return prev.filter(code => code !== languageCode);
      } else {
        return [...prev, languageCode];
      }
    });
  };

  const handleContinue = async () => {
    try {
      await updateProfile({
        preferredLanguages: selectedLanguages,
      });
      
      toast.success("Languages saved successfully!");
      setLocation("/onboarding/artists");
    } catch (error: any) {
      toast.error(error.message || "Failed to save languages");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-black/20 backdrop-blur-md border-white/10">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Languages className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Choose Your Languages
          </CardTitle>
          <p className="text-gray-300 text-lg">
            Select the languages you'd like to discover music in
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {AVAILABLE_LANGUAGES.map((language) => (
              <Button
                key={language.code}
                variant={selectedLanguages.includes(language.code) ? "default" : "outline"}
                className={`h-16 flex-col gap-1 transition-all duration-200 ${
                  selectedLanguages.includes(language.code)
                    ? "bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
                    : "bg-white/5 hover:bg-white/10 border-white/20 text-gray-300 hover:text-white"
                }`}
                onClick={() => handleLanguageToggle(language.code)}
                data-testid={`language-option-${language.code}`}
              >
                <span className="text-2xl">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <span className="text-gray-300 font-medium">Selected:</span>
            {selectedLanguages.map((code) => {
              const language = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
              return (
                <Badge
                  key={code}
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-300 border-purple-400/30"
                  data-testid={`selected-language-${code}`}
                >
                  {language?.flag} {language?.name}
                </Badge>
              );
            })}
          </div>

          <div className="flex justify-end pt-6">
            <Button
              onClick={handleContinue}
              disabled={selectedLanguages.length === 0 || updateProfileMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 flex items-center gap-2"
              data-testid="button-continue"
            >
              {updateProfileMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400 pt-2">
            Step 1 of 2 - Next: Choose your favorite artists
          </div>
        </CardContent>
      </Card>
    </div>
  );
}