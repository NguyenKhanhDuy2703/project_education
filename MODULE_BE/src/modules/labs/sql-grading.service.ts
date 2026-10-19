import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { SqlGradeRequest, SqlGradeResult, SqlWorkerReply } from './domain/sql-grading.types';

@Injectable()
export class SqlGradingService {
  private readonly logger = new Logger(SqlGradingService.name);

  async grade(request: SqlGradeRequest): Promise<SqlGradeResult> {
    const timeoutMs = Math.min(Math.max(request.config.timeoutMs || 3000, 500), 10000);
    const worker = new Worker(join(__dirname, 'sql-grading.worker.js'), { workerData: request });

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker.terminate();
        callback();
      };
      const timer = setTimeout(() => finish(() => resolve({
        status: 'failed',
        timeMs: timeoutMs,
        testLogs: `Execution exceeded the ${timeoutMs}ms grading limit.`,
      })), timeoutMs);

      worker.once('message', (reply: SqlWorkerReply) => finish(() => {
        if (reply.ok) {
          this.logger.log(`SQL grading completed: status=${reply.result.status} timeMs=${reply.result.timeMs}`);
          resolve(reply.result);
        }
        else reject(new ServiceUnavailableException('error' in reply ? reply.error : 'SQL grader failed.'));
      }));
      worker.once('error', (error) => finish(() => reject(
        new ServiceUnavailableException(`SQL grader unavailable: ${error.message}`),
      )));
      worker.once('exit', (code) => {
        if (!settled && code !== 0) finish(() => reject(
          new ServiceUnavailableException('SQL grader stopped unexpectedly.'),
        ));
      });
    });
  }
}
