export function renderMarkdown(md: string): string {
  if (!md) return '';
  return md
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-foreground mt-3 mb-1.5">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-foreground mt-4 mb-2 border-b border-border pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-foreground mt-2 mb-3">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic text-foreground">$1</em>')
    .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre class="bg-muted/70 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border border-border"><code>$2</code></pre>')
    .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary border border-border/50">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm text-muted-foreground my-0.5">$1</li>')
    .replace(/\n/gim, '<br/>');
}
