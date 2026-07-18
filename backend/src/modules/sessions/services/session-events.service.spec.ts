import { firstValueFrom } from 'rxjs';
import { SessionEventsService } from './session-events.service';

describe('SessionEventsService', () => {
  it('emits live events for the requested session', async () => {
    const service = new SessionEventsService();
    const eventPromise = firstValueFrom(service.getEvents('session-id'));

    service.emit('session-id', 'current_ready', {
      url: '/prototype/meeting-feature-a/current',
    });

    await expect(eventPromise).resolves.toEqual({
      type: 'current_ready',
      data: {
        url: '/prototype/meeting-feature-a/current',
      },
    });
  });

  it('does not leak events between sessions', async () => {
    const service = new SessionEventsService();
    const receivedEvents: unknown[] = [];
    const subscription = service
      .getEvents('session-a')
      .subscribe((event) => receivedEvents.push(event));

    service.emit('session-b', 'new_ready', {
      url: '/prototype/other/new',
    });

    expect(receivedEvents).toEqual([]);

    subscription.unsubscribe();
  });
});
