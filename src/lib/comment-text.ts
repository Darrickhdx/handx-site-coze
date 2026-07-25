/**
 * Comment JSON is HTML-escaped at the server boundary. Decode exactly one
 * escaping pass before handing the value to a React text node; React performs
 * the final DOM escaping, so markup remains inert while ordinary `&` and `<`
 * characters display naturally.
 */
export function decodeEscapedCommentText(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}
