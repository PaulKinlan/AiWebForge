import { ContentType, ContextData } from "../types";
import * as fs from "fs";
import * as path from "path";

function getSiteDescription(): string {
  try {
    return fs
      .readFileSync(path.join(process.cwd(), "prompt.txt"), "utf-8")
      .trim();
  } catch (error) {
    console.warn("Could not read prompt.txt, using default description");
    return "A dynamic content generation website";
  }
}

export function generatePrompt(
  path: string,
  contentType: ContentType,
  context: ContextData,
): string {
  const siteDescription = getSiteDescription();
  const basePrompt = `You are an AI content generator that creates web content for the following site:\n\n${siteDescription}`;

  const contextPrompt =
    context.previousRequests.length > 0
      ? `\n\nContext from previous requests:\n${context.previousRequests
          .map((req) => `<file name="${req.path}">\n${req.content}\n</file>`)
          .join("\n\n")}`
      : "";

  const typeSpecificPrompt = getTypeSpecificPrompt(contentType);

  return `${basePrompt}${contextPrompt}\n\n${typeSpecificPrompt}\n\nGenerate ${contentType.toUpperCase()} content for the path "${path}".`;
}

function getTypeSpecificPrompt(contentType: ContentType): string {
  switch (contentType) {
    case "html":
      return "Generate valid HTML5 content. Include semantic markup and ensure accessibility. If you need CSS and JS prefer not to inline, instead create a link to a short file name, that describes the use-case.";
    case "css":
      return "Generate clean, modern CSS. Use flexbox/grid where appropriate. Include responsive design considerations.";
    case "js":
      return "Generate clean JavaScript code. Use modern ES6+ syntax. Ensure error handling and browser compatibility.";
    case "media":
      return "Media files are handled directly without content generation.";
  }
}
