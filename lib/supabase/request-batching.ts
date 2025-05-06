/**
 * Request batching utility to optimize Supabase queries
 * This helps reduce the number of separate API calls by batching related requests
 */

import { createClient } from './client';
import { executeWithRetry } from './enhanced-client';

// Configuration
const BATCH_WINDOW_MS = 50; // Time window to collect queries for batching (milliseconds)
const MAX_BATCH_SIZE = 10; // Maximum number of queries in a single batch

// Queue for batching requests
interface BatchedRequest<T> {
  table: string;
  queryFn: (supabase: ReturnType<typeof createClient>) => any;
  resolve: (result: { data: T | null; error: any }) => void;
  reject: (error: any) => void;
}

// Separate queues for different tables to avoid mixing unrelated queries
const batchQueues: Record<string, BatchedRequest<any>[]> = {};
const batchTimeouts: Record<string, NodeJS.Timeout> = {};

/**
 * Add a request to the batch queue and process the batch after a short delay
 * @param table The table being queried
 * @param queryFn Function that executes the Supabase query
 * @returns Promise that resolves with the query result
 */
export function batchRequest<T>(
  table: string,
  queryFn: (supabase: ReturnType<typeof createClient>) => any
): Promise<{ data: T | null; error: any }> {
  return new Promise((resolve, reject) => {
    // Create queue for this table if it doesn't exist
    if (!batchQueues[table]) {
      batchQueues[table] = [];
    }
    
    // Add request to queue
    batchQueues[table].push({
      table,
      queryFn,
      resolve,
      reject
    });
    
    // Clear existing timeout for this table
    if (batchTimeouts[table]) {
      clearTimeout(batchTimeouts[table]);
    }
    
    // Set timeout to process batch
    batchTimeouts[table] = setTimeout(() => {
      processBatch(table);
    }, BATCH_WINDOW_MS);
  });
}

/**
 * Process all requests in the batch queue for a specific table
 * @param table The table to process batched requests for
 */
async function processBatch(table: string) {
  const queue = batchQueues[table] || [];
  
  // Clear queue and timeout
  batchQueues[table] = [];
  batchTimeouts[table] = undefined;
  
  if (queue.length === 0) return;
  
  // Log batch processing
  console.log(`Processing batch of ${queue.length} requests for table: ${table}`);
  
  // If only one request in queue, execute it directly
  if (queue.length === 1) {
    const request = queue[0];
    try {
      const supabase = createClient();
      const result = await executeWithRetry(
        () => request.queryFn(supabase),
        `${table}-single`
      );
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
    return;
  }
  
  // Process requests in batches of MAX_BATCH_SIZE
  for (let i = 0; i < queue.length; i += MAX_BATCH_SIZE) {
    const batchSlice = queue.slice(i, i + MAX_BATCH_SIZE);
    
    try {
      const supabase = createClient();
      
      // Execute all queries in parallel
      const results = await Promise.all(
        batchSlice.map(request => 
          executeWithRetry(
            () => request.queryFn(supabase),
            `${table}-batch-${i}`
          )
        )
      );
      
      // Resolve each request with its result
      batchSlice.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      // If batch fails, reject all requests in this slice
      batchSlice.forEach(request => {
        request.reject(error);
      });
    }
  }
}

/**
 * Batch multiple related queries for the same table
 * @param table The table being queried
 * @param queryBuilders Array of query builder functions
 * @returns Array of query results in the same order
 */
export async function batchTableQueries<T>(
  table: string,
  queryBuilders: Array<(supabase: ReturnType<typeof createClient>) => any>
): Promise<Array<{ data: T | null; error: any }>> {
  try {
    // Execute all queries in parallel using the batch mechanism
    const results = await Promise.all(
      queryBuilders.map(queryFn => batchRequest<T>(table, queryFn))
    );
    
    return results;
  } catch (error) {
    console.error(`Error in batch table queries for ${table}:`, error);
    
    // Return error for all queries
    return queryBuilders.map(() => ({ data: null, error }));
  }
}

/**
 * Specialized function for batching event queries
 * @param eventIds Array of event IDs to fetch
 * @returns Object with event IDs as keys and their data as values
 */
export async function batchEventQueries(eventIds: string[]): Promise<Record<string, any>> {
  try {
    const supabase = createClient();
    
    // Create query builders for each event
    const queryBuilders = eventIds.map(eventId => 
      (client: ReturnType<typeof createClient>) => 
        client.from('events').select('*').eq('id', eventId).single()
    );
    
    // Execute all queries in a batch
    const results = await batchTableQueries('events', queryBuilders);
    
    // Transform results into a map of eventId -> eventData
    return eventIds.reduce((acc: Record<string, any>, eventId, index) => {
      const { data, error } = results[index];
      if (!error && data) {
        acc[eventId] = data;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('Error in batch event queries:', error);
    return {};
  }
}
