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
    listFiles(dir: string): Promise<FileInfo[]>;
    readFile(path: string): Promise<string>;
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
        const stores = files.filter((info: FileInfo) => info.size > 0).map(info => info.name);
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
    key: string;
    source: string;
    private index: IndexContents; 

    constructor(storeName: string, store: Store2, options: SyncProviderFSOptions) {
      this.storeName = storeName;
      this.store = store;
      this.options = options;
    }

    constructPath(basename: string, batch: number): string {
      return basename;
    }
    
    private getKeyName(): string {
      return this.options.name + "_key";
    }
    
    async init(storeName: string, store: Store2) {
      const { listFiles } = this.options;
      this.storeName = storeName;
      this.store = store;
      const files = await listFiles(this.storeName);
      await this.loadIndex(files);
      await this.ingestChanges(files);
    }
    
    private async loadIndex(files: FileInfo[]) {
      const { readFile, pathCombine } = this.options;
      let indexText: string;
      if (files.find(f => f.name === INDEX_FILENAME)) {
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
    
    private async ingestChanges(files: FileInfo[]) {
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
    
    saveChanges(basename: string, store: Store2) {
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

    writeChange(basename: string, batch: number, data: string) {

    }
    
    loadChanges(data: string): Promise<any> {
      let i = this.options.decrypt(this.key, data);
      i = this.options.decompress(i);
      let changes: TableChange<any, any>[] = fromText(i);
      return this.store.addFromSource(changes, this.source);
    }

    onOpened(): any {}
    onChanged(): any {}
  }
  
  class DropboxSyncProvider extends SyncProviderFS {
    constructor(user: string, password: string) {
      let params: SyncProviderFSOptions = {
        name: "dropbox",

        generateKey: () => "generatedKey",
        encrypt: (key: string, data: string): string => data,
        decrypt: (key: string, data: string): string => data,

        compress: (data: string): string => data,
        decompress: (data: string): string => data,
      
        pathCombine: (...components: string[]): string => components.join("/"),
        listFiles: (dir: string): Promise<FileInfo[]> => Promise.resolve([]),
        readFile: (path: string): Promise<string> => Promise.resolve(""),
        writeFile: (path: string, data: string): Promise<any> => Promise.resolve(),
      };

      super(params);
    }
  }
  
  function test() {
    let dsp = new DropboxSyncProvider("username", "password");
  }
}
