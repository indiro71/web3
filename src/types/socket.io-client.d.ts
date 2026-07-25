declare module 'socket.io-client' {
  interface SocketOptions {
    path?: string;
    query?: Record<string, string>;
    reconnection?: boolean;
    timeout?: number;
    transports?: string[];
  }

  interface Socket {
    on(event: string, callback: (...args: any[]) => void): Socket;
    removeListener(event: string, callback: (...args: any[]) => void): Socket;
    close(): Socket;
  }

  export default function io(uri: string, options?: SocketOptions): Socket;
}
