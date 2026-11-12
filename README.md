# Job Simulations

A collection of virtual job simulations I complete on [Forage](https://www.theforage.com/) to practice real-world engineering and technology tasks. Each simulation lives in its own folder, covering the scenario, the approach, and the key technical decisions.

## Simulations

| # | Simulation | Company | Focus | Status |
|---|---|---|---|---|
| 1 | [Technology Job Simulation](./deloitte-technology) | Deloitte Australia | Python, JSON data transformation | Completed |
| 2 | [Modify an Existing .NET Backend](./commonwealth-bank-dotnet) | Commonwealth Bank | C#, .NET 6, MongoDB, REST API | Completed |
| 3 | _Coming soon_ | - | - | Planned |

> This table is updated as each simulation is completed.

## Repository structure

```
.
├── deloitte-technology/        # Simulation 1: IIoT telemetry data unifier
│   ├── main.py
│   ├── data-1.json
│   ├── data-2.json
│   ├── data-result.json
│   └── README.md
├── commonwealth-bank-dotnet/   # Simulation 2: rSERVER (.NET backend)
│   ├── CommBank-Server/
│   ├── CommBank.Tests/
│   └── goals-response.json
└── README.md
```

## Simulation 1: Deloitte Australia, Technology

**Task 1 (Coding): IIoT Telemetry Data Unifier.** See the [simulation page](https://www.theforage.com/simulations/Deloitte%20Australia/technology-fz0w) on Forage.

### Scenario

Daikibo Industrials, a global heavy-machinery manufacturer headquartered in Tokyo, is integrating Industrial IoT (IIoT) devices into its factories. Half of the infrastructure streams telemetry in one JSON format, the other half in another. The task is to write a converter that turns both formats into a single unified format.

### What it does

`main.py` implements two functions:

| Function | Input | Notes |
|---|---|---|
| `convertFromFormat1(jsonObject)` | Format 1 message | Timestamp is already in milliseconds; `location` is a `/`-separated string that gets split into `country`, `city`, `area`, `factory`, `section`. |
| `convertFromFormat2(jsonObject)` | Format 2 message | Timestamp is ISO 8601 (UTC) and is converted to milliseconds since epoch; device and location fields are re-nested into the unified shape. |

Both functions return an object identical to `data-result.json`:

```json
{
  "deviceID": "...",
  "deviceType": "...",
  "timestamp": 1624871100000,
  "location": {
    "country": "...",
    "city": "...",
    "area": "...",
    "factory": "...",
    "section": "..."
  },
  "data": {
    "status": "...",
    "temperature": 0
  }
}
```

### Run

Requires Python 3 (standard library only, no dependencies).

```bash
cd deloitte-technology
python main.py
```

A successful run reports that all unit tests passed.

### Key decisions

- **Timestamp conversion**: ISO 8601 UTC strings are parsed with `datetime` and converted with integer arithmetic against the Unix epoch, which avoids floating-point rounding errors on the milliseconds.
- **Standard library only**: `json`, `datetime`, and `unittest`.
- **Single shared target shape**: both converters return the same structure, so downstream consumers never need to know which format a device used.

## Simulation 2: Commonwealth Bank, Modify an Existing .NET Backend

Extends an existing .NET 6 backend (rSERVER, based on [fencer-so/commbank-server](https://github.com/fencer-so/commbank-server)) to support icons on financial goals. The code lives in [`commonwealth-bank-dotnet/`](./commonwealth-bank-dotnet).

### What I did

- Connected the server to a MongoDB Atlas cluster and seeded the `CommBank` database (`Accounts`, `Goals`, `Tags`, `Transactions`, `Users`).
- Verified the baseline `GET /api/Goal` response with Postman (200 OK, no `icon` field).
- Added an optional `Icon` string property to the `Goal` model.
- Added an `Icon` value to each goal document and verified that `GET /api/Goal` now returns `icon` for every goal. The response is saved in [`goals-response.json`](./commonwealth-bank-dotnet/goals-response.json).

### Key decisions

- **Nullable `string? Icon`**: the field is optional, so existing goals without an icon still deserialize and return `"icon": null` instead of failing.
- **Secrets kept out of version control**: the MongoDB connection string lives in `Secrets.json`, which is listed in `.gitignore` and never committed.

## Author

**Bryan Torisi Siagian** ([@bryansiagian](https://github.com/bryansiagian))

## Disclaimer

This repository contains my work for educational virtual job simulations hosted on Forage. It is not affiliated with or endorsed by any of the companies mentioned. All scenarios, company names (e.g. "Daikibo Industrials"), and sample data are fictional and provided by the respective simulations. Third-party starter code remains the property of its original authors.