# Job Simulations

A collection of virtual job simulations I complete on [Forage](https://www.theforage.com/) to practice real-world engineering and technology tasks. Each simulation lives in its own folder with its own README, covering the scenario, the approach, and the key technical decisions.

## Simulations

| # | Simulation | Company | Focus | Status |
|---|---|---|---|---|
| 1 | [Technology Job Simulation](./deloitte-technology) | Deloitte Australia | Python, JSON data transformation | Completed |
| 2 | _Coming soon_ | - | - | Planned |

> This table is updated as each simulation is completed.

## Repository structure

```
.
├── deloitte-technology/     # Simulation 1: IIoT telemetry data unifier
│   ├── main.py
│   ├── data-1.json
│   ├── data-2.json
│   ├── data-result.json
│   └── README.md
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

## Author

**Bryan Torisi Siagian** ([@bryansiagian](https://github.com/bryansiagian))

## Disclaimer

This repository contains my work for educational virtual job simulations hosted on Forage. It is not affiliated with or endorsed by any of the companies mentioned. All scenarios, company names (e.g. "Daikibo Industrials"), and sample data are fictional and provided by the respective simulations.