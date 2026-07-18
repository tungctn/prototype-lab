import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class SessionEventsService {
  private readonly subjects = new Map<string, Subject<MessageEvent>>();

  getEvents(sessionId: string): Observable<MessageEvent> {
    return this.getSubject(sessionId).asObservable();
  }

  emit(sessionId: string, event: string, data: Record<string, unknown>): void {
    this.getSubject(sessionId).next({
      type: event,
      data,
    });
  }

  private getSubject(sessionId: string): Subject<MessageEvent> {
    let subject = this.subjects.get(sessionId);

    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.subjects.set(sessionId, subject);
    }

    return subject;
  }
}
