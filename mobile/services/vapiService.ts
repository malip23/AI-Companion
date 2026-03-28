import Vapi from '@vapi-ai/react-native';
import { CallState, VapiMessage } from '../types';

const publicKey = process.env.EXPO_PUBLIC_VAPI_KEY ?? '';
const assistantId = process.env.EXPO_PUBLIC_ASSISTANT_ID ?? '';

class VapiService {
  private vapi: Vapi;
  private callState: CallState = 'idle';

  private onCallStartCallbacks: Array<() => void> = [];
  private onCallEndCallbacks: Array<() => void> = [];
  private onMessageCallbacks: Array<(msg: VapiMessage) => void> = [];
  private onErrorCallbacks: Array<(err: unknown) => void> = [];

  constructor() {
    this.vapi = new Vapi(publicKey);

    this.vapi.on('call-start', () => {
      this.callState = 'in-call';
      this.onCallStartCallbacks.forEach(cb => cb());
    });

    this.vapi.on('call-end', () => {
      this.callState = 'idle';
      this.onCallEndCallbacks.forEach(cb => cb());
    });

    this.vapi.on('message', (message: unknown) => {
      this.onMessageCallbacks.forEach(cb => cb(message as VapiMessage));
    });

    this.vapi.on('error', (err: unknown) => {
      this.callState = 'idle';
      this.onErrorCallbacks.forEach(cb => cb(err));
    });
  }

  async startCall(overrides?: object): Promise<void> {
    if (this.callState !== 'idle') return;
    this.callState = 'connecting';
    try {
      await this.vapi.start(assistantId, overrides);
    } catch (err) {
      this.callState = 'idle';
      this.onErrorCallbacks.forEach(cb => cb(err));
    }
  }

  endCall(): void {
    this.vapi.stop();
    this.callState = 'ending';
  }

  getCallState(): CallState {
    return this.callState;
  }

  onCallStart(cb: () => void): void {
    this.onCallStartCallbacks.push(cb);
  }

  onCallEnd(cb: () => void): void {
    this.onCallEndCallbacks.push(cb);
  }

  onMessage(cb: (msg: VapiMessage) => void): void {
    this.onMessageCallbacks.push(cb);
  }

  onError(cb: (err: unknown) => void): void {
    this.onErrorCallbacks.push(cb);
  }
}

export const vapiService = new VapiService();
