export const AVAILABLE_MENTIONS = [
  { label: "@Jorge", value: "@Jorge", target: "Jorge" },
  { label: "@Samuel", value: "@Samuel", target: "Samuel" },
  { label: "@David", value: "@David", target: "David" },
  { label: "@todos", value: "@todos", target: "all" },
] as const;

export type MentionTarget = "Jorge" | "Samuel" | "David" | "all";

export interface TextSegment {
  type: "text" | "mention";
  value: string;
  target?: MentionTarget;
}

/**
 * Parsea el texto del mensaje separando texto plano y menciones
 */
export function parseMentions(text: string): TextSegment[] {
  if (!text) return [];

  const mentionRegex = /(@Jorge|@Samuel|@David|@todos)\b/gi;
  const segments: TextSegment[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Plain text before mention
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    const matchedMention = match[0];
    const normalized = matchedMention.toLowerCase();

    let target: MentionTarget = "all";
    if (normalized === "@jorge") target = "Jorge";
    else if (normalized === "@samuel") target = "Samuel";
    else if (normalized === "@david") target = "David";

    segments.push({
      type: "mention",
      value: matchedMention,
      target,
    });

    lastIndex = match.index + matchedMention.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Determina si un mensaje contiene una mención dirigida al usuario actual
 */
export function isUserMentioned(content: string, currentUserName?: string): boolean {
  if (!content || !currentUserName) return false;

  const lower = content.toLowerCase();
  if (lower.includes("@todos")) return true;

  return lower.includes(`@${currentUserName.toLowerCase()}`);
}
