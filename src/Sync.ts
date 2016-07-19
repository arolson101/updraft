///<reference path="./verify.ts"/>
///<reference path="./Store.ts"/>

namespace Updraft {
  export interface FindChangesOptions {
    minSyncId: number;
    maxSyncId: number;
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

  export interface FileInfo {
    name: string;
    directory: boolean;
    size: number;
  }

  export interface ReadFileResult {
    exists: boolean;
    contents?: string;
  }

  export interface EncryptedInfo {
    mode: string;
    iv: string;
    cipher: string;
  }

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
    beginWrite(): Promise<SyncProviderFSWriteContext>;
  }

  export interface SyncProviderFSWriteContext {
    writeFile(path: string, data: string): Promise<any>;
    finish(): Promise<any>;
  }

}
