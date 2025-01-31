import type { SnackTransport, SnackTransportMessage, SnackTransportEvent } from 'snack-sdk';

declare const self: WorkerGlobalScope;

// @ts-ignore
self.window = self; // Needed for pubnub to work

const {
  createSnackPubTransport,
  createSnackPubOnlyTransport,
  createTransport,
  ConnectionMetricsEmitter,
} = require('snack-sdk');

let transport: SnackTransport | undefined = undefined;
const transportCallback = (event: SnackTransportEvent) => postMessage(event);

onmessage = (event) => {
  if (event.data.type === 'init') {
    transport = transportFactory(event.data.testTransport, event.data.data);
    // @ts-ignore
    transport.addEventListener('message', transportCallback);
  } else if (transport) {
    const message: SnackTransportMessage = event.data as any;
    transport.postMessage(message);
    if (message.type === 'stop') {
      transport.removeEventListener('message', transportCallback);
      transport = undefined;
      close();
    }
  }
};

ConnectionMetricsEmitter.setUpdateListener((event: object) => {
  postMessage({ type: 'transportConnectionUpdates', payload: event });
});

function transportFactory(testTransport: string, data: any) {
  if (testTransport === 'snackpub') {
    return createSnackPubTransport(data);
  }
  if (testTransport === 'snackpubOnly') {
    return createSnackPubOnlyTransport(data);
  }
  return createTransport(data);
}
