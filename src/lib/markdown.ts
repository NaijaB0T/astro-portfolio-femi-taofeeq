export function parseMarkdown(markdown: string): string {
  if (!markdown.trim()) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">$1</blockquote>')
    // Unordered lists
    .replace(/^[\s]*[-*+] (.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^[\s]*\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks for paragraphs
    .replace(/\n\s*\n/g, '</p><p>')
    // Single line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraphs if not already wrapped in block elements
  if (!html.match(/^<(h[1-6]|p|div|blockquote|ul|ol|pre)/)) {
    html = '<p>' + html + '</p>';
  }
  
  // Clean up lists
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul class="list-disc pl-6 mb-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');
  
  // Style headers
  html = html.replace(/<h1>/g, '<h1 class="text-3xl font-bold mt-8 mb-4">');
  html = html.replace(/<h2>/g, '<h2 class="text-2xl font-bold mt-6 mb-3">');
  html = html.replace(/<h3>/g, '<h3 class="text-xl font-bold mt-4 mb-2">');
  
  // Style paragraphs
  html = html.replace(/<p>/g, '<p class="mb-4">');
  
  // Style code
  html = html.replace(/<code>/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">');
  html = html.replace(/<pre>/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4">');
  
  // Style links
  html = html.replace(/<a href/g, '<a class="text-primary hover:underline" href');
  
  return html;
}
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}