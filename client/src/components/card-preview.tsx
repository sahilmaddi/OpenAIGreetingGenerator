import { Card as CardType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight } from "lucide-react";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CardPreviewProps {
  card: Partial<CardType>;
  className?: string;
}

export function CardPreview({ card, className = "" }: CardPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const downloadCard = async () => {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current);
    const link = document.createElement("a");
    link.download = `greeting-card-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Card Container */}
      <div 
        className="relative cursor-pointer perspective-1000"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Front Cover */}
        <div
          className={cn(
            "absolute inset-0 w-full bg-card rounded-lg shadow-lg transform-style-3d transition-transform duration-700",
            isOpen ? "rotate-y-180" : ""
          )}
          style={{
            backgroundImage: card.backgroundUrl ? `url(${card.backgroundUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            aspectRatio: "4/3",
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 p-8 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                Click to Open
              </h2>
              <ChevronRight className="h-8 w-8 text-white mx-auto mt-4 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Inside of Card */}
        <div
          ref={previewRef}
          className={cn(
            "w-full bg-white rounded-lg shadow-lg transform-style-3d transition-transform duration-700 backface-hidden",
            isOpen ? "rotate-y-0" : "rotate-y-180"
          )}
          style={{ aspectRatio: "4/3" }}
        >
          <div className="p-8 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">
                {card.recipientName ? `Dear ${card.recipientName}` : "Preview"}
              </h2>
              <p className="text-xl text-gray-700 whitespace-pre-wrap">
                {card.message || "Your message will appear here..."}
              </p>
            </div>

            {card.senderName && (
              <p className="text-xl text-gray-800">
                From, {card.senderName}
              </p>
            )}
          </div>

          {card.decorations?.map((decoration, i) => (
            <img
              key={i}
              src={decoration}
              alt="Decoration"
              className="absolute w-16 h-16 object-contain"
              style={{
                top: `${Math.random() * 70 + 10}%`,
                left: `${Math.random() * 70 + 10}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      <Button onClick={downloadCard} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download Card
      </Button>
    </div>
  );
}