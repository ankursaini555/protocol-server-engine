import axios from "axios";
import { parseBoolean } from "../utils/utils";
const SERVER_TYPE = process.env.SERVER_TYPE;
const localConfig: boolean | null = parseBoolean(process.env.localConfig);
import fs from "fs";
import yaml from "yaml";
import path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";

class ConfigLoader {
  config: any;
  constructor() {
    this.config = null;
  }

  async init() {
    try {
      if (localConfig) {
        
        const config = 
        
        yaml.parse(
          // fs.readFileSync(path.join(__dirname, `../../configs/${process.env.localConfigName}.yaml`), "utf8")
          fs.readFileSync(path.join(__dirname, `../../protocol-server-config/configs/igm.yaml`), "utf8")
        );
// @ts-ignore
        
        const schema = await $RefParser.dereference(
                  //@ts-ignore
                  config
          // `protocol-server-config/build/${localConfigFileName}`
        );

        this.config = schema;

        return schema;
      } else {
        const url = process.env.config_url;

        if (!url) {
          throw new Error("Config url not found");
        }

        const response = await axios.get(url);

        if (response.data.version !== process.env.VERSION) {
          throw new Error(
            `Config version mismatch: Config version - ${response.data.version}, App version - ${process.env.VERSION}`
          );
        }

        this.config = response.data;

        return response.data;
      }
    } catch (e: any) {
      throw new Error(e);
    }
  }

  getConfig() {
    return this.config;
  }

  getSchema() {
    return this.config.schema;
  }

  getMapping(configName: string) {
    if (!SERVER_TYPE) {
      throw new Error("SERVER_TYPE not found");
    }
    let mapping = null;

    this.config[SERVER_TYPE].flows?.forEach((flow: any) => {
      if (flow.id === configName) {
        mapping = flow.protocol;
        return;
      }
    });

    return mapping;
  }

  getAttributeConfig(configName: string) {
    try{
      return this.config?.attributes[configName];
    }
    catch(err){
      return false
    }
  }
}

export const configLoader = new ConfigLoader();
