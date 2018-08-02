# Accra Data for WHO Study

1. `accra-bldg.Rds` has 24,490 `osmdata` buildings (plus some multipolygons)
2. `accra-hw.Rds` has 26,411 `osmdata` highways
3. `accra-bs.Rds` has 2,451 `osmdata` bus stops
4. `nodes_new.Rds` has 131,349 worldpop population density estimates projected
   onto the street network via functions in `who-data/R/download-data.R`.
5. `accra-flows-to-busstops.Rds` contains single column of flows from all
   worldpop points (`nodes_new.Rds`)) to every single bus stop. There are
   156,481 flow estimates, corresponding to the size of
   `dodgr::weight_streetnet(accra-hw)`.
6. `accra-flows-from-busstops.Rds` contains flows from all bus stops to all
   potential places of employment (buildings with other than exclusive
   residential purpose).

The final two of these currently take a long time to calculate (just getting
results for the moment; efficiency will come later). They respectively represent
effective first mile and last mile pedestrian journeys make to connect with the
bus system.
