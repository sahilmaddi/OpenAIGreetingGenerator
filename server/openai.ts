import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add fallback message generation
function generateFallbackMessage(params: {
  occasion: string;
  recipientName: string;
  senderName: string;
}): string {
  const templates = {
    Birthday: `Dear ${params.recipientName}, wishing you a wonderful birthday filled with joy and laughter! Have an amazing celebration. From, ${params.senderName}`,
    Wedding: `Dear ${params.recipientName}, congratulations on your special day! Wishing you a lifetime of love and happiness together. From, ${params.senderName}`,
    Anniversary: `Dear ${params.recipientName}, happy anniversary! May your love continue to grow stronger with each passing year. From, ${params.senderName}`,
    "Get Well": `Dear ${params.recipientName}, sending you warm wishes for a speedy recovery. Get well soon! From, ${params.senderName}`,
    default: `Dear ${params.recipientName}, sending you my warmest wishes on this special occasion. From, ${params.senderName}`,
  };

  return templates[params.occasion as keyof typeof templates] || templates.default;
}

export async function generateMessage(params: {
  occasion: string;
  recipientName: string;
  senderName: string;
  additionalContext?: string;
}): Promise<string> {
  try {
    console.log("Starting message generation with params:", {
      occasion: params.occasion,
      recipientName: params.recipientName,
      senderName: params.senderName,
      hasContext: !!params.additionalContext,
    });

    const prompt = `Write a short, heartfelt ${params.occasion} message to ${params.recipientName} from ${params.senderName}. Additional context: ${params.additionalContext || 'None'}.`;

    console.log("Sending request to OpenAI API...");

    // Try up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 100, // Reduced tokens for efficiency
        });

        console.log("Received response from OpenAI API");
        const message = response.choices[0]?.message?.content;
        if (!message) {
          throw new Error("No message generated from OpenAI API");
        }

        return message;
      } catch (err: any) {
        if (err?.response?.status === 429 && attempt < 3) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}...`);
          await wait(waitTime);
          continue;
        }

        // On the last attempt, try the fallback
        if (attempt === 3) {
          console.log("Using fallback message generator");
          return generateFallbackMessage(params);
        }

        throw err;
      }
    }

    throw new Error("Failed after 3 attempts");
  } catch (error: any) {
    console.error("OpenAI API Error:", {
      error: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    // Use fallback if OpenAI fails
    console.log("Using fallback message generator after API error");
    return generateFallbackMessage(params);
  }
}