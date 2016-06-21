///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>
///<reference path="./Sync.ts"/>


/*
Filesystem structure:
  root (empty string)
    <store>/ - updraft store name
      index.dat - information about the store & encryption key
      <source name>/ (unique device name)
        <timestamp>.dat - changes

index.dat:
  encryption key, encrypted with GUID, requires a connected device to read
*/


namespace Updraft {

  export interface FileInfo {
    name: string;
    directory: boolean;
    size: number;
  }

  export interface ReadFileResult {
    exists: boolean;
    contents?: string;
  }

  const INDEX_FILENAME = "index.dat";

  interface IndexContents {
    key: string;
  }

  export interface EncryptedInfo {
    mode: string;
    iv: string;
    cipher: string;
  }

  type ChangeFile = TableChange<any, any>[];

  export interface SyncProviderFSOptions {
    name: string;

    // crypto
    generateKey(): string;
    encrypt(key: string, data: string): EncryptedInfo;
    decrypt(key: string, data: EncryptedInfo): string;

    // compression
    compress(data: string): string;
    decompress(data: string): string;

    // filesystem
    pathCombine(...components: string[]): string;
    listFiles(dir: string): Promise<FileInfo[]>;
    readFile(path: string): Promise<ReadFileResult>;
    writeFile(path: string, data: string): Promise<any>;
  }

  export class SyncProviderFS implements SyncProvider {
    options: SyncProviderFSOptions;

    constructor(options: SyncProviderFSOptions) {
      this.options = options;
    }

    getStores(): Promise<string[]> {
      return this.options.listFiles("")
      .then(files => {
        const stores = files
          .filter((info: FileInfo) => info.size > 0)
          .map(info => info.name)
          ;
        return Promise.resolve(stores);
      });
    }

    open(storeName: string, store: Store2): SyncConnection {
      return new SyncConnectionFS(storeName, store, this.options);
    }
  }


  export class SyncConnectionFS implements SyncConnection {
    storeName: string;
    store: Store2;
    options: SyncProviderFSOptions;
    source: string;
    private index: IndexContents;

    constructor(storeName: string, store: Store2, options: SyncProviderFSOptions) {
      this.storeName = storeName;
      this.store = store;
      this.options = options;
    }

    start(): Promise<any> {
      return this.readOrCreateIndex()
        .then(() => this.options.listFiles(this.storeName))
        .then((files) => this.ingestChanges(files))
      ;
    }

    private encodeFile<T>(key: string, data: T): string {
      const { encrypt, compress } = this.options;
      const dataAsText = toText(data);
      const compressed = compress(dataAsText);
      const encrypted = encrypt(key, compressed);
      return toText(encrypted);
    }

    private decodeFile<T>(key: string, data: string): T {
      const { decrypt, decompress } = this.options;
      const info: EncryptedInfo = fromText(data);
      const decrypted = decrypt(key, info);
      const decompressed = decompress(decrypted);
      return fromText(decompressed);
    }

    private readOrCreateIndex(): Promise<any> {
      const { pathCombine, readFile, writeFile, generateKey } = this.options;
      const indexPath = pathCombine(this.storeName, INDEX_FILENAME);
      return readFile(indexPath)
      .then(indexFile => {
        if (indexFile.exists) {
          this.index = this.decodeFile<IndexContents>(this.store.syncKey, indexFile.contents);
          return Promise.resolve();
        }
        else {
          const index: IndexContents = {
            key: generateKey()
          };
          const data = this.encodeFile(this.store.syncKey, index);
          return writeFile(indexPath, data)
            .then(() => {
              this.index = index;
              return Promise.resolve();
            })
          ;
        }
      });
    }

    private ingestChanges(files: FileInfo[]) {
      // find last ingested change
    }

    private ingestFile(path: string): Promise<any> {
      const { readFile, decrypt, decompress } = this.options;
      return readFile(path)
      .then((file) => {
        if (file.exists) {
          let changes = this.decodeFile<ChangeFile>(this.index.key, file.contents);
          return this.store.addFromSource(changes, this.source);
        }
      });
    }

    saveChanges(basename: string, store: Store2) {
      const { compress, encrypt, pathCombine, writeFile } = this.options;
      const params: FindChangesOptions = {
        minSyncId: 0,
        maxSyncId: 0,
        limit: 1000,
        process: (batch: number, changes: TableChange<any, any>[]): Promise<any> => {
          let path = pathCombine(this.storeName, basename, batch as any);
          const data = this.encodeFile(this.index.key, changes);
          return writeFile(path, data);
        },
        complete: (batchCount: number, success: boolean): Promise<any> => {
          return Promise.resolve();
        }
      };
    }

    onOpened(): any {
      this.start();
    }

    onChanged(): any {}
  }

  class DropboxSyncProvider extends SyncProviderFS {
    constructor(user: string, password: string) {
      let params: SyncProviderFSOptions = {
        name: "dropbox",

        generateKey: () => "generatedKey",
        encrypt: (key: string, data: string): EncryptedInfo => ({mode: "", iv: "", cipher: data}),
        decrypt: (key: string, data: EncryptedInfo): string => data.cipher,

        compress: (data: string): string => data,
        decompress: (data: string): string => data,

        pathCombine: (...components: string[]): string => components.join("/"),
        listFiles: (dir: string): Promise<FileInfo[]> => Promise.resolve([]),
        readFile: (path: string): Promise<ReadFileResult> => Promise.resolve({exists: false}),
        writeFile: (path: string, data: string): Promise<any> => Promise.resolve(),
      };

      super(params);
    }
  }

  function test() {
    let dsp = new DropboxSyncProvider("username", "password");
  }
}
