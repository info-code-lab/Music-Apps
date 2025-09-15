import type { Response } from "express";

export interface ProgressUpdate {
  type: 'progress' | 'status' | 'error' | 'complete';
  message: string;
  progress?: number; // 0-100
  stage?: string;
}

class ProgressEmitter {
  private connections = new Map<string, Response>();
  private cancelledSessions = new Set<string>();
  private activeSessions = new Set<string>();

  addConnection(sessionId: string, res: Response) {
    this.connections.set(sessionId, res);
    this.activeSessions.add(sessionId);
    
    // Send initial connection confirmation
    this.emit(sessionId, {
      type: 'status',
      message: 'Connected to progress stream',
      progress: 0,
      stage: 'connected'
    });
  }

  removeConnection(sessionId: string) {
    this.connections.delete(sessionId);
    this.activeSessions.delete(sessionId);
  }

  cancelSession(sessionId: string) {
    this.cancelledSessions.add(sessionId);
    this.emit(sessionId, {
      type: 'error',
      message: 'Upload cancelled by user',
      progress: 0,
      stage: 'cancelled'
    });
    this.removeConnection(sessionId);
    
    // Clean up cancelled session state after a short delay
    setTimeout(() => {
      this.cleanupSession(sessionId);
    }, 1000);
  }

  isCancelled(sessionId: string): boolean {
    return this.cancelledSessions.has(sessionId);
  }

  cleanupSession(sessionId: string) {
    this.removeConnection(sessionId);
    this.cancelledSessions.delete(sessionId);
    this.activeSessions.delete(sessionId);
  }

  getUploadStatistics() {
    return {
      processing: this.activeSessions.size,
      activeConnections: this.connections.size,
      cancelledSessions: this.cancelledSessions.size
    };
  }

  emit(sessionId: string, update: ProgressUpdate) {
    const connection = this.connections.get(sessionId);
    if (connection && !connection.destroyed) {
      try {
        connection.write(`data: ${JSON.stringify(update)}\n\n`);
      } catch (error) {
        console.error('Error emitting progress:', error);
        this.connections.delete(sessionId);
      }
    }
  }

  emitError(sessionId: string, error: string) {
    this.emit(sessionId, {
      type: 'error',
      message: error,
      progress: 0,
      stage: 'error'
    });
  }

  emitComplete(sessionId: string, message: string = 'Upload completed successfully') {
    this.emit(sessionId, {
      type: 'complete',
      message,
      progress: 100,
      stage: 'complete'
    });
    
    // Clean up connection after a delay
    setTimeout(() => {
      this.cleanupSession(sessionId);
    }, 1000);
  }
}

export const progressEmitter = new ProgressEmitter();