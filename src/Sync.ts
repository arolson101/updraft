///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>

namespace Updraft {
  export interface FindChangesOptions {
    minSyncId: number;
    maxSyncId: number;
    limit: number;
    process(batch: number, changes: TableChange<any, any>[]): Promise<any>;
    complete(batchCount: number, success: boolean): Promise<any>;
  }
  
  export interface StoreSync {
    syncId: number;
    getLocal(key: string): any;
    setLocal(key: string, value: any): Promise<any>;
    findChanges(params: FindChangesOptions): Promise<any>;
    addFromSource(changes: TableChange<any, any>[], source: string): Promise<any>;
  }
  
  export interface SyncProvider {
    onOpened(filename: string, store: StoreSync): any;
    onAdded(): any;
  }
  
  export interface SyncProviderCollection {
    [name: string]: SyncProvider;
  }
}
