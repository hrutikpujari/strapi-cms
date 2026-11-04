import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import zlib from 'zlib';
import type { Core } from '@strapi/strapi';

/* ------------------------------------------------------------------ */
/* Minimal PNG encoder — generates gradient cover art with zero deps   */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

type RGB = [number, number, number];

function generatePng(width: number, height: number, c1: RGB, c2: RGB, accent: RGB): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  const cx = width * 0.72;
  const cy = height * 0.3;
  const radius = Math.min(width, height) * 0.45;

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      let r = c1[0] + (c2[0] - c1[0]) * t;
      let g = c1[1] + (c2[1] - c1[1]) * t;
      let b = c1[2] + (c2[2] - c1[2]) * t;
      // soft accent circle
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d < 1) {
        const w = (1 - d) * 0.55;
        r = r * (1 - w) + accent[0] * w;
        g = g * (1 - w) + accent[1] * w;
        b = b * (1 - w) + accent[2] * w;
      }
      const i = rowStart + 1 + x * 3;
      raw[i] = Math.round(r);
      raw[i + 1] = Math.round(g);
      raw[i + 2] = Math.round(b);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const PALETTES: [RGB, RGB, RGB][] = [
  [[15, 23, 42], [59, 7, 100], [236, 72, 153]],
  [[12, 74, 110], [8, 145, 178], [253, 224, 71]],
  [[30, 41, 59], [124, 58, 237], [34, 211, 238]],
  [[69, 26, 3], [180, 83, 9], [252, 211, 77]],
  [[20, 83, 45], [5, 150, 105], [187, 247, 208]],
  [[76, 29, 149], [192, 38, 211], [250, 204, 21]],
  [[127, 29, 29], [219, 39, 119], [254, 215, 170]],
  [[15, 118, 110], [13, 148, 136], [153, 246, 228]],
  [[55, 48, 163], [79, 70, 229], [199, 210, 254]],
  [[131, 24, 67], [190, 24, 93], [251, 207, 232]],
];

let paletteIndex = 0;
const nextPalette = () => PALETTES[paletteIndex++ % PALETTES.length];

async function uploadImage(
  strapi: Core.Strapi,
  name: string,
  alt: string,
  width = 1200,
  height = 800
) {
  const [c1, c2, accent] = nextPalette();
  const png = generatePng(width, height, c1, c2, accent);
  const tmpPath = path.join(os.tmpdir(), `seed-${Date.now()}-${name}.png`);
  await fs.writeFile(tmpPath, png);

  try {
    const [file] = await (strapi.plugin('upload').service('upload') as any).upload({
      data: {
        fileInfo: { name: `${name}.png`, alternativeText: alt, caption: alt },
      },
      files: {
        filepath: tmpPath,
        originalFilename: `${name}.png`,
        mimetype: 'image/png',
        size: png.length,
      },
    });
    return file;
  } finally {
    await fs.rm(tmpPath, { force: true });
  }
}

/* ------------------------------------------------------------------ */
/* Strapi Blocks helpers                                                */
/* ------------------------------------------------------------------ */

const t = (text: string, marks: Record<string, boolean> = {}) => ({
  type: 'text',
  text,
  ...marks,
});
const p = (text: string) => ({ type: 'paragraph', children: [t(text)] });
const h = (level: number, text: string) => ({
  type: 'heading',
  level,
  children: [t(text)],
});
const quote = (text: string) => ({ type: 'quote', children: [t(text)] });
const ulist = (items: string[]) => ({
  type: 'list',
  format: 'unordered',
  children: items.map((i) => ({ type: 'list-item', children: [t(i)] })),
});
const code = (text: string) => ({ type: 'code', children: [t(text)] });

/* ------------------------------------------------------------------ */
/* Demo content                                                         */
/* ------------------------------------------------------------------ */

export async function seedDemoData(strapi: Core.Strapi) {
  const existingSettings = await strapi
    .documents('api::website-setting.website-setting')
    .findFirst({});

  if (!existingSettings) {
    await seedWebsiteSettings(strapi);
  }

  const articleCount = await strapi.db.query('api::article.article').count();
  if (articleCount > 0) {
    strapi.log.info('[seed] Articles already exist — skipping demo seed');
    await seedExtraArticles(strapi);
    return;
  }

  strapi.log.info('[seed] Empty database detected — seeding demo content…');

  // --- Categories ----------------------------------------------------
  const categoryDefs = [
    {
      name: 'Technology',
      description:
        'Deep dives into the tools, frameworks, and ideas shaping how software gets built.',
      seoTitle: 'Technology Articles — Meridian',
      seoDescription:
        'Essays and reporting on software engineering, web platforms, and emerging technology.',
    },
    {
      name: 'Design',
      description:
        'Typography, systems, and the craft of interfaces that feel inevitable.',
      seoTitle: 'Design Articles — Meridian',
      seoDescription:
        'Essays on design systems, typography, and the craft of digital interfaces.',
    },
    {
      name: 'Productivity',
      description:
        'Working methods, deep work, and the tools that actually earn their place.',
      seoTitle: 'Productivity Articles — Meridian',
      seoDescription:
        'Practical essays on deep work, focus, and sustainable creative output.',
    },
    {
      name: 'Culture',
      description:
        'How media, attention, and the internet are rewiring the way we live.',
      seoTitle: 'Culture Articles — Meridian',
      seoDescription:
        'Criticism and reporting on internet culture, media, and the attention economy.',
    },
  ];

  const categories: Record<string, any> = {};
  for (const def of categoryDefs) {
    const image = await uploadImage(
      strapi,
      `category-${def.name.toLowerCase()}`,
      `${def.name} category cover`
    );
    categories[def.name] = await strapi.documents('api::category.category').create({
      data: { ...def, slug: def.name.toLowerCase(), image: image.id },
    });
  }

  // --- Tags -----------------------------------------------------------
  const tagDefs = [
    'Next.js',
    'React',
    'AI',
    'Tutorial',
    'Opinion',
    'Web Development',
    'Typography',
    'Focus',
  ];
  const tags: Record<string, any> = {};
  for (const name of tagDefs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    tags[name] = await strapi.documents('api::tag.tag').create({
      data: { name, slug },
    });
  }

  // --- Authors ---------------------------------------------------------
  const authorDefs = [
    {
      name: 'Maya Chen',
      designation: 'Senior Editor, Technology',
      bio: 'Maya covers software platforms and the people who build them. Previously an engineer at two infrastructure startups, she now writes about where the web is heading — and what gets lost along the way.',
      socialLinks: {
        twitter: 'https://twitter.com/mayachen',
        linkedin: 'https://linkedin.com/in/mayachen',
        github: 'https://github.com/mayachen',
        website: 'https://mayachen.dev',
      },
    },
    {
      name: 'Daniel Okafor',
      designation: 'Staff Writer, Design & Culture',
      bio: 'Daniel writes about design systems, typography, and internet culture. His work has appeared in several digital publications, and he still believes the best interface is the one you barely notice.',
      socialLinks: {
        twitter: 'https://twitter.com/danielokafor',
        linkedin: 'https://linkedin.com/in/danielokafor',
        instagram: 'https://instagram.com/danielokafor',
      },
    },
    {
      name: 'Sofia Marchetti',
      designation: 'Contributing Writer',
      bio: 'Sofia studies how people work — attention, rituals, and the tools that survive contact with real life. She splits her time between Lisbon and a very cluttered desk.',
      socialLinks: {
        twitter: 'https://twitter.com/sofiamarchetti',
        website: 'https://sofiamarchetti.com',
      },
    },
  ];

  const authors: Record<string, any> = {};
  for (const def of authorDefs) {
    const avatar = await uploadImage(
      strapi,
      `author-${def.name.split(' ')[0].toLowerCase()}`,
      `Portrait of ${def.name}`,
      400,
      400
    );
    authors[def.name] = await strapi.documents('api::author.author').create({
      data: {
        ...def,
        slug: def.name.toLowerCase().replace(/\s+/g, '-'),
        avatar: avatar.id,
      },
    });
  }

  // --- Articles --------------------------------------------------------
  const articleDefs: {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    author: string;
    tags: string[];
    featured?: boolean;
    viewCount: number;
    daysAgo: number;
    content: any[];
  }[] = [
    {
      title: 'The Quiet Renaissance of Server Components',
      slug: 'quiet-renaissance-of-server-components',
      excerpt:
        'React Server Components did not arrive with fireworks. They arrived the way important changes usually do — slowly, then all at once.',
      category: 'Technology',
      author: 'Maya Chen',
      tags: ['Next.js', 'React', 'Web Development'],
      featured: true,
      viewCount: 4821,
      daysAgo: 2,
      content: [
        p('For two decades, the architecture of the web has swung between two poles: render on the server, or render on the client. Each swing was framed as a revolution. Each, in hindsight, was really a negotiation.'),
        p('React Server Components are the latest term in that negotiation — and arguably the most interesting one yet, because they refuse to pick a side.'),
        h(2, 'What actually changed'),
        p('The pitch is deceptively simple: some components render only on the server, ever. They can read your database, your file system, your secrets. They ship zero JavaScript to the browser. The client receives their output as a serialized description of UI, ready to hydrate around the interactive islands that remain.'),
        p('This matters less for what it adds than for what it removes. Every dependency used by a server component is a dependency your users never download. Data fetching stops being a round-trip choreography of loading spinners and becomes, again, a function you await.'),
        h(2, 'The part nobody warns you about'),
        p('The mental model is the hard part. The boundary between server and client is now a boundary inside your component tree, and crossing it has rules. Props that cross the boundary must be serializable. State and effects live on one side only. It is not difficult so much as unfamiliar — the way typing on a new keyboard layout is unfamiliar.'),
        quote('The best framework feature is the one that deletes code you were embarrassed to have written.'),
        p('Most teams discover the same pattern: start server-first, push interactivity down to the leaves. The result is smaller bundles, faster first paint, and data access that reads like the feature it implements instead of a treaty between three abstractions.'),
        h(2, 'Where this goes next'),
        p('The interesting question is no longer whether server components work — they do — but what a generation of developers builds when "just fetch it in the component" is the default again. If history is a guide, the answer will look obvious in five years and radical right now.'),
      ],
    },
    {
      title: 'Design Systems Are a Language, Not a Library',
      slug: 'design-systems-are-a-language',
      excerpt:
        'The teams that fail at design systems treat them like npm packages. The teams that succeed treat them like grammar.',
      category: 'Design',
      author: 'Daniel Okafor',
      tags: ['Typography', 'Opinion'],
      featured: true,
      viewCount: 3654,
      daysAgo: 5,
      content: [
        p('Every design system failure I have witnessed began the same way: a team published a component library, declared victory, and watched in confusion as product teams kept shipping inconsistent interfaces anyway.'),
        p('The mistake is subtle. A library is something you import. A language is something you think in. Design systems only work when they become the second thing.'),
        h(2, 'Components are vocabulary, not fluency'),
        p('A button component answers the question "what does a button look like here?" It does not answer "when do we use a primary action versus a quiet one?" or "how much tension should this screen hold?" Those are questions of grammar — the rules that turn a pile of words into a sentence a reader understands.'),
        p('Fluent teams internalize spacing scales the way writers internalize rhythm. They do not consult a chart to know that a dense table wants a looser section header above it, any more than you consult a dictionary to conjugate a verb.'),
        h(2, 'Write the rules down — in prose'),
        p('The strongest design systems documents are not component galleries. They are essays: here is how we think about hierarchy, about density, about when an interface should whisper and when it should insist. The components are just the words those essays happen to be written in.'),
        ulist([
          'Document decisions, not just artifacts',
          'Teach the reasoning behind tokens, not only their values',
          'Treat inconsistencies as grammar errors, not stylesheet drift',
        ]),
        p('Libraries get adopted. Languages get spoken. If your design system is only the former, you have built a dictionary for a conversation nobody is having.'),
      ],
    },
    {
      title: 'How AI Assistants Changed the Way I Write Code',
      slug: 'ai-assistants-changed-how-i-write-code',
      excerpt:
        'A year of working alongside an AI pair programmer taught me less about prompts than about the parts of programming that were never really about typing.',
      category: 'Technology',
      author: 'Maya Chen',
      tags: ['AI', 'Opinion', 'Tutorial'],
      featured: true,
      viewCount: 5902,
      daysAgo: 8,
      content: [
        p('The first thing the AI took from me was boilerplate. The second thing — and I did not notice this for months — was my tolerance for ambiguity.'),
        p('Working with an assistant that will cheerfully generate a plausible answer to an imprecise question forces a discipline that solo work never did. Vague request, vague code. So you learn to specify: types, invariants, failure modes. The skill being exercised is not prompt engineering. It is the oldest skill in software — saying precisely what you mean.'),
        h(2, 'What the assistant is actually good at'),
        ulist([
          'First drafts of anything structural: schemas, migrations, test scaffolding',
          'Translations — this pattern in that framework, this syntax in that language',
          'The second pair of eyes that never gets tired and never gets bored',
          'Rubber-ducking, except the duck occasionally knows the answer',
        ]),
        h(2, 'Where it falls down'),
        p('The failures share a shape: the assistant is confident exactly where a human colleague would hesitate. It will invent an API that should exist, cite a config option from a version that never shipped, refactor toward elegance when the ugly code was ugly on purpose.'),
        p('So the workflow becomes generative-adversarial, with you in the adversarial seat. Every suggestion gets the same question a senior reviewer asks: not "does this work?" but "why is this right?"'),
        h(2, 'The part that surprised me'),
        p('I expected speed. What I got was surface area. Features I would have cut — the export button, the empty-state copy, the third edge case in the migration — now cost an afternoon instead of a week. The bottleneck moved from writing code to deciding what code should exist. That turns out to be a better bottleneck.'),
      ],
    },
    {
      title: 'A Field Guide to Incremental Static Regeneration',
      slug: 'field-guide-to-incremental-static-regeneration',
      excerpt:
        'ISR is the rare feature that is exactly what it sounds like — once you understand where the cache actually lives.',
      category: 'Technology',
      author: 'Maya Chen',
      tags: ['Next.js', 'Tutorial', 'Web Development'],
      viewCount: 2103,
      daysAgo: 12,
      content: [
        p('Incremental Static Regeneration answers a question that plagued the Jamstack era: how do you get static-file performance without rebuilding the entire site every time a headline changes?'),
        p('The answer: rebuild pages, not sites — lazily, in the background, on a schedule you choose.'),
        h(2, 'The mental model'),
        p('Think of each route as a tiny cache with a clock. The first visitor after the cache expires does not wait for a rebuild — they get the stale page instantly while the fresh one renders behind them. The next visitor gets the new version. Nobody ever sees a loading spinner for a page that was static yesterday.'),
        code("// app/blog/[slug]/page.tsx\nexport const revalidate = 60; // regenerate at most once a minute\n\nexport default async function ArticlePage({ params }) {\n  const article = await getArticle(params.slug);\n  return <Article article={article} />;\n}"),
        h(2, 'When ISR is the wrong tool'),
        p('If the content must be correct for the current viewer — a cart, a dashboard, anything personalized — static generation of any flavor is the wrong primitive. ISR serves everyone the same page; that is its feature, not its limitation.'),
        p('The failure mode worth knowing is the "thundering rebuild": set revalidate to one second on a hot route and you have built a very expensive way to serve stale content. Pick a cadence that matches how fast the underlying data actually changes.'),
        h(2, 'On-demand revalidation'),
        p('Time-based revalidation is a floor, not a ceiling. Hook your CMS to call the revalidate API on publish and stale content disappears the moment it is fixed — the best of static speed with near-dynamic freshness.'),
        code("// app/api/revalidate/route.ts\nimport { revalidatePath } from 'next/cache';\n\nexport async function POST(req: Request) {\n  revalidatePath('/blog');\n  return Response.json({ revalidated: true });\n}"),
      ],
    },
    {
      title: 'Why Every Newsroom Needs a Headless CMS',
      slug: 'why-every-newsroom-needs-headless-cms',
      excerpt:
        'The monolith that served newspapers for fifteen years is being unbundled — and editorial teams are the surprising winners.',
      category: 'Culture',
      author: 'Daniel Okafor',
      tags: ['Opinion', 'Web Development'],
      viewCount: 1876,
      daysAgo: 16,
      content: [
        p('For most of the web\'s history, the CMS was the site. Your content lived inside the same machine that rendered it, styled it, and — too often — held it hostage.'),
        p('Headless architecture severs that dependency. The CMS becomes what it should always have been: a clean room where content is created, edited, and published. What consumes that content — a website, an app, a newsletter, a screen in a lobby — becomes someone else\'s problem.'),
        h(2, 'The editorial case'),
        p('The surprising thing about headless migrations is who ends up happiest. Not the engineers — though they are — but the editors. Structured content forces a discipline that free-form page builders never did: an article has a title, a dek, an author, a body. You cannot paste a carousel into a field called "excerpt."'),
        p('Structure is not a constraint on editorial. It is the thing that lets editorial scale. The same structured article feeds the site, the app, the SEO metadata, and the social cards — write once, publish everywhere stops being a slogan.'),
        h(2, 'The economics'),
        quote('You stop paying the redesign tax. When the frontend needs rebuilding, the content — the expensive part, the decades of it — stays exactly where it is.'),
        p('Every newsroom that has survived a "we are rebuilding the site" project knows the real cost was never the new design. It was migrating twenty years of articles out of a database shaped like the old homepage. Headless makes that the last migration you ever do.'),
      ],
    },
    {
      title: 'Typography Is the User Interface',
      slug: 'typography-is-the-user-interface',
      excerpt:
        'Strip the shadows, the gradients, the rounded corners — what remains of your interface is the type. Choose accordingly.',
      category: 'Design',
      author: 'Daniel Okafor',
      tags: ['Typography', 'Opinion'],
      viewCount: 2944,
      daysAgo: 20,
      content: [
        p('There is a test every interface should pass: remove every visual element except the text. No color, no borders, no icons. If the hierarchy still communicates — if a user can still tell what matters most, what to read first, what action is primary — the design is working. If not, the decoration was doing work the typography should have done.'),
        h(2, 'Hierarchy is a service'),
        p('Readers do not owe you their attention; you earn it in roughly fifty millisecond increments. Type scale, weight, and spacing are how an interface says "this first, then this" before a single word is read. A heading one size too small is not an aesthetic mistake — it is a failure of navigation.'),
        h(2, 'The measure, the rhythm'),
        p('Line length between 45 and 75 characters is not a designer\'s superstition; it is where the eye\'s return sweep lands reliably at the start of the next line. Pair it with line-height around 1.5 for body text and vertical spacing derived from a single rhythm unit, and long-form reading stops feeling like work.'),
        ulist([
          '45–75 characters per line for body copy',
          'Line-height of 1.4–1.7 for paragraphs',
          'A type scale with purpose, not arbitrary pixel values',
          'Whitespace that does the work borders are doing now',
        ]),
        p('Interfaces are, at their core, structured text with occasional buttons. The teams that internalize this build products that feel calm. The rest build products that feel decorated.'),
      ],
    },
    {
      title: 'The Four-Hour Deep Work Experiment',
      slug: 'four-hour-deep-work-experiment',
      excerpt:
        'I gave myself four uninterrupted hours a day for a month. The results were annoying in how predictable they were.',
      category: 'Productivity',
      author: 'Sofia Marchetti',
      tags: ['Focus', 'Opinion'],
      viewCount: 4410,
      daysAgo: 25,
      content: [
        p('The experiment had one rule: 9am to 1pm, every weekday, was a closed door. No meetings, no messages, no "quick questions." The first week felt irresponsible. The fourth week felt like the only sane way I had ever worked.'),
        h(2, 'What the calendar was hiding'),
        p('The immediate discovery was not that I had too many meetings. It was that the meetings I had were load-bearing — they existed to make decisions nobody had written down. Once the block made async writing the default, half the calendar evaporated. Decisions became documents. Documents stopped needing meetings.'),
        h(2, 'The uncomfortable part'),
        p('Deep work exposes how much of "work" was performance — the ambient hum of responsiveness that signals productivity without producing anything. When the signal goes quiet, you find out what your output actually looks like. Mine was lumpy: two brilliant days, two mediocre ones, one where the best move was closing the laptop and taking a walk.'),
        quote('Focus is not a personality trait. It is an architectural decision about your day.'),
        h(2, 'What survived the month'),
        ulist([
          'Four protected hours beats eight aspirational ones',
          'A shutdown ritual makes the next morning start at speed',
          'The block fails the day it becomes negotiable',
          'Boredom, it turns out, is where the drafts come from',
        ]),
        p('I no longer do the full four hours — the job will not sustain it. But the experiment permanently raised the floor: ninety minutes, non-negotiable, before the day is allowed to happen to me.'),
      ],
    },
    {
      title: 'The Attention Economy\'s Quiet Rebellion',
      slug: 'attention-economy-quiet-rebellion',
      excerpt:
        'Something interesting is happening at the edges of the feed: people are paying — with money, not clicks — for things designed to be finished.',
      category: 'Culture',
      author: 'Daniel Okafor',
      tags: ['Opinion'],
      viewCount: 1730,
      daysAgo: 30,
      content: [
        p('The attention economy\'s core insight was never that attention is valuable. It was that attention is measurable — and that anything measurable can be sold.'),
        p('But a counter-pattern is emerging, too small to trend and too consistent to ignore: the resurgence of media designed to be completed rather than consumed indefinitely.'),
        h(2, 'The economics of endings'),
        p('A feed has no ending because an ending is an opportunity to leave. Books, albums, newsletters with a final paragraph — these products are structurally honest. They want something from you that an infinite scroll never will: a finite transaction, your time in exchange for a thing that is itself finite.'),
        p('The subscription newsletter, the paid podcast, the e-reader comeback — each is a small bet that people will pay to have their attention respected rather than harvested. The numbers are still modest. The direction is not.'),
        h(2, 'What this means for publishers'),
        p('The lesson is not "charge for content" — most cannot. It is that trust compounds differently than reach does. An audience that finishes what you make is worth more than one that scrolls past it, even when the second number is bigger. The analytics dashboard cannot see this yet. The renewal page can.'),
      ],
    },
    {
      title: 'Building a Second Brain You Will Actually Use',
      slug: 'building-a-second-brain-you-actually-use',
      excerpt:
        'Most note-taking systems fail at the same point: capture becomes a hobby and retrieval never happens. Here is the fix.',
      category: 'Productivity',
      author: 'Sofia Marchetti',
      tags: ['Tutorial', 'Focus'],
      viewCount: 3210,
      daysAgo: 35,
      content: [
        p('The dirty secret of personal knowledge management is that most systems are elaborate ways to avoid thinking. We tag, we link, we build beautiful graphs — and then we never look at any of it again.'),
        p('The fix is not a better app. It is a smaller system with an enforced destination.'),
        h(2, 'The rule that changes everything'),
        p('Every note must answer one question at capture time: what project, decision, or piece of writing is this for? "Interesting" is not a destination — it is a waiting room where ideas go to be forgotten politely. If you cannot name where a note will be used, either name it or delete it.'),
        h(2, 'A minimal architecture'),
        ulist([
          'Inbox — capture only, emptied weekly',
          'Projects — active work, notes live here until shipped',
          'Areas — ongoing responsibilities and reference',
          'Archive — completed projects, searchable, mostly forgotten by design',
        ]),
        p('That is the whole system. The moment your taxonomy needs a flowchart, it has become the work instead of supporting it.'),
        h(2, 'Retrieval is the point'),
        quote('A note you never resurface is not knowledge. It is hoarding with better typography.'),
        p('The weekly review is where second brains live or die. Fifteen minutes, inbox to zero, every note either attached to active work or archived without guilt. Do that for a month and the system starts paying rent — you sit down to write and the research is already there, sorted, waiting.'),
      ],
    },
  ];

  for (const def of articleDefs) {
    const image = await uploadImage(strapi, `article-${def.slug}`, def.title);
    const thumb = await uploadImage(strapi, `thumb-${def.slug}`, def.title, 640, 420);
    const publishedAt = new Date(Date.now() - def.daysAgo * 86400000);

    await strapi.documents('api::article.article').create({
      data: {
        title: def.title,
        slug: def.slug,
        excerpt: def.excerpt,
        content: def.content,
        featuredImage: image.id,
        thumbnailImage: thumb.id,
        ogImage: image.id,
        author: def.author ? authors[def.author].documentId : undefined,
        category: categories[def.category].documentId,
        tags: def.tags.map((n) => tags[n].documentId),
        featured: def.featured ?? false,
        publishedDate: publishedAt,
        viewCount: def.viewCount,
        seoTitle: `${def.title} — Meridian`,
        seoDescription: def.excerpt,
      },
      status: 'published',
    });
  }

  strapi.log.info('[seed] Demo content seeded successfully');
}

async function seedWebsiteSettings(strapi: Core.Strapi) {
  const logo = await uploadImage(strapi, 'site-logo', 'Meridian logo', 320, 120);
  const og = await uploadImage(strapi, 'default-og', 'Meridian — Ideas worth reading');

  const settingsData = {
      siteName: 'Meridian',
      siteDescription:
        'Meridian is an independent journal of technology, design, and culture — essays and reporting for people who make things on the web.',
      logo: logo.id,
      favicon: logo.id,
      contactEmail: 'hello@meridian.press',
      footerContent:
        'Independent essays and reporting on technology, design, and culture. Published weekly.',
      socialLinks: {
        twitter: 'https://twitter.com/meridianpress',
        linkedin: 'https://linkedin.com/company/meridianpress',
        github: 'https://github.com/meridianpress',
        instagram: 'https://instagram.com/meridianpress',
      },
      defaultSeoTitle: 'Meridian — Ideas worth reading',
      defaultSeoDescription:
        'Essays and reporting on technology, design, productivity, and internet culture.',
      defaultOgImage: og.id,
  };

  await strapi
    .documents('api::website-setting.website-setting')
    .create({ data: settingsData });

  strapi.log.info('[seed] Website settings seeded');
}

/* ------------------------------------------------------------------ */
/* Extra batch — idempotent, inserts only articles whose slug is new   */
/* ------------------------------------------------------------------ */

const EXTRA_ARTICLES: {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  tags: string[];
  featured?: boolean;
  viewCount: number;
  daysAgo: number;
  content: any[];
}[] = [
  {
    title: 'Designing for the Quiet Web',
    slug: 'designing-for-the-quiet-web',
    excerpt:
      'The loudest interfaces win the demo. The quiet ones win the decade. Notes on designing products that do not beg for attention.',
    category: 'Design',
    author: 'Daniel Okafor',
    tags: ['Typography', 'Opinion'],
    viewCount: 1254,
    daysAgo: 1,
    content: [
      p('There is a kind of interface you only notice on the third or fourth use, when you realize you have not once had to think about it. No confetti, no empty-state illustration doing a little dance, no notification begging you to come back. Just software that sits still until you need it.'),
      p('I have started calling this the quiet web, and I think it is where good design is heading — not because restraint is fashionable, but because users have developed antibodies to noise.'),
      h(2, 'Attention is a budget, not a resource'),
      p('Every badge, banner, and bounce animation spends from the same finite account as your actual content. An interface that spends attention on itself has less left for the task it exists to perform. The quiet-web test is simple: does this element help the user read, decide, or act — or does it help the product feel busy?'),
      h(2, 'What quiet looks like in practice'),
      ulist([
        'Typography carrying hierarchy so borders and shadows do not have to',
        'Empty states that explain what to do next in one sentence, not a metaphor',
        'Defaults so sensible the settings page is almost embarrassed to exist',
        'Notifications that ask themselves whether this moment really needs one',
      ]),
      p('None of this is minimalism as an aesthetic. It is minimalism as respect — the difference between a spartan room and a quiet one.'),
      quote('The best compliment an interface can receive is that nobody mentioned it.'),
      h(2, 'The business case nobody writes down'),
      p('Loud design optimizes for the screenshot and the first session. Quiet design optimizes for the hundredth. If your product makes money from users who stay rather than users who arrive, calm is not a style choice — it is the retention strategy.'),
    ],
  },
  {
    title: 'Type Safety Is a Team Sport',
    slug: 'type-safety-is-a-team-sport',
    excerpt:
      'The most valuable type in your codebase is not the cleverest one — it is the one your teammate can read at 2am during an incident.',
    category: 'Technology',
    author: 'Maya Chen',
    tags: ['Web Development', 'Tutorial'],
    viewCount: 987,
    daysAgo: 4,
    content: [
      p('There is a genre of TypeScript that reads like a proof: mapped types folding into conditional types folding into infer clauses, and somewhere in the middle the answer to a question nobody asked. It is technically impressive. It is also, usually, a liability.'),
      p('Type systems are a communication channel between the person writing code now and the person fixing it later — often the same person, always with less context than they think they have. Optimizing that channel for cleverness optimizes it for nobody.'),
      h(2, 'The types that earn their keep'),
      p('The highest-value type work in most codebases is boring: honest domain models, discriminated unions for states that cannot coexist, branded primitives where a string is not just a string. None of it is hard. All of it prevents the class of bug that eats weekends.'),
      code('// The honest version — three states, no impossible ones\ntype Request<T> =\n  | { status: \'loading\' }\n  | { status: \'error\'; error: Error }\n  | { status: \'success\'; data: T };'),
      h(2, 'Cleverness has a maintenance price'),
      p('Every generic puzzle is a toll booth on the road to understanding. The calculus is simple: a type that takes five minutes to write and thirty seconds to read is good trade. One that takes thirty seconds to write and five minutes to decode is theft — from every future reader, at compound interest.'),
      quote('Write types like the person maintaining them is you, six months from now, slightly tired.'),
      p('The strongest signal of a healthy type culture is not how advanced the types are. It is how rarely anyone has to open the type file to understand the code above it.'),
    ],
  },
  {
    title: 'Reading the Documentation Is a Skill',
    slug: 'reading-the-documentation-is-a-skill',
    excerpt:
      'Most developers treat docs like a phone book — look up the function, leave. The ones who get fast treat them like a map.',
    category: 'Technology',
    author: 'Maya Chen',
    tags: ['Tutorial', 'Focus'],
    viewCount: 2210,
    daysAgo: 7,
    content: [
      p('Watch a senior engineer use documentation and you will notice something strange: they spend most of their time in sections that answer questions they have not asked yet.'),
      p('Juniors read docs vertically — find the API, copy the signature, leave. Seniors read them laterally — concepts first, then the API, then the edge cases section nobody else opens. The speed difference is not reading speed. It is that the second approach front-loads the confusion.'),
      h(2, 'The three passes'),
      ulist([
        'Orient: read the concepts and architecture pages before touching an API',
        'Extract: find the specific API with full context of what it assumes',
        'Verify: check the edge cases, the changelog, the "common mistakes" section',
      ]),
      p('The first pass feels slow because it does not produce code. It produces a mental map that makes every later lookup nearly free. Skip it and you pay the confusion anyway — just distributed across a week of small, mystifying failures.'),
      h(2, 'Docs are the interface you forgot you were designing to'),
      p('The other half of the skill is writing to the docs as much as reading them — your own READMEs, your internal runbooks. A team whose docs answer the "why" and not just the "what" onboards new members in days instead of months.'),
      quote('The documentation is not a description of the system. It is part of the system.'),
    ],
  },
  {
    title: 'What Slow Craft Taught Me About Shipping Fast',
    slug: 'slow-craft-taught-me-shipping-fast',
    excerpt:
      'A year of learning bookbinding made me a faster engineer — mostly by teaching me when speed is the wrong tool.',
    category: 'Productivity',
    author: 'Sofia Marchetti',
    tags: ['Focus', 'Opinion'],
    viewCount: 1540,
    daysAgo: 10,
    content: [
      p('Last year I took up bookbinding — deliberately, almost defiantly analog. Folding signatures, sewing spines, waiting overnight for glue to dry. The slowest craft imaginable, learned during the fastest year of my career.'),
      p('What surprised me is how much of it transferred.'),
      h(2, 'Preparation is the speed'),
      p('In binding, the fold either happens on scored paper or it cracks. There is no rushing the score — only skipping it and paying later. Software works identically: the hour spent understanding the problem is not overhead before the fast part. It is the fast part. Every "quick" implementation of a misunderstood requirement is a fold on unscored paper.'),
      h(2, 'Some steps have a minimum time'),
      ulist([
        'Glue dries when glue dries — CI runs when CI runs',
        'A wobbly first signature cannot be fixed in the third — architecture set in haste stays hasty',
        'The press does not care about your deadline — neither does the outage',
      ]),
      h(2, 'Knowing where slowness lives'),
      p('The real skill the bench taught is reading a task for where time is hiding. Binding a book is slow overall but fast in moments — the cut, the stitch — and those moments deserve full speed. Shipping code is the same: type fast, deploy fast, but think slowly. The professionals are not uniformly fast. They are fast exactly where slowness buys nothing.'),
      quote('Speed is knowing which parts of the work refuse to be hurried, and refusing to hurry them.'),
    ],
  },
  {
    title: 'The Newsletter Is the New Homepage',
    slug: 'newsletter-is-the-new-homepage',
    excerpt:
      'Homepages used to be where relationships with readers lived. Then feeds took the traffic, and the inbox quietly took the relationship.',
    category: 'Culture',
    author: 'Daniel Okafor',
    tags: ['Opinion', 'Web Development'],
    viewCount: 1105,
    daysAgo: 13,
    content: [
      p('There was a decade when a publication\'s homepage was sacred real estate — argued over, redesigned yearly, the front door every reader walked through. Then the feed ate the front door. Today, most readers arrive at an article sideways, from a link, and leave without ever seeing the publication\'s name in context.'),
      p('But something interesting happened to the relationship that used to live on the homepage: it moved to the inbox.'),
      h(2, 'The inbox is unmediated'),
      p('A subscription feed is an algorithm\'s guess at what you want. An inbox is a list you built. The newsletter revived an old editorial contract — I write, you chose to receive — that the social web spent fifteen years dissolving. Publishers noticed: the metrics that matter now are not pageviews but opens, replies, and paid conversions. Relationships, measured honestly.'),
      h(2, 'What this means for how sites get built'),
      p('The homepage has not died — it has been demoted to a landing page for first-time visitors. The actual product for returning readers is increasingly the email: the article is the reason they subscribed, but the inbox is where the habit lives. Publications that understand this design backward from the subscription moment, not forward from the homepage.'),
      quote('The feed decides what gets seen. The inbox decides what gets trusted.'),
      p('The irony is almost too neat: the oldest mass medium on the internet outlasted every feed built to replace it. Not because email is better technology — because it is the only channel where the reader, not the platform, owns the address.'),
    ],
  },
  {
    title: 'Empty States Are Where Products Tell the Truth',
    slug: 'empty-states-where-products-tell-truth',
    excerpt:
      'Any product looks good in the demo with perfect data. The empty state — day one, nothing entered yet — is where the product shows what it actually thinks of you.',
    category: 'Design',
    author: 'Daniel Okafor',
    tags: ['Typography', 'Opinion', 'Tutorial'],
    viewCount: 764,
    daysAgo: 18,
    content: [
      p('Demos are lies by omission. Every screenshot shows the product at its best: full dashboards, populated lists, a feed that already knows what you like. Nobody demos day one — the blank screen a real user actually meets first.'),
      p('That blank screen is the empty state, and it is the most honest user interface a product owns.'),
      h(2, 'The three jobs of an empty state'),
      p('A good empty state does exactly three things, in order: it orients (what is this space for?), it motivates (why should I fill it?), and it directs (what is the one action that fills it?). Most empty states do none — a grey illustration and the word "empty." That is not a UI. That is an apology.'),
      ulist([
        'Orient: "Your reading list lives here"',
        'Motivate: "Save articles to read later — they sync everywhere"',
        'Direct: one button, "Browse articles", nothing else competing',
      ]),
      h(2, 'Write it like onboarding, because it is'),
      p('The empty state is the only screen guaranteed to be seen by every single user — at a moment when they have invested nothing and will leave for nothing. Copy that treats that moment as a first impression converts. Copy that treats it as a corner case loses the user before the product even had a chance.'),
      quote('The product that cannot explain itself on a blank screen cannot explain itself, period.'),
      p('Next design review, skip the polished screens. Open the app with a fresh account and look at what the product says when it has nothing to show. That is the real voice of the thing.'),
    ],
  },
];

async function seedExtraArticles(strapi: Core.Strapi) {
  const findBySlug = async (uid: any, slug: string) =>
    strapi.documents(uid).findFirst({ filters: { slug } });

  for (const def of EXTRA_ARTICLES) {
    const exists = await strapi.db
      .query('api::article.article')
      .findOne({ where: { slug: def.slug } });
    if (exists) continue;

    const [author, category] = await Promise.all([
      findBySlug('api::author.author', def.author.toLowerCase().replace(/\s+/g, '-')),
      findBySlug('api::category.category', def.category.toLowerCase()),
    ]);
    const tagDocs = (
      await Promise.all(
        def.tags.map((name) =>
          findBySlug('api::tag.tag', name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        )
      )
    ).filter(Boolean);

    const image = await uploadImage(strapi, `article-${def.slug}`, def.title);
    const thumb = await uploadImage(strapi, `thumb-${def.slug}`, def.title, 640, 420);

    await strapi.documents('api::article.article').create({
      data: {
        title: def.title,
        slug: def.slug,
        excerpt: def.excerpt,
        content: def.content,
        featuredImage: image.id,
        thumbnailImage: thumb.id,
        ogImage: image.id,
        author: author?.documentId,
        category: category?.documentId,
        tags: tagDocs.map((t: any) => t.documentId),
        featured: def.featured ?? false,
        publishedDate: new Date(Date.now() - def.daysAgo * 86400000),
        viewCount: def.viewCount,
        seoTitle: `${def.title} — Meridian`,
        seoDescription:
          def.excerpt.length > 160
            ? def.excerpt.slice(0, 157).trimEnd() + '…'
            : def.excerpt,
      },
      status: 'published',
    });
    strapi.log.info(`[seed] Added extra article: ${def.slug}`);
  }
}

