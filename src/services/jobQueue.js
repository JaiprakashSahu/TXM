const logger = require('../utils/logger');

/**
 * Lightweight in-memory job queue.
 *
 * Jobs are processed asynchronously via setImmediate / setTimeout.
 * No Redis, no Bull — intentionally simple for a single-process demo.
 *
 * Each job: { id, handler, payload, retries, maxRetries, backoffMs }
 */

const queue = [];
let processing = false;

/**
 * Enqueue a job for background processing.
 * @param {Function} handler  - async (payload) => void
 * @param {object}   payload  - data passed to handler
 * @param {object}   [opts]
 * @param {number}   [opts.maxRetries=3]
 * @param {number}   [opts.baseBackoffMs=1000]
 */
function enqueue(handler, payload, opts = {}) {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    handler,
    payload,
    retries: 0,
    maxRetries: opts.maxRetries ?? 3,
    baseBackoffMs: opts.baseBackoffMs ?? 1000,
  };

  queue.push(job);
  logger.info(`[Queue] Enqueued job ${job.id}`);

  // Kick the worker if idle
  if (!processing) {
    setImmediate(processNext);
  }
}

/**
 * Process the next job in the queue.
 * On failure, re-enqueue with exponential backoff (up to maxRetries).
 */
async function processNext() {
  if (queue.length === 0) {
    processing = false;
    return;
  }

  processing = true;
  const job = queue.shift();

  logger.info(
    `[Queue] Processing job ${job.id} (attempt ${job.retries + 1}/${job.maxRetries + 1})`
  );

  try {
    await job.handler(job.payload);
    logger.info(`[Queue] Job ${job.id} completed`);
  } catch (err) {
    logger.warn(`[Queue] Job ${job.id} failed: ${err.message}`);

    if (job.retries < job.maxRetries) {
      job.retries += 1;
      const delay = job.baseBackoffMs * Math.pow(2, job.retries - 1);

      logger.info(
        `[Queue] Retrying job ${job.id} in ${delay}ms (retry ${job.retries}/${job.maxRetries})`
      );

      setTimeout(() => {
        queue.push(job);
        if (!processing) {
          setImmediate(processNext);
        }
      }, delay);
    } else {
      logger.error(
        `[Queue] Job ${job.id} exhausted all ${job.maxRetries} retries — giving up`
      );
    }
  }

  // Continue draining
  setImmediate(processNext);
}

/**
 * Return queue length (for monitoring/testing).
 */
function pendingCount() {
  return queue.length;
}

module.exports = { enqueue, pendingCount };
