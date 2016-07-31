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
  encryption key, encrypted with master password


*/


namespace Updraft {

  const INDEX_FILENAME = "_index.dat";
  const FILE_EXT = ".bin";

  interface IndexContents {
    key: string;
  }

  type ChangeFile = TableChange<any, any>[];


  export class SyncProviderFS implements SyncProvider {
    options: SyncProviderFSOptions;

    constructor(options: SyncProviderFSOptions) {
      this.options = options;
    }

    getStores(): Promise<string[]> {
      return this.options.getStores();
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
    actionQueue: Promise<any>;
    lastSyncId: number;
    private index: IndexContents;

    constructor(storeName: string, store: Store2, options: SyncProviderFSOptions) {
      this.storeName = storeName;
      this.store = store;
      this.options = options;
      this.actionQueue = Promise.resolve();
      this.lastSyncId = -1;
    }

    start(): Promise<any> {
      return this.readOrCreateIndex()
        .then(() => this.registerListener())
        .then(() => this.ingestChanges())
        .then(() => this.onChanged(this.store.syncId))
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
      const { makeUri, readFile, beginWrite, generateKey } = this.options;
      const indexPath = makeUri(this.storeName, INDEX_FILENAME);
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
            return this.writeSingleFile(indexPath, data)
              .then(() => {
                this.index = index;
                return Promise.resolve();
              })
            ;
          }
        })
      ;
    }

    private writeSingleFile(path: string, data: string): Promise<any> {
      const { beginWrite } = this.options;
      return beginWrite()
        .then((context: SyncProviderFSWriteContext) => {
          return context.writeFile(path, data)
          .then(() => context.finish())
          ;
        })
      ;
    }

    private registerListener(): Promise<any> {
      return Promise.resolve();
    }

    private ingestChanges(): Promise<any> {
      return Promise.resolve()
        .then(() => this.options.filesForStore(this.storeName))
        .then((allFiles: string[]) => this.store.getUnresolved(allFiles))
        .then((unresolvedUris: string[]) => {
          unresolvedUris.forEach(uri => {
            this.queueAction(() => this.ingestFile(uri));
          });
        })
      ;
    }

    private ingestFile(uri: string): Promise<any> {
      const { readFile, decrypt, decompress } = this.options;
      return readFile(uri)
        .then((file) => {
          if (file.exists) {
            let changes = this.decodeFile<ChangeFile>(this.index.key, file.contents);
            return this.store.addFromSync(changes, uri);
          }
        })
      ;
    }

    private saveChanges(syncId: number): Promise<any> {
      const { compress, encrypt, makeUri, beginWrite } = this.options;
      return beginWrite()
        .then((context: SyncProviderFSWriteContext) => {
          const params: FindChangesOptions = {
            minSyncId: this.lastSyncId,
            maxSyncId: syncId,
            process: (currentSyncId: number, changes: TableChange<any, any>[]): Promise<any> => {
              let path = makeUri(this.storeName, this.store.syncId.toString() + currentSyncId.toString() + FILE_EXT);
              const data = this.encodeFile(this.index.key, changes);
              return context.writeFile(path, data);
            },
            complete: (batchCount: number, success: boolean): Promise<any> => {
              this.lastSyncId = syncId;
              return context.finish();
            }
          };
          return this.store.findChanges(params);
        })
      ;
    }

    onOpened(): any {
      this.start();
    }

    onChanged(syncId: number): any {
      this.queueAction(() => {
        // only run the latest sync, as it will rollup previous syncs
        if (this.store.syncId == syncId) {
          return this.saveChanges(syncId);
        }
      });
    }

    private queueAction(action: () => Promise<any>) {
      this.actionQueue = this.actionQueue.then(action);
    }
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

        makeUri: (storeName: string, fileName: string): string => "dropbox://" + storeName + "/" + fileName,
        getStores: (): Promise<string[]> => Promise.resolve([]),
        filesForStore: (storeName: string): Promise<string[]> => Promise.resolve([]),
        readFile: (path: string): Promise<ReadFileResult> => Promise.resolve({exists: false}),
        beginWrite: (): Promise<SyncProviderFSWriteContext> => Promise.resolve({
          writeFile: (path: string, data: string): Promise<any> => Promise.resolve(),
          finish: (): Promise<any> => Promise.resolve()
        }),
      };

      super(params);
    }
  }

  function test() {
    let dsp = new DropboxSyncProvider("username", "password");
  }
}
