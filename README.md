# OCEAn

**The project is still under development. Contents will be added shortly.**

## Description
Welcome to **OCEAn** *(**O**bject-**c**entric **E**mission **An**alysis)*, a web app for carbon emission analysis of [object-centric event logs \(OCELs\)](https://ocel-standard.org/)

The project consists of
- A backend running on Python 3.10, mostly using flask, pandas, pm4py, pydantic and pint,
- A frontend based on Next.js / react.

## Badges

## Visuals

## Installation
The project can either be installed using a unified Docker container, 

### via Docker
**TODO** Docker description

### Backend
Using `pypoetry`, dependencies can be installed with

```console
poetry install
```

Feel free to use any other package manager, see `pyproject.toml` for the full list of dependencies.

When inside the root directory, the API can be started by the command

```console
flask -A backend.index run
```

### Frontend
Using `npm`, when inside `/frontend`, dependencies can be installed with

```console
npm install
```

Feel free to use any other package manager, see `frontend/package.json` for the full list of dependencies.


## Usage
When running on your local machine, the app can be accessed at http://localhost:3000.
To get started, try importing the example event logs contained in `backend/data/event_logs`.


## Support


## Roadmap


## Contributing


## Authors and acknowledgment
Author: Raimund Hensen

This project has been developed for my master's thesis at the [Chair of Process and Data Science \(PADS\)](https://www.pads.rwth-aachen.de) at RWTH Aachen University under the supervision of Nina Graves and Wil van der Aalst.


## License


## Project status
The project is still under development.
