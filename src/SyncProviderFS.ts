///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>
///<reference path="./Sync.ts"/>


namespace Updraft {
  export interface SyncProviderFSParams {
    name: string;
    generateKey(): string;
    encrypt(key: string, data: string): string;
    decrypt(key: string, data: string): string;
    compress(data: string): string;
    decompress(data: string): string;
    writeChange(basename: string, batch: number, data: string): Promise<any>;
  }
  
  export class SyncProviderFS implements SyncProvider {
    params: SyncProviderFSParams;

    constructor(params: SyncProviderFSParams) {
      this.params = params;
    }
    
    saveChanges(basename: string, store: StoreSync) {
      const key = "";
      const params: FindChangesParams = {
        minSyncId: 0,
        maxSyncId: 0,
        limit: 1000,
        process: (batch: number, changes: TableChange<any, any>[]): Promise<any> => {
          let o = toText(changes);
          o = this.params.compress(o);
          o = this.params.encrypt(key, o);
          return this.params.writeChange(basename, batch, o);
        },
        complete: (batchCount: number, success: boolean): Promise<any> => {
          return Promise.resolve();
        }
      };
    }
    
    onOpened(name: string, store: StoreSync): any {}
    onAdded(store: StoreSync): any {}
    
  }
}
