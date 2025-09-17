import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface PageBackProps {
  title: string;
  fallbackPath?: string;
  className?: string;
}

export default function PageBack({ 
  title, 
  fallbackPath = "/", 
  className 
}: PageBackProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    // Try to go back in browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to specified path if no history
      navigate(fallbackPath);
    }
  };

  return (
    <div className={cn("flex items-center px-4 py-2 lg:hidden", className)}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-2 -ml-2 text-foreground hover:bg-accent" 
        onClick={handleBack}
        data-testid="button-back"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">
          {title}
        </h1>
      </div>
      <div className="w-9"></div> {/* Spacer to center the title */}
    </div>
  );
}