///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>

namespace Updraft {
  export interface FindChangesParams {
    minSyncId: number;
    maxSyncId: number;
    limit: number;
    process(batch: number, changes: TableChange<any, any>[]): Promise<any>;
    complete(batchCount: number, success: boolean): Promise<any>;
  }
  
  export interface StoreSync {
    syncId: number;
    findChanges(params: FindChangesParams): Promise<any>;
  }
  
  export interface SyncProvider {
    onOpened(name: string, store: StoreSync): any;
    onAdded(store: StoreSync): any;
  }
  
  export interface SyncProviderCollection {
    [name: string]: SyncProvider;
  }
}
