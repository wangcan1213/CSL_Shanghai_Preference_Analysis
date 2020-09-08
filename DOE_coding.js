module.exports  = function (input) {
    var output = {};
    switch (input["commute"]) {
        case 1:
            output["Commute Distance"] = "10km";
            break;
        case 2:
            output["Commute Distance"] = "5km";
            break;
        case 3:
            output["Commute Distance"] = "3km";
            break;
        case 4:
            output["Commute Distance"] = "1km";
            break;
    }

    switch (input["size"]) {
        case 1:
            output["Residence Size"] = "Small";
            break;
        case 2:
            output["Residence Size"] = "Large";
            break;
    }

    switch (input["price"]) {
        case 1:
            output["Monthly Rent"] = "$1300";
            break;
        case 2:
            output["Monthly Rent"] = "$1000";
            break;
        case 3:
            output["Monthly Rent"] = "$750";
            break;
        case 4:
            output["Monthly Rent"] = "$500";
            break;
    }

    switch (input["density"]) {
        case 1:
            output["Density of Residents"] = "10 persons/ha";
            break;
        case 2:
            output["Density of Residents"] = "30 persons/ha";
            break;
        case 3:
            output["Density of Residents"] = "50 persons/ha";
            break;
        case 4:
            output["Density of Residents"] = "80 persons/ha";
            break;
    }

    switch (input["income_disparity"]) {
        case 1:
            output["Income Structure (Low Income vs. High Income)"] = "Low Income = 90%";
            break;
        case 2:
            output["Income Structure (Low Income vs. High Income)"] = "Low Income = 75%";
            break;
        case 3:
            output["Income Structure (Low Income vs. High Income)"] = "Low Income = 50%";
            break;
        case 4:
            output["Income Structure (Low Income vs. High Income)"] = "Low Income = 25%";
            break;
        case 5:
            output["Income Structure (Low Income vs. High Income)"] = "Low Income = 10%";
            break;
    }

    return output;

};
