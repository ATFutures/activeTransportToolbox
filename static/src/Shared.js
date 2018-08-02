//do not use ES5/6 types will be interpreted by R v8
//using global for V8 package to read and node scoping.
global.roadTypes = ["Primary", "Secondary", "Tertiary",
    "", "Residential", "Pedestrian",
    "Path", "", "Other"] // we need the empty ones 
global.flows = [
    "flow_foot_activity_bus.Rds",
    "flow_foot_bus_activity.Rds",
    "flow_foot_bus_residential.Rds",
    "flow_foot_residential_bus.Rds"];
global.cities = ["Accra", "Kathmandu"];