module.exports  = function (input) {
    var output = {};
    switch (input["commute"]) {
        case 1:
            output["通勤距离"] = "10km";
            break;
        case 2:
            output["通勤距离"] = "5km";
            break;
        case 3:
            output["通勤距离"] = "3km";
            break;
        case 4:
            output["通勤距离"] = "1km";
            break;
    }

    switch (input["size"]) {
        case 1:
            output["房间大小"] = "小房间（15m2）";
            break;
        case 2:
            output["房间大小"] = "大房间（30m2）";
            break;
    }

    switch (input["price"]) {
        case 1:
            output["月租金"] = "2300元";
            break;
        case 2:
            output["月租金"] = "2000元";
            break;
        case 3:
            output["月租金"] = "1750元";
            break;
        case 4:
            output["月租金"] = "1500元";
            break;
    }

    switch (input["density"]) {
        case 1:
            output["人口密度"] = "10人/ha";
            break;
        case 2:
            output["人口密度"] = "30人/ha";
            break;
        case 3:
            output["人口密度"] = "50人/ha";
            break;
        case 4:
            output["人口密度"] = "80人/ha";
            break;
    }

    switch (input["income_disparity"]) {
        case 1:
            output["人口收入构成"] = "低收入人口 = 90%";
            break;
        case 2:
            output["人口收入构成"] = "低收入人口 = 75%";
            break;
        case 3:
            output["人口收入构成"] = "低收入人口 = 50%";
            break;
        case 4:
            output["人口收入构成"] = "低收入人口 = 25%";
            break;
        case 5:
            output["人口收入构成"] = "低收入人口 = 10%";
            break;
    }

    return output;

};
