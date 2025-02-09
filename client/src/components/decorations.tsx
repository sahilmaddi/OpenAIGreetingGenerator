import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { decorations } from "@/lib/backgrounds";
import { Check } from "lucide-react";

interface DecorationsPickerProps {
  selected: string[];
  onChange: (urls: string[]) => void;
}

export function DecorationsPicker({ selected, onChange }: DecorationsPickerProps) {
  const toggleDecoration = (url: string) => {
    if (selected.includes(url)) {
      onChange(selected.filter((s) => s !== url));
    } else {
      onChange([...selected, url]);
    }
  };

  return (
    <ScrollArea className="h-32 rounded-md border">
      <div className="p-4 grid grid-cols-5 gap-4">
        {decorations.map(({ url }, i) => (
          <Button
            key={i}
            variant="outline"
            className="relative aspect-square p-0 overflow-hidden"
            onClick={() => toggleDecoration(url)}
          >
            <img src={url} alt={`Decoration ${i + 1}`} className="object-cover" />
            {selected.includes(url) && (
              <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
            )}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
