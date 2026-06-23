#!/usr/bin/env node
/**
 * build.js — Blog by NousVault
 *
 * 1. Scans /posts/*.md
 * 2. Parses frontmatter (title, date, type, slug)
 * 3. Resolves [[slug]] and [[slug|label]] wiki-links
 * 4. Renders markdown → HTML via marked
 * 5. Writes /dist/<slug>.html (with embedded <!--META:{...}--> comment)
 * 6. Writes /posts.json (sorted by date desc)
 */

const fs   = require('fs');
const path = require('path');
const { marked } = require('marked');

const POSTS_DIR = path.join(__dirname, 'posts');
const DIST_DIR  = path.join(__dirname, 'dist');
const OUT_JSON  = path.join(__dirname, 'posts.json');

// ── Helpers ────────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      meta[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
    }
  });

  return { meta, body: match[2] };
}

/**
 * Resolve [[slug]] and [[slug|label]] wiki-links.
 * Requires the full posts index to look up titles.
 */
function resolveWikiLinks(markdown, postsIndex) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [slugPart, labelPart] = inner.split('|').map(s => s.trim());
    const target = postsIndex.find(p => p.slug === slugPart);
    if (!target) {
      // Broken link — render as muted strikethrough span
      return `<span class="wiki-broken" title="Post not found: ${slugPart}">${labelPart || slugPart}</span>`;
    }
    const label = labelPart || target.title;
    return `<a href="/${target.slug}">${label}</a>`;
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  // First pass — collect all metadata for wiki-link resolution
  const postsIndex = [];

  files.forEach(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta } = parseFrontmatter(raw);
    const slug = meta.slug || file.replace(/\.md$/, '');
    postsIndex.push({
      title: meta.title || slug,
      date:  meta.date  || '1970-01-01',
      type:  (meta.type || 'article').toLowerCase(),
      slug,
    });
  });

  // Sort by date descending for posts.json
  postsIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Second pass — render HTML
  files.forEach(file => {
    const raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = meta.slug || file.replace(/\.md$/, '');

    // Configure marked for safe rendering
    marked.setOptions({ gfm: true, breaks: false });

    // Resolve wiki-links before passing to marked
    const resolvedBody = resolveWikiLinks(body, postsIndex);
    const htmlBody = marked.parse(resolvedBody);

    // Embed meta as HTML comment for post.html to read at runtime
    const metaJson = JSON.stringify({
      title: meta.title || slug,
      date:  meta.date  || '',
      type:  (meta.type || 'article').toLowerCase(),
      slug,
    });

    const output = `<!--META:${metaJson}-->\n${htmlBody}`;
    fs.writeFileSync(path.join(DIST_DIR, `${slug}.html`), output, 'utf8');
    console.log(`  built: ${slug}`);
  });

  // Write posts.json
  fs.writeFileSync(OUT_JSON, JSON.stringify(postsIndex, null, 2), 'utf8');
  console.log(`\nposts.json written — ${postsIndex.length} post(s)`);
}

build();
