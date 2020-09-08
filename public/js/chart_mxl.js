const varname_labels = {
    'Move': 'Move (vs. Stay)',
    'Commute Distance': 'Commute Distance (km)',
    'Rent': 'Monthly Rent ($100)',
    'Large Size': 'Large Size (vs. Small)',
    'Density': 'Population Density (100 persons/ha)',
    'Income Disparity': 'Income Disparity'
}
const colors_raw = {
    'Move': '#ffa5a5',
    'Commute Distance': '#a14758',
    'Rent': '#5e58ff',
    'Large Size': '#bcfd61',
    'Density': '#d441fd',
    'Income Disparity': '#2efded'
    // 'working_hour': '#2efded',
    // 'refresh_1': "#a14758",
    // 'refresh_2': "#af7b87",
    // 'restaurant_1': '#72ac1f',
    // 'restaurant_2': '#bcfd61'
}
const gaussianConstant = 1 / Math.sqrt(2 * Math.PI)

$(function () {
    // get data
    const mxl_obj_raw = JSON.parse($('#mixlogit').text());
    const ind_params_obj_raw = JSON.parse($('#ind_params').text());
    const r2 = mxl_obj_raw.r2;
    delete mxl_obj_raw.r2;
    console.log(JSON.stringify(mxl_obj_raw));
    console.log(JSON.stringify(ind_params_obj_raw));
    var mxl_params = new Object(),
        individual_parmas = new Object(),
        mxl_normal_density_points = new Object(),
        min_max = new Object(),
        colors = new Object(),
        normal_points,
        new_varname,
        total_min_x = Infinity,
        total_max_x = -Infinity,
        total_max_y = -1;
    for (let key in mxl_obj_raw) {
        new_varname = varname_labels[key];
        colors[new_varname] = colors_raw[key];
        mxl_params[new_varname] = mxl_obj_raw[key];
        individual_parmas[new_varname] = ind_params_obj_raw[key];
        if (new_varname === 'Monthly Rent ($100)' || new_varname === 'Population Density (100 persons/ha)') {
            mxl_params[new_varname]['mean'] = mxl_params[new_varname]['mean'] * 100;
            mxl_params[new_varname]['std'] = mxl_params[new_varname]['std'] * 100;
            individual_parmas[new_varname] = individual_parmas[new_varname] * 100
        }
        normal_points = get_normal_density_by_fixed_samples(mxl_obj_raw[key]['mean'], mxl_obj_raw[key]['std'], 1000);
        mxl_normal_density_points[new_varname] = normal_points;
        min_max[new_varname] = {
            min_x: d3.min(normal_points, function (d) {return d.q;}),
            max_x: d3.max(normal_points, function (d) {return d.q;}),
            max_y: d3.max(normal_points, function (d) {return d.p;})
        }
        if (min_max[new_varname]['min_x'] < total_min_x) {
            total_min_x = min_max[new_varname]['min_x'];
        }
        if (min_max[new_varname]['max_x'] > total_max_x) {
            total_max_x = min_max[new_varname]['max_x'];
        }
        if (min_max[new_varname]['max_y'] > total_max_y) {
            total_max_y = min_max[new_varname]['max_y'];
        }
    }
    min_max['all'] = {
        min_x: total_min_x,
        max_x: total_max_x,
        max_y: total_max_y
    }
    console.log('min_max');
    console.log(JSON.stringify(min_max['all']));

    const varnames = Object.keys(mxl_params);
    // const params = Object.values(data_obj);
    // const data = Object.entries(data_obj);
    const text_margin = 10;


    var viewBox_width = 2100,
        viewBox_height= 800,
        margin = {top: 50, right: 50, bottom: 50, left: 70},
        width = viewBox_width - margin.left - margin.right,
        height = viewBox_height - margin.top - margin.bottom;

    var svg = d3.select('.svg-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${viewBox_width}, ${viewBox_height}`)
        .attr('preserveAspectRatio', 'xMidYMid'); //it's a width viewport, so YMin/YMid doesn't matter
    // axes scale
    var xScale = d3.scaleLinear().rangeRound([0, width]),
        yScale = d3.scaleLinear().range([height, 0]);
    xScale.domain([min_max['all']['min_x'], min_max['all']['max_x']]);
    yScale.domain([0, min_max['all']['max_y']]);

    var figure = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr('class', 'figure');

    // axes
    var gX = figure.append("g")
                   .attr("transform", "translate(0," + height + ")")
                   .attr('class', 'x-axis')
                   .call(d3.axisBottom(xScale));

    var gY = figure.append("g")
                   .attr('class', 'y-axis')
              // .call(d3.axisLeft(yScale));
                   .call(d3.axisLeft(yScale).ticks(5));

    d3.select('.x-axis').selectAll('text').style('font-size', '24px');
    d3.select('.y-axis').selectAll('text').style('font-size', '24px');
    figure.append('text')
        .attr('transform', 'translate(' + (width) + ',' + (height+margin.top-60) + ')')
        .style('text-anchor', 'end')
        .text('Preference')
        .style('font-size', '30px')
        .style('font-weight', 'bold');
    figure.append('text')
        .attr('transform', 'translate(' + (0-margin.left+15) + ',' + (margin.top+height/2) + ') rotate(-90)')
        .style('text-anchor', 'middle')
        .text('Density')
        .style('font-size', '30px')
        .style('font-weight', 'bold');

    //curves
    var line = d3.line()
        .x(function (d) {return xScale(d.q);})
        .y(function (d) {return yScale(d.p);});
    var curves = new Object();
    for (let varname in mxl_normal_density_points) {
        curves[varname] = figure.append('path')
                                .datum(mxl_normal_density_points[varname])
                                .attr('class', 'gaussian-curves')
                                .attr('d', line)
                                .attr('varname', varname)
                                .style('fill', colors[varname])
                                .style('stroke', 'black')
                                // .style('stroke-width', '3px')
                                .style('opacity', '0.6');
    }

    if (r2 >= 0.6) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is quite likely to be overfitted, you are suggest to play more experiments.`);
    } else if (r2 >= 0.2) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is excellent!`);
    } else if (r2 >= 0.1) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is OK.`);
    } else {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is not so good.`);
    }

    // add lables;
    const labels = $('.labels');
    for (let varname in colors) {
        let li = $('<li></li>').attr('class', 'var-label').attr('var', varname);
        li.attr('title', 'Click to show preference distribution for "' + varname + '"');
        let div_color_rect = $('<div></div>').css("background", colors[varname]).attr('class', 'rect');
        let div_varname_text = $('<div></div>').text(varname).attr('class', 'var-label-str');
        li.append(div_color_rect);
        li.append(div_varname_text);
        labels.append(li);
    }

    // listen to click events
    $('ul.labels').delegate('.var-label', 'click', function () {
        let this_var = $(this).attr('var');
        figure.selectAll(".preference-reference")
        //     .filter(function () {
        //         return this['attributes']['varname']['value'] !== this_var;
        //     })
            .remove();
        figure.selectAll(".preference-text").remove();
        let use_max_y, use_min_x, use_max_x;
        if (min_max[this_var]['min_x'] <0 && min_max[this_var]['max_x']>0) {
            [use_min_x, use_max_x] = [min_max[this_var]['min_x'], min_max[this_var]['max_x']];
        } else if (min_max[this_var]['min_x'] >= 0) {
            use_max_x = min_max[this_var]['max_x'];
            use_min_x = Math.max(0 - (min_max[this_var]['max_x']-min_max[this_var]['min_x'])/6, min_max['all']['min_x']);
        } else if (min_max[this_var]['max_x'] <= 0) {
            use_min_x = min_max[this_var]['min_x'];
            use_max_x = Math.min(0 + (min_max[this_var]['max_x']-min_max[this_var]['min_x'])/6, min_max['all']['max_x']);
        }
        xScale.domain([use_min_x, use_max_x]);

        if (min_max[this_var]['max_y'] <= min_max['all']['max_y'] / 20) {
            use_max_y = min_max['all']['max_y'] / 20;
        } else if (min_max[this_var]['max_y'] <= min_max['all']['max_y'] / 10) {
            use_max_y = min_max['all']['max_y'] / 10;
        } else if (min_max[this_var]['max_y'] <= min_max['all']['max_y'] / 5) {
            use_max_y = min_max['all']['max_y'] / 5;
        } else if (min_max[this_var]['max_y'] <= min_max['all']['max_y'] / 3) {
            use_max_y = min_max['all']['max_y'] / 3;
        } else {
            use_max_y = min_max['all']['max_y'];
        }
        yScale.domain([0, use_max_y]);
        gX
            .transition().duration(1200)
            .call(d3.axisBottom(xScale));
        gY
            .transition().duration(1200)
            .call(d3.axisLeft(yScale).ticks(5));
        d3.select('.x-axis').selectAll('text').style('font-size', '30px');
        d3.select('.y-axis').selectAll('text').style('font-size', '30px');
        if (this_var !== 'all') {
            // processing notes: calculating and showing probabilities
            $('li.r2').hide();
            $('li.individual-params').show();
            let mxl_param_mean_this = mxl_params[this_var]['mean'],
                mxl_param_std_this = mxl_params[this_var]['std'],
                individual_param_this = individual_parmas[this_var],
                general_positive_prob,
                general_negative_prob,
                individual_opposite_prob,
                individual_stronger_prob,
                individual_weaker_prob,
                individual_attitude;
            general_negative_prob = normalcdf(mxl_param_mean_this, mxl_param_std_this, 0);
            general_positive_prob = 1 - general_negative_prob;
            if (individual_param_this <= 0) {
                individual_attitude = 'negative';
                individual_opposite_prob = general_positive_prob;
                individual_stronger_prob = normalcdf(mxl_param_mean_this, mxl_param_std_this, individual_param_this);
                individual_weaker_prob = general_negative_prob - individual_stronger_prob;
            } else {
                individual_attitude = 'positive';
                individual_opposite_prob = general_negative_prob;
                let tmp = normalcdf(mxl_param_mean_this, mxl_param_std_this, individual_param_this);
                individual_weaker_prob = tmp - general_negative_prob;
                individual_stronger_prob = 1 - tmp;
            }
            let prompt_general = (general_positive_prob*100).toFixed(2)+ '% of people have positive preference towards "' +
                this_var + '", while ' + (general_negative_prob*100).toFixed(2) + '% of people have negative preference.';
            let prompt_individual = 'You have ' + individual_attitude + ' preference towards "' + this_var + '" , ' +
                (individual_opposite_prob*100).toFixed(2) + '% of people have opposite preference, ' +
                (individual_stronger_prob*100).toFixed(2) + '% of people have similar but stronger preference, ' +
                (individual_weaker_prob*100).toFixed(2) + '% of people have similar but weaker preference.'
            $('li#general').empty().text(prompt_general);
            $('li#yours').empty().text(prompt_individual);


            // processing curves
            for (let varname in curves) {
                if (varname !== this_var) {
                    curves[varname]
                        // .datum(mxl_normal_density_points[varname])
                        .transition().duration(1200)
                        .attr('d', line)
                        .style('fill', 'grey')
                        .style('opacity', '0.1');
                } else {
                    curves[varname]
                        // .datum(mxl_normal_density_points[varname])
                        .transition().duration(1200)
                        .style('fill', colors[varname])
                        .style('opacity', '0.6')
                        .attr('d', line);
                }
            }

            // add reference lines
            let individual_param_y_location = yScale(gaussian(individual_param_this, mxl_param_mean_this,
                mxl_param_std_this, gaussianConstant))
            figure.append('line')
                .attr('x1', xScale(individual_param_this))
                .attr('y1', yScale(0))
                .attr('x2', xScale(individual_param_this))
                .attr('y2', individual_param_y_location)
                .attr('class', 'preference-reference')
                .transition().delay(1200)
                .style('stroke', 'black')
                .style('stroke-width', '3px');

            figure.append("text")
                .attr('class', 'preference-text')
                .style("fill", "black")
                .attr("dy", "-.35em")
                .attr("text-anchor", individual_param_this>mxl_param_mean_this ? "start" : "end")
                .attr('x', xScale(individual_param_this))
                .attr('y', individual_param_y_location)
                .transition().delay(1200).duration(300)
                .style("font-size", "1px")
                .transition().duration(500)
                .style("font-size", "30px")
                .text("Your preference is here");

            figure.append('line')
                .attr('x1', xScale(0))
                .attr('y1', yScale(0))
                .attr('x2', xScale(0))
                .attr('y2', yScale(gaussian(0, mxl_param_mean_this,
                    mxl_param_std_this, gaussianConstant)))
                .attr('class', 'preference-reference')
                .transition().delay(1200)
                .style('stroke', 'white')
                .style('stroke-width', '3px');

        } else {
            $('li.r2').show();
            $('li.individual-params').hide();
            for (let varname in curves) {
                curves[varname]
                    // .datum(mxl_normal_density_points[varname])
                    .transition().duration(1200)
                    .style('fill', colors[varname])
                    .style('opacity', '0.6')
                    .attr('d', line);
            }
        }
    })
});

$(function () {
    $('.var-label').tooltip();
})


$(function () {
    $('ul.labels').delegate('.var-label', 'mouseenter', function () {
        $(this).siblings().fadeTo(100, 0.3);
    })
    $('ul.labels').delegate('.var-label', 'mouseleave', function () {
        $(this).siblings().fadeTo(100, 1);
    })
})


function gaussian(x, mu, sigma, gaussianConstant) {
    gaussianConstant = gaussianConstant || 1 / Math.sqrt(2 * Math.PI);
    x = (x - mu) / sigma;
    return gaussianConstant * Math.exp(-.5 * x * x) / sigma;
}

// function normal_sample(mu, sigma) {
//     var u = 0,
//         v = 0,
//         rst;
//     while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
//     while(v === 0) v = Math.random();
//     rst =  Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
//     rst = rst*sigma + mu;
//     return rst;
// }
//
// function get_normal_density_by_random_samples(mu, sigma, num_random_points) {
//     num_random_points = num_random_points || 100000;
//     let data = [],
//         gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
//     for (let i=num_random_points; i--;) {
//         let q = normal_sample(mu, sigma),
//             p = gaussian(mu, sigma, gaussianConstant);
//         data.push({
//             q:q,
//             p:p
//         });
//     }
//     return data;
// }

function get_normal_density_by_fixed_samples(mu, sigma, num_points, sigma_range) {
    num_points = num_points || 100;
    sigma_range = sigma_range || 3.5;
    let data = [],
        gaussianConstant = 1 / Math.sqrt(2 * Math.PI),
        step = 2 * sigma_range * sigma / num_points;
    for (let i = mu - sigma_range * sigma; i < mu + sigma_range * sigma; i+=step) {
        q = i;
        p = gaussian(q, mu, sigma, gaussianConstant);
        data.push({
            q:q,
            p:p
        });
    }
    return data;
}

function normalcdf(mean, sigma, to) {
    var z = (to-mean)/Math.sqrt(2*sigma*sigma);
    var t = 1/(1+0.3275911*Math.abs(z));
    const   a1 =  0.254829592,
            a2 = -0.284496736,
            a3 =  1.421413741,
            a4 = -1.453152027,
            a5 =  1.061405429;
    const erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
    var sign = 1;
    if(z < 0)
    {
        sign = -1;
    }
    return (1/2)*(1+sign*erf);
}

