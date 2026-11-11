# Deloitte Technology Job Simulation: IIoT Telemetry Data Unifier

Solution for **Task 1 (Coding)** of the [Deloitte Australia Technology Job Simulation](https://www.theforage.com/simulations/Deloitte%20Australia/technology-fz0w) on Forage.

## Scenario

Daikibo Industrials, a global heavy-machinery manufacturer headquartered in Tokyo, is integrating Industrial IoT (IIoT) devices into its factories. Half of the infrastructure streams telemetry in one JSON format, the other half in another. The task is to write a converter that turns both formats into a single unified format.

## What this project does

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

## Project structure

```
.
├── main.py            # converters + unit tests
├── data-1.json        # sample message, format 1
├── data-2.json        # sample message, format 2
├── data-result.json   # expected unified output
└── README.md
```

## Run

Requires Python 3 (standard library only, no dependencies).

```bash
python main.py
```

A successful run reports that all unit tests passed.

## Key decisions

- **Timestamp conversion**: ISO 8601 UTC strings are parsed with `datetime` and converted with integer arithmetic against the Unix epoch, which avoids floating-point rounding errors on the milliseconds.
- **Standard library only**: `json`, `datetime`, and `unittest`.
- **Single shared target shape**: both converters return the same structure, so downstream consumers never need to know which format a device used.

## Author

**Bryan Torisi Siagian** ([@bryansiagian](https://github.com/bryansiagian))

## Disclaimer

This repository is my submission for an educational virtual job simulation on Forage. It is not affiliated with or endorsed by Deloitte. The scenario, company ("Daikibo Industrials"), and sample data are fictional and provided by the simulation.
