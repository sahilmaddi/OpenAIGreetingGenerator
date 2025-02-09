import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, occasions } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { backgrounds } from "@/lib/backgrounds";
import { CardPreview } from "@/components/card-preview";
import { DecorationsPicker } from "@/components/decorations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

// Add RequiredLabel component
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      {children}
      <span className="text-red-500">*</span>
    </span>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [selectedBackground, setSelectedBackground] = useState<string>(backgrounds[0].url);
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(insertCardSchema),
    defaultValues: {
      occasion: "Birthday",
      recipientName: "",
      senderName: "",
      date: new Date().toISOString().split("T")[0],
      message: "",
      backgroundUrl: selectedBackground,
      decorations: [],
      additionalContext: "",
    },
  });

  const createCard = useMutation({
    mutationFn: async (values: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/cards", {
        ...values(),
        backgroundUrl: selectedBackground,
        decorations: selectedDecorations,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMessage = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      if (!values.recipientName || !values.senderName) {
        throw new Error("Please fill in both recipient and sender names before generating a message");
      }

      // Add retries for rate limits
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await apiRequest("POST", "/api/generate-message", {
            occasion: values.occasion,
            recipientName: values.recipientName,
            senderName: values.senderName,
            additionalContext: values.additionalContext,
          });

          if (!res.ok && res.status === 429) {
            // If we've used all retries, throw the error
            if (attempt === 3) {
              const data = await res.json();
              throw new Error(data.message || "Too many requests, please try again later");
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }

          return res.json();
        } catch (error: any) {
          if (attempt === 3) throw error;
          // If it's not a rate limit error, throw immediately
          if (!error.message?.includes('Too many requests')) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      throw new Error("Failed to generate message after retries");
    },
    onSuccess: (data) => {
      form.setValue("message", data.message);
      toast({
        title: "Success",
        description: "Message generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Message Generation Failed",
        description: error.message.includes("too many requests")
          ? "The AI service is currently busy. A fallback message has been generated for you. Feel free to edit it!"
          : error.message,
        variant: error.message.includes("too many requests") ? "default" : "destructive",
      });
    },
  });

  const onGenerateMessage = () => {
    const values = form.getValues();
    if (!values.recipientName || !values.senderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in both recipient and sender names before generating a message",
        variant: "destructive",
      });
      return;
    }
    generateMessage.mutate();
  };

  const onSubmit = form.handleSubmit((data) => {
    createCard.mutate(form.getValues);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
            AI Greeting Card Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create beautiful, personalized greeting cards with AI-generated messages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="occasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><RequiredLabel>Occasion</RequiredLabel></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select occasion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {occasions.map((occasion) => (
                              <SelectItem key={occasion} value={occasion}>
                                {occasion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recipientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><RequiredLabel>To</RequiredLabel></FormLabel>
                          <FormControl>
                            <Input placeholder="Recipient's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><RequiredLabel>From</RequiredLabel></FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any specific details or context for the AI..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Tabs defaultValue="message" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="message">Message</TabsTrigger>
                      <TabsTrigger value="background">Background</TabsTrigger>
                      <TabsTrigger value="decorations">Decorations</TabsTrigger>
                    </TabsList>
                    <TabsContent value="message">
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel><RequiredLabel>Message</RequiredLabel></FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onGenerateMessage}
                                disabled={generateMessage.isPending}
                              >
                                {generateMessage.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>Generate with AI</>
                                )}
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your message or generate one with AI..."
                                className="h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="background">
                      <ScrollArea className="h-64 rounded-md border">
                        <div className="p-4 grid grid-cols-2 gap-4">
                          {backgrounds.map(({ url }, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              className={`relative aspect-video p-0 overflow-hidden ${
                                selectedBackground === url
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                              onClick={() => setSelectedBackground(url)}
                            >
                              <img
                                src={url}
                                alt={`Background ${i + 1}`}
                                className="object-cover"
                              />
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="decorations">
                      <DecorationsPicker
                        selected={selectedDecorations}
                        onChange={setSelectedDecorations}
                      />
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createCard.isPending}
                  >
                    {createCard.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Card
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <CardPreview
            card={{
              ...form.getValues(),
              backgroundUrl: selectedBackground,
              decorations: selectedDecorations,
            }}
          />
        </div>
      </div>
    </div>
  );
}