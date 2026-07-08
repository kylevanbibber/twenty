const IMAGE_PLACEHOLDER_REGEX = /\s*\[image:[^\]]+\]\s*/gi;
const HTML_BLOCK_END_REGEX = /<\/(?:address|blockquote|div|h[1-6]|li|p|tr)>/gi;
const HTML_BREAK_REGEX = /<br\s*\/?>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

export const formatEmailMessageText = (value?: string | null) =>
  (value ?? '')
    .replace(HTML_BREAK_REGEX, '\n')
    .replace(HTML_BLOCK_END_REGEX, '\n')
    .replace(HTML_TAG_REGEX, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(IMAGE_PLACEHOLDER_REGEX, ' ')
    .replace(/\s+(\d+\.\))/g, '\n$1')
    .replace(
      /\s+(Best regards,|Kind regards,|Warm regards,|Regards,|Sincerely,|Thanks,|Thank you,)/gi,
      '\n\n$1',
    )
    .replace(
      /((?:Best regards|Kind regards|Warm regards|Regards|Sincerely|Thanks|Thank you),)\s+(?=[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3}\s+(?:Founder\/CEO|Co-Founder|Chief Executive Officer|CEO|President|Director|Manager)\b)/g,
      '$1\n',
    )
    .replace(
      /\s+(Founder\/CEO|Co-Founder|Chief Executive Officer|CEO|President|Director|Manager)\b/g,
      '\n$1',
    )
    .replace(/\s+(📞|☎|✉️|✉|📧|🌐)\s*/g, '\n$1 ')
    .replace(/\s+(www\.[^\s]+)/gi, '\n$1')
    .replace(/(🌐)\n(www\.)/g, '$1 $2')
    .replace(/\s+(Book a meeting with me)\s*/gi, '\n$1')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
