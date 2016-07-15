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

  export interface Store2 {
    syncId: number;
    syncKey: string;
    getLocal(key: string): any;
    setLocal(key: string, value: any): Promise<any>;
    findChanges(params: FindChangesOptions): Promise<any>;
    addFromSource(changes: TableChange<any, any>[], source: string): Promise<any>;
  }

  export interface SyncProvider {
    getStores(): Promise<string[]>;
    open(storeName: string, store: Store2): SyncConnection;
  }

  export interface SyncConnection {
    onOpened(): any;
    onChanged(syncId: number): any;
  }
}
