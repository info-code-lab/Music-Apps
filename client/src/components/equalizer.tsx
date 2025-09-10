import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Music,
  Sliders,
  Settings
} from "lucide-react";

interface EqualizerBand {
  frequency: number;
  gain: number;
  label: string;
}

interface EqualizerProps {
  audioElement?: HTMLAudioElement | null;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 60, gain: 0, label: "Bass" },
  { frequency: 170, gain: 0, label: "Low Mid" },
  { frequency: 310, gain: 0, label: "Mid" },
  { frequency: 600, gain: 0, label: "High Mid" },
  { frequency: 1000, gain: 0, label: "Presence" },
  { frequency: 3000, gain: 0, label: "Vocal" },
  { frequency: 6000, gain: 0, label: "Clarity" },
  { frequency: 12000, gain: 0, label: "Treble" },
  { frequency: 14000, gain: 0, label: "Air" },
  { frequency: 16000, gain: 0, label: "Sparkle" }
];

const PRESETS = {
  flat: { name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock: { name: "Rock", gains: [4, 2, -1, -1, -1, 1, 3, 4, 4, 4] },
  pop: { name: "Pop", gains: [-1, 2, 3, 3, 1, -1, -1, -1, 1, 2] },
  jazz: { name: "Jazz", gains: [2, 1, 1, 1, -1, -1, 0, 1, 2, 3] },
  classical: { name: "Classical", gains: [3, 2, -1, -1, -1, -1, -1, 1, 2, 3] },
  electronic: { name: "Electronic", gains: [3, 2, 0, -1, -1, 0, 1, 2, 3, 4] },
  vocal: { name: "Vocal Boost", gains: [-2, -1, 1, 3, 4, 4, 3, 1, -1, -2] },
  bass: { name: "Bass Boost", gains: [6, 4, 2, 1, 0, 0, 0, 0, 0, 0] },
  treble: { name: "Treble Boost", gains: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6] }
};

export default function Equalizer({ audioElement, isEnabled, onToggle, className = "" }: EqualizerProps) {
  const [bands, setBands] = useState<EqualizerBand[]>(DEFAULT_BANDS);
  const [selectedPreset, setSelectedPreset] = useState<string>("flat");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioElement || !isEnabled) return;

    const initializeAudio = async () => {
      try {
        // Create AudioContext if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        
        // Resume context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create source if it doesn't exist
        if (!sourceRef.current) {
          sourceRef.current = audioContext.createMediaElementSource(audioElement);
        }

        // Create gain node for overall volume control
        if (!gainNodeRef.current) {
          gainNodeRef.current = audioContext.createGain();
          gainNodeRef.current.gain.value = 1.0;
        }

        // Create equalizer filters
        if (filtersRef.current.length === 0) {
          filtersRef.current = bands.map((band, index) => {
            const filter = audioContext.createBiquadFilter();
            
            if (index === 0) {
              // First band - Low shelf
              filter.type = 'lowshelf';
            } else if (index === bands.length - 1) {
              // Last band - High shelf
              filter.type = 'highshelf';
            } else {
              // Middle bands - Peaking
              filter.type = 'peaking';
              filter.Q.value = 1;
            }
            
            filter.frequency.value = band.frequency;
            filter.gain.value = band.gain;
            
            return filter;
          });
        }

        // Connect the audio graph only if not already connected
        if (!isConnectedRef.current) {
          let currentNode: AudioNode = sourceRef.current;
          
          // Connect filters in series
          filtersRef.current.forEach(filter => {
            currentNode.connect(filter);
            currentNode = filter;
          });
          
          // Connect to gain node and then to destination
          currentNode.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContext.destination);
          
          isConnectedRef.current = true;
        }

      } catch (error) {
        console.error('Failed to initialize equalizer:', error);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup on unmount or when audio element changes
      if (isConnectedRef.current && sourceRef.current) {
        try {
          sourceRef.current.disconnect();
          filtersRef.current.forEach(filter => filter.disconnect());
          if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
          }
        } catch (error) {
          console.error('Error disconnecting audio nodes:', error);
        }
        isConnectedRef.current = false;
      }
    };
  }, [audioElement, isEnabled, bands]);

  // Update filter gains when bands change
  useEffect(() => {
    if (filtersRef.current.length > 0) {
      bands.forEach((band, index) => {
        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = band.gain;
        }
      });
    }
  }, [bands]);

  const updateBandGain = (index: number, gain: number) => {
    const newBands = [...bands];
    newBands[index] = { ...newBands[index], gain };
    setBands(newBands);
    setSelectedPreset("custom");
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      const newBands = bands.map((band, index) => ({
        ...band,
        gain: preset.gains[index] || 0
      }));
      setBands(newBands);
      setSelectedPreset(presetKey);
    }
  };

  const resetEqualizer = () => {
    applyPreset("flat");
  };

  const toggleEqualizer = () => {
    onToggle(!isEnabled);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={`gap-2 ${className}`}
        data-testid="button-expand-equalizer"
      >
        <Sliders className="h-4 w-4" />
        EQ
        {isEnabled && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">ON</Badge>}
      </Button>
    );
  }

  return (
    <Card className={`w-full max-w-4xl ${className}`} data-testid="card-equalizer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Equalizer
            {isEnabled && <Badge variant="default">Enabled</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetEqualizer}
              data-testid="button-reset-equalizer"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant={isEnabled ? "default" : "secondary"}
              size="sm"
              onClick={toggleEqualizer}
              data-testid="button-toggle-equalizer"
            >
              {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              data-testid="button-collapse-equalizer"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Presets</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedPreset === key ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(key)}
                className="text-xs"
                data-testid={`button-preset-${key}`}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Frequency Bands */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Frequency Bands</label>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {bands.map((band, index) => (
              <div key={band.frequency} className="flex flex-col items-center space-y-2">
                <div className="text-xs font-medium text-center">
                  {band.label}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {band.frequency < 1000 ? `${band.frequency}Hz` : `${(band.frequency / 1000).toFixed(1)}kHz`}
                </div>
                <div className="h-32 flex items-center">
                  <Slider
                    value={[band.gain]}
                    onValueChange={([value]) => updateBandGain(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    orientation="vertical"
                    className="h-24"
                    disabled={!isEnabled}
                    data-testid={`slider-band-${index}`}
                  />
                </div>
                <div className="text-xs text-center font-mono w-12">
                  {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bass Boost</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset("bass")}
              className="w-full"
              data-testid="button-bass-boost"
            >
              Boost Bass
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vocal Enhancement</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset("vocal")}
              className="w-full"
              data-testid="button-vocal-boost"
            >
              Enhance Vocals
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Treble Boost</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset("treble")}
              className="w-full"
              data-testid="button-treble-boost"
            >
              Boost Treble
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}