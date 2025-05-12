import nodecache from "node-cache";

import cacheInterface from "./cacheinterface";
import {
  fetchAllTransactionsIDs,
  fetchTransactionById,
  upsertTransaction,
} from "./dbServices";
import { parseBoolean } from "./../utils/utils";

const defaultCacheOptions = { stdTTL: 100, checkperiod: 120 };
const USE_DB = parseBoolean(process.env.USE_DB);
class NodeCacheAdapter implements cacheInterface {
  cache: nodecache;
  constructor(options: nodecache.Options) {
    // super();
    this.cache = new nodecache(options);
  }

  async get(key?: string | undefined) {
    if (USE_DB) {
      if (key === undefined || key === "") {
        return await fetchAllTransactionsIDs();
      }
      return await fetchTransactionById(key);
    } else {
      if (key === undefined || key === "") {
        return this.cache.keys();
      }
      return this.cache.get(key);
    }
  }

  async set(uniqueIdentifier: string, data: any, ttl: any) {
    if (USE_DB) {
      await upsertTransaction(data);
    } else {
      this.cache.set(uniqueIdentifier, data, ttl);
    }
  }
}

export const cache = new NodeCacheAdapter(defaultCacheOptions);
