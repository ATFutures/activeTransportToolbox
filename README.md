

## Project
---
The Active Transport Toolbox (ATT) is a showcase of transport data analytics and it is a WHO funded project at [LIDA](https://lida.leeds.ac.uk), University of Leeds. The team are Robin Lovelace, Mark Padgham, Nikée Groot and Layik Hama.

## ATT (prototype)

ATT is developed using R package `plumber` and Flux architecture using ReactJS. It is a Dockerized application which can be used as one container. Currently under development and deployment/production for mass use will be using Docker swarm using a standard http server application such as standard Nginx container. The base image r-rocker/base.

### Deployment at http://35.233.61.182
The deployed instance at above IP is hosted by Google (GCP) and pulls the image hosted at [Dockerhub](https://hub.docker.com/r/layik/att/).

#### Using Docker
To build:

Clone the repo and change directory into it.

then

`sudo docker build --rm -t att .`

run a container 

`sudo docker run --rm -p 8000:8000 att`

visit

localhost:8000 and app should be running.

These docker instructions have been used to deploy at the above IP address (except port being 80 on host).

Container [Watchtower](https://github.com/v2tec/watchtower) pulls the latest as we push to this repo.

#### Using Rscript

```
# Make sure in repo directory
Rscript run.R
```

Should do and app should be running at localhost:8000

#### Using bash
```
# Uses the run.R script
# Make sure run.sh is executable
chmod +x run.sh
# then
./run.sh
```

### API endpoints
R package plumber is Swagger compliant, although it is not in use in this deployment. Currently these endpoints are in use:

> http://35.233.61.182/api/centrality/<quietnessFactor: double>/<roadType>

both optional parameters
> http://35.233.61.182/api/flows/<city>

either 'accra' or 'kahtmandu' as parameters at the moment.

Few other experimental endpoints.

### R package installation
Packages installed when running this repo are:
`c("doghr", "here", "sf", "tmap", "rjson", "geojsonio", "stplanr", "here", "plumber")`

Only those that need instructions will be mentioned in the OS sections below. We will do all we can to add the instructions required to install these pacakges. But this is not the reason why this README is here.

#### Linux

Deb/Ubuntu

`sf` has a few external dependencies mentioned here: https://github.com/r-spatial/sf#ubuntu

`tmap` has instructions for Ubuntu 16, we also were able to install it on 18.04 from these instructions without the need to add the `ppa`s.
https://github.com/mtennekes/tmap/blob/master/ubuntu_16_installation.sh


#### OSX
(Might be outdated) One thing we noticed being different from Unix/Linux OS is the note given on https://cran.r-project.org/bin/macosx/

For OSX with versions which doees not include X11 Quartz by default or > 10.8 (Mountain Lion) it is advised that:
> Note: the use of X11 (including tcltk) requires XQuartz to be installed since it is no longer part of OS X. Always re-install XQuartz when upgrading your macOS to a new major version.

#### Windows
Apologies for lack of instructions here.

## Finally
The codebase here (ATT) not only is reproducible and can be used by anyone, it also lead to a more generic web application framework that can be used by others. It is called www.geoplumber.com
