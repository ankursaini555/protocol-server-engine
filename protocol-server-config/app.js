const $RefParser = require("json-schema-ref-parser");
const fs = require("fs");

const indexYamlPath = "./configs/index.yaml";
const outputFolderPath = "./build";
const argsList = ["trv", "fis", "nts" , "igm"];

async function baseYMLFile(file) {
  try {
    const schema = await $RefParser.dereference(file);
    return schema;
  } catch (error) {
    console.error("Error parsing schema:", error);
  }
}

function outputBuild(outputPath, flow) {
  fs.writeFileSync(
    `${outputFolderPath}/${outputPath}`,
    JSON.stringify(flow),
    "utf8"
  );
}

// driver
(async function driver() {
  const args = process.argv[2];
  let config = await baseYMLFile(indexYamlPath);
  config = config?.configs;
  if (!args) {
    // run all flows
    let path = { flows: [] };
    for (const flow of config) {
      path.flows.push(flow.path);
    }
    outputBuild("build.json", path);
  } else {
    if (!argsList.includes(args)) {
      console.error(`
        "${args}" not a valid parameter.
        Possible valid parameter include: ${argsList}
        `);
      return;
    }

    // run only specific flow
    const flow = config.find((element) => args === element.domain);
    outputBuild(flow.filename, flow.path);
  }
})();
