import createZipReadable from 'app/drive/services/download.service/downloadFolder/zipStream';
// import streamSaver from 'streamsaver';
import { loadWritableStreamPonyfill } from 'app/network/download';

type BinaryStream = ReadableStream<Uint8Array>;

export async function binaryStreamToBlob(stream: BinaryStream, mimeType?: string): Promise<Blob> {
  const reader = stream.getReader();
  const slices: Uint8Array[] = [];

  let finish = false;

  while (!finish) {
    const { done, value } = await reader.read();

    if (!done) {
      slices.push(value as Uint8Array);
    }

    finish = done;
  }

  return new Blob(slices, mimeType ? { type: mimeType } : {});
}

export function buildProgressStream(source: BinaryStream, onRead: (readBytes: number) => void): BinaryStream {
  const reader = source.getReader();
  let readBytes = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const status = await reader.read();

      if (status.done) {
        controller.close();
      } else {
        readBytes += (status.value as Uint8Array).length;

        onRead(readBytes);
        controller.enqueue(status.value);
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
}

export function joinReadableBinaryStreams(streams: BinaryStream[]): ReadableStream {
  const streamsCopy = streams.map((s) => s);
  let keepReading = true;

  const flush = () => streamsCopy.forEach((s) => s.cancel());

  const stream = new ReadableStream({
    async pull(controller) {
      if (!keepReading) return flush();

      const downStream = streamsCopy.shift();

      if (!downStream) {
        return controller.close();
      }

      const reader = downStream.getReader();
      let done = false;

      while (!done && keepReading) {
        const status = await reader.read();

        if (!status.done) {
          controller.enqueue(status.value);
        }

        done = status.done;
      }

      reader.releaseLock();
    },
    cancel() {
      keepReading = false;
    },
  });

  return stream;
}

function mergeBuffers(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
  const mergedBuffer = new Uint8Array(buffer1.length + buffer2.length);
  mergedBuffer.set(buffer1);
  mergedBuffer.set(buffer2, buffer1.length);
  return mergedBuffer;
}

/**
 * Given a stream of a file, it will read it and enqueue its parts in chunkSizes
 * @param readable Readable stream
 * @param chunkSize The chunkSize in bytes that we want each chunk to be
 * @returns A readable whose output is chunks of the file of size chunkSize
 */
export function streamFileIntoChunks(
  readable: ReadableStream<Uint8Array>,
  chunkSize: number,
): ReadableStream<Uint8Array> {
  const reader = readable.getReader();
  let buffer = new Uint8Array(0);

  return new ReadableStream({
    async pull(controller) {
      function handleDone() {
        if (buffer.byteLength > 0) {
          controller.enqueue(buffer);
        }
        return controller.close();
      }

      const status = await reader.read();

      if (status.done) return handleDone();

      const chunk = status.value;
      buffer = mergeBuffers(buffer, chunk);

      while (buffer.byteLength < chunkSize) {
        const status = await reader.read();

        if (status.done) return handleDone();

        buffer = mergeBuffers(buffer, status.value);
      }

      controller.enqueue(buffer.slice(0, chunkSize));
      buffer = new Uint8Array(buffer.slice(chunkSize));
    },
  });
}

type FlatFolderZipOpts = {
  abortController?: AbortController;
  progress?: (loadedBytes: number) => void;
};

type AddFileToZipFunction = (name: string, source: ReadableStream<Uint8Array>) => void;
type AddFolderToZipFunction = (name: string) => void;

interface ZipStream {
  addFile: AddFileToZipFunction;
  addFolder: AddFolderToZipFunction;
  stream: ReadableStream<Uint8Array>;
  end: () => void;
}

export class FlatFolderZip {
  private finished!: Promise<void>;
  private zip: ZipStream;
  private abortController?: AbortController;

  constructor(folderName: string, opts: FlatFolderZipOpts) {
    this.zip = createFolderWithFilesWritable();
    this.abortController = opts.abortController;

    const passThrough = opts.progress ? buildProgressStream(this.zip.stream, opts.progress) : this.zip.stream;

    const isFirefox = navigator.userAgent.indexOf('Firefox') != -1;

    if (isFirefox) {
      loadWritableStreamPonyfill().then(() => {
        // streamSaver.WritableStream = window.WritableStream;

        // this.finished = passThrough.pipeTo(streamSaver.createWriteStream(folderName + '.zip'), {
        //   signal: opts.abortController?.signal,
        // });
      });
    } else {
      // this.finished = passThrough.pipeTo(streamSaver.createWriteStream(folderName + '.zip'), {
      //   signal: opts.abortController?.signal,
      // });
    }
  }

  addFile(name: string, source: ReadableStream<Uint8Array>): void {
    if (this.abortController?.signal.aborted) return;

    this.zip.addFile(name, source);
  }

  addFolder(name: string): void {
    if (this.abortController?.signal.aborted) return;

    this.zip.addFolder(name);
  }

  async close(): Promise<void> {
    if (this.abortController?.signal.aborted) return;

    this.zip.end();
    await this.finished;
  }

  abort(): void {
    this.abortController?.abort();
  }
}

function createFolderWithFilesWritable(): ZipStream {
  let controller;

  const zipStream = createZipReadable({
    start(ctrl) {
      controller = ctrl;
    },
  });

  return {
    addFile: (name: string, source: ReadableStream<Uint8Array>): void => {
      controller.enqueue({ name, stream: () => source });
    },
    addFolder: (name: string): void => {
      controller.enqueue({ name, directory: true });
    },
    stream: zipStream,
    end: () => {
      controller.close();
    },
  };
}
