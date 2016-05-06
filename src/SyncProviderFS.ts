///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>
///<reference path="./Sync.ts"/>


namespace Updraft {
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
    options: SyncProviderFSOptions;
    storeName: string;
    store: StoreSync;
    key: string;
    source: string;

    constructor(params: SyncProviderFSOptions) {
      this.options = params;
    }
    
    constructPath(basename: string, batch: number): string {
      return basename;
    }
    
    getKeyName(): string {
      return this.options.name + "_key";
    }
    
    init(storeName: string, store: StoreSync): Promise<any> {
      this.storeName = storeName;
      this.store = store;
      this.key = store.getLocal(this.getKeyName());
      let p = Promise.resolve();
      if (!this.key) {
        this.key = this.options.generateKey();
        p = p.then(() => store.setLocal(this.getKeyName(), this.key));
      }
      p = p.then(() => this.options.listFiles(this.storeName))
      .then((files: string[]): any => {
        
      });
      return p;
    }
    
    saveChanges(basename: string, store: StoreSync) {
      const params: FindChangesOptions = {
        minSyncId: 0,
        maxSyncId: 0,
        limit: 1000,
        process: (batch: number, changes: TableChange<any, any>[]): Promise<any> => {
          let o = toText(changes);
          o = this.options.compress(o);
          o = this.options.encrypt(this.key, o);
          return this.options.writeChange(basename, batch, o);
        },
        complete: (batchCount: number, success: boolean): Promise<any> => {
          return Promise.resolve();
        }
      };
    }
    
    loadChanges(data: string): Promise<any> {
      let i = this.options.decrypt(this.key, data);
      i = this.options.decompress(i);
      let changes: TableChange<any, any>[] = fromText(i);
      return this.store.addFromSource(changes, this.source);
    }
    
    onOpened(storeName: string, store: StoreSync): any {
      this.storeName = storeName;
      this.store = store;
      this.key = "";
      this.source = "";
    }

    onAdded(): any {}
    
  }
}
