import type MarkdownIt from 'markdown-it';

/** What a page notice is built from. */
export type PageNoticeContext = {
  /** The page's file path, as Vite sees it. */
  id: string;
  /** The page's parsed frontmatter, empty when it has none. */
  frontmatter: Record<string, unknown>;
  /** Distinct source keys the page cites with `[@key]`, in order of first use. */
  sources: string[];
};

/** Returns the notice as HTML, or null for a page that gets none. */
export type PageNotice = (page: PageNoticeContext) => string | null;

type NoticeEnv = {
  id?: string;
  frontmatter?: Record<string, unknown> | null;
  qdocsNotes?: { notes: { key: string }[] };
};

/**
 * Inserts the notice `notice` returns below the page's first level-1 heading, or at the top when
 * there is none. It runs after the inline pass, so it can count the notes the citations plugin
 * collected.
 */
export function mdPageNotice(md: MarkdownIt, notice: PageNotice): void {
  md.core.ruler.push('page_notice', (state) => {
    const env = state.env as NoticeEnv;
    const html = notice({
      id: env.id ?? '',
      frontmatter: env.frontmatter ?? {},
      sources: [...new Set((env.qdocsNotes?.notes ?? []).map((note) => note.key))],
    });
    if (html === null) return;
    const token = new state.Token('html_block', '', 0);
    token.content = `${html}\n`;
    token.block = true;
    const heading = state.tokens.findIndex((t) => t.type === 'heading_close' && t.tag === 'h1');
    state.tokens.splice(heading + 1, 0, token);
  });
}
