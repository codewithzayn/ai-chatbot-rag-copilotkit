import Redis from 'ioredis';

// Redis client for semantic caching (server-side only)
// Use local Redis by default if REDIS_URL is not set
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);

interface CacheEntry {
  query: string;
  embedding: number[];
  response: string;
  timestamp: number;
}

/**
 * Generate a cache key from query embedding
 * Uses first 8 dimensions as a simple hash
 */
function generateCacheKey(embedding: number[]): string {
  const hash = embedding
    .slice(0, 8)
    .map(n => Math.round(n * 1000))
    .join('_');
  return `cache:${hash}`;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for semantically similar cached responses
 */
export async function searchSemanticCache(
  queryEmbedding: number[],
  similarityThreshold: number = 0.88
): Promise<string | null> {
  try {
    const keys = await redis.keys('cache:*');
    
    if (keys.length === 0) {
      return null;
    }

    for (const key of keys) {
      const entryJson = await redis.get(key);
      if (!entryJson) continue;

      try {
        const entry = JSON.parse(entryJson) as CacheEntry;
        const similarity = cosineSimilarity(queryEmbedding, entry.embedding);

        if (similarity >= similarityThreshold) {
          console.log(`[Cache HIT] Similarity: ${similarity.toFixed(4)}`);
          return entry.response;
        }
      } catch (parseError) {
        console.warn(`Failed to parse cache entry for key ${key}`, parseError);
        continue;
      }
    }

    console.log('[Cache MISS] No similar queries found');
    return null;
  } catch (error) {
    console.error('Redis cache search error:', error);
    return null;
  }
}

/**
 * Store a response in semantic cache
 */
export async function storeInSemanticCache(
  query: string,
  queryEmbedding: number[],
  response: string,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(queryEmbedding);
    
    const entry: CacheEntry = {
      query,
      embedding: queryEmbedding,
      response,
      timestamp: Date.now(),
    };

    await redis.set(cacheKey, JSON.stringify(entry), 'EX', ttlSeconds);
    console.log(`[Cache STORE] Key: ${cacheKey}`);
  } catch (error) {
    console.error('Redis cache store error:', error);
    throw error;
  }
}
