export default interface cacheInterface {
  // constructor() {}
  // abstract get(key: string | undefined): any;
  // abstract set(key: string | undefined): any;
  get(key?: string | undefined): any;
  set(uniqueIdentifier: string, data: any, ttl: any): void;
}
