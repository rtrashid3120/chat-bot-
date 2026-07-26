import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/chat/code-block";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const resolvedParams = await params;
  
  const conversation = await prisma.conversation.findUnique({
    where: { shareId: resolvedParams.shareId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-brand-500">
              Promptly-AI
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Shared Conversation • {conversation.messages.length} messages
            </p>
          </div>
          <a 
            href="/" 
            className="text-sm px-4 py-2 rounded-xl bg-brand-500/15 text-brand-500 hover:bg-brand-500 hover:text-primary-foreground transition-all font-medium"
          >
            Try Promptly-AI
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
                m.role === "user"
                  ? "bg-brand-500 text-primary-foreground rounded-br-none shadow-brand-500/20"
                  : "bg-card border border-border/50 text-card-foreground rounded-bl-none shadow-sm"
              } shadow-lg relative animate-fade-in`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-brand-500 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-[10px] font-bold text-primary-foreground">RB</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-500">Promptly-AI</span>
                </div>
              )}
              
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                      ) : (
                        <code className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="leading-relaxed whitespace-pre-wrap mb-4 last:mb-0">{children}</p>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:text-brand-400 underline underline-offset-4 decoration-brand-500/30">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
