///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>
///<reference path="./Sync.ts"/>


namespace Updraft {
  const INDEX_FILENAME = "index.dat";
  
  interface IndexContents {
    key: string;
  }

  export interface SyncProviderFSOptions {
    name: string;

    // crypto
    generateKey(): string;
    encrypt(key: string, data: string): string;
    decrypt(key: string, data: string): string;

    // compression
    compress(data: string): string;
    decompress(data: string): string;
    
    // filesystem
    pathCombine(...components: string[]): string;
    listFiles(dir: string): Promise<string[]>;
    readFile(path: string): Promise<string>;
    writeFile(path: string, data: string): Promise<boolean>;
  }
  
  export class SyncProviderFS implements SyncProvider {
    private options: SyncProviderFSOptions;
    private storeName: string;
    private store: StoreSync;
    private source: string;
    private index: IndexContents;

    constructor(params: SyncProviderFSOptions) {
      this.options = params;
    }
    
    private constructPath(basename: string, batch: number): string {
      return basename;
    }
    
    private getKeyName(): string {
      return this.options.name + "_key";
    }
    
    async init(storeName: string, store: StoreSync) {
      const { listFiles } = this.options;
      this.storeName = storeName;
      this.store = store;
      const files = await listFiles(this.storeName);
      await this.loadIndex(files);
      await this.ingestChanges(files);
    }
    
    private async loadIndex(files: string[]) {
      const { readFile, pathCombine } = this.options;
      let indexText: string;
      if (files.find(name => name === INDEX_FILENAME)) {
        indexText = await readFile(pathCombine(this.storeName, INDEX_FILENAME));
      }
      else {
        indexText = await this.generateIndex();
      }
      this.index = fromText(indexText);
    }
    
    private async generateIndex() {
      const { pathCombine, generateKey, writeFile } = this.options;
      const path = pathCombine(this.storeName, INDEX_FILENAME);
      const contents: IndexContents = {
        key: generateKey()
      };
      const text = toText(contents);
      await writeFile(path, text);
      return text;
    }
    
    private async ingestChanges(files: string[]) {
      // find last ingested change
    }
    
    private async ingestFile(path: string) {
      const { readFile, decrypt, decompress } = this.options;
      const contents = await readFile(path);
      let i = decrypt(this.index.key, contents);
      i = decompress(i);
      let changes: TableChange<any, any>[] = fromText(i);
      return this.store.addFromSource(changes, this.source);
    }
    
    saveChanges(basename: string, store: StoreSync) {
      const { compress, encrypt, pathCombine, writeFile } = this.options;
      const params: FindChangesOptions = {
        minSyncId: 0,
        maxSyncId: 0,
        limit: 1000,
        process: (batch: number, changes: TableChange<any, any>[]): Promise<any> => {
          let o = toText(changes);
          o = compress(o);
          o = encrypt(this.index.key, o);
          let path = pathCombine(this.storeName, basename, batch as any);
          return writeFile(path, o);
        },
        complete: (batchCount: number, success: boolean): Promise<any> => {
          return Promise.resolve();
        }
      };
    }
    
    onOpened(storeName: string, store: StoreSync): any {
      this.storeName = storeName;
      this.store = store;
      this.source = "";
    }

    onAdded(): any {}
    
  }
}
