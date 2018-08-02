# packages needed before running the server script
packages <- c("here", "plumber")

if (length(setdiff(packages, rownames(installed.packages()))) > 0) {
  install.packages(setdiff(packages, rownames(installed.packages())))  
}

lapply(packages, library, character.only = TRUE)

r = plumber::plumb(file.path(here::here(), "server", "plumber.R"))
r$run(port = 8000)