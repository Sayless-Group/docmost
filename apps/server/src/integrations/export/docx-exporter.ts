import { Injectable, Logger } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { StorageService } from '../storage/storage.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const HTMLtoDOCX = require('html-to-docx');

const DOCX_OPTIONS = {
  font: 'Calibri',
  fontSize: 24, // 12pt in half-points
  table: { row: { cantSplit: true } },
  header: false,
  footer: false,
  pageNumber: false,
  margins: { top: 1440, right: 1800, bottom: 1440, left: 1800 },
};

@Injectable()
export class DocxExporter {
  private readonly logger = new Logger(DocxExporter.name);

  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly storageService: StorageService,
  ) {}

  // Receives already-built HTML from exportPage() (with title prepended, mentions resolved)
  async convertHtmlToDocx(
    pageHtml: string,
    spaceId: string,
    title: string,
  ): Promise<Buffer> {
    const processed = await this.preProcessHtml(pageHtml, spaceId);
    const wrappedHtml = `<!DOCTYPE html><html><body>${processed}</body></html>`;
    const buffer = await HTMLtoDOCX(wrappedHtml, null, {
      ...DOCX_OPTIONS,
      title,
    });
    return buffer as Buffer;
  }

  // Transforms special TipTap HTML nodes into DOCX-friendly equivalents
  private async preProcessHtml(
    html: string,
    spaceId: string,
  ): Promise<string> {
    // Dynamic import of cheerio to avoid issues with ESM/CJS interop at module load
    const { load } = await import('cheerio');
    const $ = load(html);

    // Inline images: replace /files/... src with base64 data URIs
    const imgEls = $('img[src]').toArray();
    await Promise.all(
      imgEls.map(async (el) => {
        const src = $(el).attr('src') || '';
        const base64 = await this.resolveImageToBase64(src, spaceId);
        if (base64) {
          $(el).attr('src', base64);
        } else {
          // Remove broken images to avoid docx errors
          $(el).remove();
        }
      }),
    );

    // Callout → styled blockquote
    $('[data-type="callout"], .callout').each((_, el) => {
      const icon = $(el).attr('data-icon') || '';
      const inner = $(el).html() || '';
      $(el).replaceWith(
        `<blockquote>${icon ? `<strong>${icon}</strong> ` : ''}${inner}</blockquote>`,
      );
    });

    // Details/summary → blockquote
    $('details').each((_, el) => {
      const summary = $(el).find('summary').text() || '';
      const content = $(el).find('summary').remove().end().html() || '';
      $(el).replaceWith(
        `<blockquote><strong>${summary}</strong>${content}</blockquote>`,
      );
    });

    // Math inline/block → code placeholder
    $('[data-type="mathInline"], .math-inline').each((_, el) => {
      const formula = $(el).text() || $(el).attr('data-latex') || '';
      $(el).replaceWith(`<code>$${formula}$</code>`);
    });
    $('[data-type="mathBlock"], .math-block').each((_, el) => {
      const formula = $(el).text() || $(el).attr('data-latex') || '';
      $(el).replaceWith(`<pre><code>$$\n${formula}\n$$</code></pre>`);
    });

    // Draw.io → placeholder
    $('[data-type="drawio"]').each((_, el) => {
      const title = $(el).attr('title') || $(el).attr('data-title') || 'diagram';
      $(el).replaceWith(`<p>⬜ [Діаграма Draw.io: ${title}]</p>`);
    });

    // Excalidraw → placeholder
    $('[data-type="excalidraw"]').each((_, el) => {
      const title = $(el).attr('title') || $(el).attr('data-title') || 'схема';
      $(el).replaceWith(`<p>⬜ [Excalidraw: ${title}]</p>`);
    });

    // Mermaid code blocks → preserve code + label
    $('pre code[class*="language-mermaid"], pre code.mermaid').each((_, el) => {
      const code = $(el).text();
      $(el)
        .closest('pre')
        .replaceWith(
          `<p>⬜ [Mermaid діаграма]</p><pre><code>${code}</code></pre>`,
        );
    });

    // YouTube / iframe embed → hyperlink
    $('iframe[src], [data-type="youtube"]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      $(el).replaceWith(`<p>▶ <a href="${src}">${src}</a></p>`);
    });

    // Video → link placeholder
    $('video[src], video source').each((_, el) => {
      const src =
        $(el).attr('src') ||
        $(el).find('source').attr('src') ||
        '';
      const name = $(el).attr('data-name') || src.split('/').pop() || 'video';
      $(el).replaceWith(`<p>▶ [Відео: ${name}]</p>`);
    });

    // Attachment nodes (non-image files) → keep as hyperlink text
    // html-to-docx renders <a href> as ExternalHyperlink natively

    return $.html('body').replace(/^<body>/, '').replace(/<\/body>$/, '');
  }

  private async resolveImageToBase64(
    src: string,
    spaceId: string,
  ): Promise<string | null> {
    try {
      // Extract attachmentId from /files/{id}/... or /api/files/{id}/...
      const match = src.match(/\/(?:api\/)?files\/([0-9a-f-]{36})\//i);
      if (!match) return null;

      const attachmentId = match[1];
      const attachment = await this.db
        .selectFrom('attachments')
        .select(['filePath', 'mimeType'])
        .where('id', '=', attachmentId)
        .where('spaceId', '=', spaceId)
        .executeTakeFirst();

      if (!attachment) return null;

      const buffer = await this.storageService.read(attachment.filePath);
      const mime = attachment.mimeType || 'image/png';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch (err) {
      this.logger.debug(`Image resolution failed for src: ${src}`, err);
      return null;
    }
  }
}
