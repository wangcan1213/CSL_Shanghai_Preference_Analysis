module.exports  = function (input) {
    var output = {};
    switch (input["mask"]) {
        case 1:
            output["Mask at Workplace"] = "You must wear a mask all the time";
            break;
        case 2:
            output["Mask at Workplace"] = "You only need to wear a mask when not alone";
            break;
        case 3:
            output["Mask at Workplace"] = "You can choose to wear a mask or not";
            break;
    }

    switch (input["social_dist"]) {
        case 1:
            output["Social Distance at Workplace"] = "You must keep social distance for at least 6 feet";
            break;
        case 2:
            output["Social Distance at Workplace"] = "There is no requirement for social distance";
            break;
    }

    switch (input["commute_dist"]) {
        case 1:
            output["Commuting Distance"] = "10 miles from your home";
            break;
        case 2:
            output["Commuting Distance"] = "5 miles from your home";
            break;
        case 3:
            output["Commuting Distance"] = "3 miles from your home";
            break;
        case 4:
            output["Commuting Distance"] = "1 miles from your home";
            break;
        case 5:
            output["Commuting Distance"] = "500 feet from your home";
            break;
    }

    switch (input["working_day"]) {
        case 1:
            output["Working Days at Workplace"] = "5 days per week";
            break;
        case 2:
            output["Working Days at Workplace"] = "4 days per week";
            break;
        case 3:
            output["Working Days at Workplace"] = "2 days per week";
            break;
        case 4:
            output["Working Days at Workplace"] = "1 day per week";
            break;
    }

    switch (input["working_hour"]) {
        case 1:
            output["Working Hours at Workplace"] = "8 hours per day";
            break;
        case 2:
            output["Working Hours at Workplace"] = "4 hours per day";
            break;
        case 3:
            output["Working Hours at Workplace"] = "2 hours per day";
            break;
        case 4:
            output["Working Hours at Workplace"] = "1 hour per day";
            break;
    }

    switch (input["home_efficiency"]) {
        case 1:
            output["Efficiency of Working from Home"] = "You are high-efficient at home and can work 20% less time than at workplace";
            break;
        case 2:
            output["Efficiency of Working from Home"] = "You are as efficient at home as at workplace";
            break;
        case 3:
            output["Efficiency of Working from Home"] = "You are low-efficient at home and have to work 20% more time than at workplace";
            break;
        case 4:
            output["Efficiency of Working from Home"] = "You are low-efficient at home and have to work 50% more time than at workplace";
            break;
        case 5:
            output["Efficiency of Working from Home"] = "You are low-efficient at home and have to work 100% more time than at workplace";
            break;
    }

    switch (input["refreshment"]) {
        case 1:
            output["Refreshment at Workplace"] = "Refreshment is unavailable at workplace";
            break;
        case 2:
            output["Refreshment at Workplace"] = "Refreshment is available at workplace, but you have to take and enjoy it alone";
            break;
        case 3:
            output["Refreshment at Workplace"] = "Refreshment is available at workplace, and there is no restriction on it";
            break;
    }

    switch (input["restaurants"]) {
        case 1:
            output["Restaurants at Workplace"] = "All restaurants are closed, you have to take your meal or eat at home";
            break;
        case 2 :
            output["Restaurants at Workplace"] = "Restaurants are open, but only provide \"TO GO\" services";
            break;
        case 3:
            output["Restaurants at Workplace"] = "Restaurants are open, and there is no restrcition on it";
            break;
    }

    return output;

};
