import { PDFParse } from 'pdf-parse';
import { generateBatchEmbeddings } from '../openai/client';
import { insertDocument, checkDocumentExists } from '../supabase/client';
import crypto from 'crypto';

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Split text into chunks for embedding
 * Uses simple sentence-based chunking with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-overlap).join(' ') + ' ' + sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}


/**
 * Process text and store in vector database
 */
export async function processText(
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; chunksProcessed: number }> {
    if (!text || text.trim().length === 0) {
      throw new Error('No text to process');
    }
    const source_hash = crypto.createHash('sha256').update(text).digest('hex');
    const exists = await checkDocumentExists(source_hash);
    if (exists) {
      throw new Error('DUPLICATE_DOCUMENT');
    }
    const chunks = chunkText(text);
    console.log(`[Document Processing] Extracted ${chunks.length} chunks`);

    const embeddings = await generateBatchEmbeddings(chunks);
    const insertPromises = chunks.map((chunk, index) =>
      insertDocument(chunk, embeddings[index], {
        ...metadata,
        source_hash,
        chunkIndex: index,
        totalChunks: chunks.length,
      })
    );
    await Promise.all(insertPromises);
    console.log(`[Document Processing] Stored ${chunks.length} chunks in database`);
    return {
      success: true,
      chunksProcessed: chunks.length,
    };
}

/**
 * Process PDF and store in vector database
 */
export async function processPDFDocument(
  buffer: Buffer,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; chunksProcessed: number }> {
  try {
    const text = await extractTextFromPDF(buffer);
    return processText(text, metadata);
  } catch (error) {
    console.error('PDF processing error:', error);
    throw error;
  }
}
