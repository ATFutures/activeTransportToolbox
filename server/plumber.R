packages <- c("V8", "dodgr", "here", "igraph", "sf", "geojsonio", "stplanr")

if (length(setdiff(packages, rownames(installed.packages()))) > 0) {
  install.packages(setdiff(packages, rownames(installed.packages())),repos='http://cran.us.r-project.org')  
}

lapply(packages, library, character.only = TRUE)

#' from Rds to flow geojson
processRDS <- function(filename) {
  print(sprintf("Loading %s ...", filename))
  f <- readRDS(filename)
  g <- dodgr::dodgr_to_sf (dodgr::merge_directed_flows (f))
  g <- sf::st_sf (g$dat, geometry = g$geoms)
  g <- g[g$flow > (limit = 1e-5 * max (g$flow)), ]
  g <- g[c("highway","flow", "way_id")]
  print("Converting it to json...")
  g_flow_accra_rbgeoms <- geojsonio::geojson_json(g)[[1]]
}

# import shared JS code ---------------------------------------------------

ct <- V8::v8()
ct$source(file.path(here::here(), 'static/src/Shared.js'))
roadTypes = ct$get("global.roadTypes")
roadTypes = roadTypes[roadTypes != ""] #there are some empty ones for JS use.
flow_filenames = ct$get("global.flows")
cities <- ct$get("global.cities")
# load all 8 files into memory --------------------------------------------
flows <- character((length(flow_filenames) * 2))
flow_filenames_cities <- character(length(flows))
skipped <- 'flow_foot_bus_residential.Rds' # TODO: get this in later.
j <- 1
for(c in cities) {
  for(i in 1:length(flow_filenames)) {
    index <- i
    hname <- paste(c, "_", flow_filenames[i], sep = '')
    if(j == 2) index <- index + 4
    flow_filenames_cities[index] <- tolower(hname)
    # 10s or 100s of rows
    flows[index] <- processRDS(file.path(here::here(), "data-intermediate/flows", tolower(c), flow_filenames[i]))
  }
  j <- j + 1
}
#' Lets name each flow
names(flows) <- flow_filenames_cities

# Other loading -----------------------------------------------------------
#' Load required readings into memory
#' Then do calculations on the fly
#' following are for api/centrality endpoint
print("Loading files into memory...")
fname <- file.path(here::here(), "data-intermediate", "roads.geojson")
roads <- st_read(fname)
roads_sn <- stplanr::SpatialLinesNetwork(roads)

# Minnesota data
print("Minnesota data")
trips <- readRDS(file.path(here::here(), "data-intermediate", "minnesota_r_all.Rds"))
minn_geoms <- geojsonio::geojson_json(trips)

#  From https://www.rplumber.io home page 16th May 2018
print(here::here())
print(getwd())
print("Done.")

#' Echo back the input
#' @param msg The message to echo
#' @get /echo
function(msg=""){
  list(msg = paste0("The message is: '", msg, "'"))
}

# Enable CORS -------------------------------------------------------------
#' CORS enabled for now. See docs of plumber
#' for disabling it for any endpoint we want in future
#' https://www.rplumber.io/docs/security.html#cross-origin-resource-sharing-cors
#' @filter cors
cors <- function(res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  plumber::forward()
}


# API endpoints -----------------------------------------------------------
#'
#' @get /api/minn
#' @get /api/minn/
getMinn <- function (res) {
  res$body <- minn_geoms
  return(res)
}

#' @get /api/flows/
#' @get /api/flows
#' @get /api/flows/<city>/
#' @get /api/flows/<city>
#' @get /api/flows/<city>/<flowType>/
#' @get /api/flows/<city>/<flowType>
getFlow <- function(res, limit = 0, city = 'accra', flowType = 'residential_bus') {
  error <- NULL
  cat(city, flowType)
  # TODO: reprocess flows with different limit value
  if(limit > 1) { #not used right now
    error <- paste0("Limit value '", limit, "' is bigger than 1.")
  }
  # sanity checks
  if(!is.element(tolower(city), tolower(cities))) {
    error <- paste0("City: '", city, "' not found.")
  }
  if(!is.element(tolower(flowType), c('bus_activity', 'activity_bus', 'bus_residential', 'residential_bus'))){
    error <- paste0("Flowtype: '", flowType, "' not found.")
  }
  if(!is.null(error)) {
    return(list(error))
  }
  # now all tolower
  res$body <- flows[sprintf("%s_flow_foot_%s.rds", tolower(city), tolower(flowType))]
  return (res)
}

#' Replicate the getRoads
#' @param type of the road to apply the quietness factor to
#' @param qfactor a number (typed) to use as Quietness Factor
#' @get /api/centrality/<roadType>/<qfactor:double>/
#' @get /api/centrality/<roadType>/<qfactor:double>
#' @get /api/centrality/<qfactor:double>/<roadType>/
#' @get /api/centrality/<qfactor:double>/<roadType>
#' @get /api/centrality/<qfactor:double>/
#' @get /api/centrality/<qfactor:double>
#' @get /api/centrality/<roadType:character>/
#' @get /api/centrality/<roadType:character>
#' @get /api/centrality/
#' @get /api/centrality
centrality <- function(res, qfactor = 1, roadType = "residential") {
  if(length(roadType) > 30 || !is.element(tolower(roadType), tolower(roadTypes))) {
    return(list(paste0("Road type: '", roadType, "' not found.")))
  }
  if(qfactor > 10){
    return(list(paste0("Quientness factor: '", roadType, "' bigger than 10.")))
  }
     
  sel = roads_sn@sl$highway == roadType
  w <- as.numeric(roads_sn@sl$length)
  roads$w = w
  w[sel] <- w[sel] * qfactor
  centrality = igraph::edge_betweenness(roads_sn@g, weights = w)
  roads$lwd = centrality / mean(centrality)
  
  # tidy-up roads, remove unncessary columns to serve
  roads <- roads[c("highway", "lwd")]
  # roads <- roads[w > 100, ]
  geoms <- geojsonio::geojson_json(roads)
  res$body <- geoms
  return(res)
  # return(geoms)
}

#' TODO: this will be deleted so may not need to load into mem
#' @get /json
function(res){
  # json_data <- fromJSON(paste(readLines("../../region1.geojson"), collapse=""))
  # return(json_data)
  dirloc <- file.path(here::here(), "who-data", "accra", "osm")
  f <- list.files(dirloc)
  
  ## use the previously created buffer to "crop" the other files
  # read in the buffer geojson file
  region = read_sf("../region1.geojson")
  
  # crop the bldns file
  bldns <- readRDS(f[1])
  # names(bldns)
  bldns_poly <- bldns$osm_polygons
  bldns <- bldns_poly[region, ]
  geoms <- geojsonio::geojson_json(bldns[1:50, 1:2])[[1]]
  res$body <- geoms
  # cat(geoms)
  return(res)
}

# Filters -----------------------------------------------------------------

#' Log some information about the incoming request
#' @filter logger
function(req){
  cat(as.character(Sys.time()), "-",
      req$REQUEST_METHOD, req$PATH_INFO, "-",
      req$HTTP_USER_AGENT, "@", req$REMOTE_ADDR, "\n")
  plumber::forward()
}

# HOME --------------------------------------------------------------------
#' See https://github.com/trestletech/movies-plumber/blob/master/plumber.R
#' Serve the core HTML file for any request for a page
#' add more as we get them
#' 
#' @param req incoming request
#' @param res returned response
#' @get /
#' @get /roads
#' @get /roads/
#' @get /roads/<qfactor>
#' @get /roads/<qfactor>/
#' @get /roads/<qfactor:double>/<rtype>
#' @get /roads/<qfactor:double>/<rtype>/
#' @get /about
#' @get /about/
#' @get /tile
#' @get /tile/
#' @get /deck
#' @get /deck/
#' @get /pollution
#' @get /pollution/
routesAllowed <- function(req, res){
  # cat(req$PATH_INFO)
  fname <- file.path(here::here(), "static", "public", "index.html")
  plumber::include_html(fname, res)
}

#' here::here() finds the path to a project and getwd() from where R script was initiated.
#' Tell plumber where our public facing directory is to SERVE.
#' @assets ./static/public /
list()
