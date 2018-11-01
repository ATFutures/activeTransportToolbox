FROM rocker/r-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    lbzip2 \
    libfftw3-dev \
    libgdal-dev \
    libgeos-dev \
    libgsl0-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libhdf4-alt-dev \
    libhdf5-dev \
    libjq-dev \
    liblwgeom-dev \
    libproj-dev \
    libprotobuf-dev \
    libnetcdf-dev \
    libsqlite3-dev \
    libssl-dev \
    libudunits2-dev \
    netcdf-bin \
    tk-dev \
    unixodbc-dev \
    libv8-dev \
    protobuf-compiler \ 
    git

RUN install2.r stringi
RUN install2.r lubridate

RUN R -e 'install.packages(c("igraph", "sf", "geojsonsf", "stplanr", \
        "devtools", "here", "rbenchmark", "RcppParallel", "osmdata", "sp"), \
        dependencies=T); \
        devtools::install_github("trestletech/plumber")'

RUN git clone https://github.com/ATFutures/dodgr.git

RUN R -e "devtools::load_all('/dodgr', export_all=F)"

RUN R -e 'devtools::install_version("rgeos", version = "0.3-28")'

ADD . /app

EXPOSE 8000

ENTRYPOINT ["R", "-e", "setwd('/app'); \
 plumber::plumb(file.path(here::here(), 'server', 'plumber.R'))$run(host='0.0.0.0',port=8000)"]