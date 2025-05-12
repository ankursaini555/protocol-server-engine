# Introduction

The protocol server handles the transaction with gateway and NP. It also used for header creation/validation, schema validation and attribute validation.

# Repository Structure

- src/
- public/
- .env
- .env-sample-buyer
- .env-sample-seller
- .env-sample-both
- Readme

# Change Log

    This is the version 0.0.1 of the protocol server

# Contribution

Contributions can be made using the following branching structure:

```
    Branches: master -> Integ -> feat/fix/feature
```

# Dependency

- ngrok (for local devlopment)

# Pre-requisite

- git
- npm
- Node.js

# Submodules intialization

- Initialize submodules

```
git submodule
```

- Updates submodules to the specific commit that is recorded in the main repository’s current commit

```
git submodule update
```

- Updates the submodule to the latest commit on the branch specified in the .gitmodules file.

```
git submodule update --remote --merge
```

# Configuration

The protcol server engine depends on configs to run. Different configs can be used to run buyer mock enigne for diffenent use cases.

protcol server engine can consume these configs in 2 differnt ways

## Local configs

- To use the configs from local, the config repo is used as a submodule inside the protcol server engine repo and the configs are imported by the protcol server engine.

- First initialize the submodule.

Follow initialization of submodule.

- Change the following env varaibales

```
    LOAD_LOCAL_CONFIG = true
    CONFIG_FILE_NAME = "fis_build.json"
```

- LOAD_LOCAL_CONFIG acts as a boolean flag and CONFIG_FILE_NAME can be found inside the config submodule's build folder.

## Github configs.

- To use github configs, the url of the raw file with configs is porvided to the protcol server engine, and it fetches the data from it.

- Change the folllowing env vaiables.

```
    LOAD_LOCAL_CONFIG = false
    CONFIG_URL = "https://raw.githubusercontent.com/ONDC-Official/buyer-mock-config/master/build/fis_build.json"
```

- LOAD_LOCAL_CONFIG acts as a boolean flag

- The CONFIG_URL can be found by navigating to the file containing the config file inside build folder in the github repo.

- Click the raw button.

<img width="720" alt="Screenshot 2024-09-13 at 8 35 08 AM" src="https://github.com/user-attachments/assets/42f0606f-9b2c-47fb-b928-73fcb45b85ba">

- Now copy the url of the raw file.

# How to run - local

- Install dependencies

```
npm i
```

- Create a .env file with the provided .env-sample file
- Run the application

```
npm run dev
```
