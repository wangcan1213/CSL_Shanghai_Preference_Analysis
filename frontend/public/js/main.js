$(function () {
    $('.choose_button').click(function (event) {
        // event.preventDefault();
        console.log($(this));
        $(this).toggleClass('a_chosen');
        // setTimeout($(this).attr('href', '/play'), 2000);
        let chosen = -1;
        $.ajax({
            url: "/play",
            type: "post",
            data: {
                chosen: $(this).attr('id'),
                experiment_id: $("#experiment_id").text()
            },
            success: function (msg) {
                console.log(msg);
                if (msg === 'answer accepted') {
                    window.location.href = "/play";
                }
            },
            error: function(jqXHR , textStatus, errorThrown) {
                console.log(jqXHR);
            }

        })
    })
})

$(function () {
    // console.log($('#last_choice_info').text());
    if (parseInt($('#last_choice_info').text()) === 1) {
        $('#last_choice_A').fadeIn(1000)
    } else if(parseInt($('#last_choice_info').text()) === 2){
        $('#last_choice_B').fadeIn()
    }
})

// highlight
$(function () {
    var alt_a_varnames = $('.alt_a .alt_varname');
    var alt_a_values = $('.alt_a .alt_value');
    var alt_b_varnames = $('.alt_b .alt_varname');
    var alt_b_values = $('.alt_b .alt_value');
    $('tbody, .a_submit').hover(function () {
        $.each(alt_a_varnames, function (index, alt_a_varname) {
            alt_a_varname = $(alt_a_varname);
            const alt_a_value = $(alt_a_values[index]);
            const alt_b_varname = $(alt_b_varnames[index]);
            const alt_b_value = $(alt_b_values[index]);
            if ((alt_a_varname.text() === alt_b_varname.text()) && (alt_a_value.text() === alt_b_value.text())) {
                alt_a_varname.toggleClass('weak_string');
                alt_b_varname.toggleClass('weak_string');
                alt_a_value.toggleClass('weak_string');
                alt_b_value.toggleClass('weak_string');
            } else {
                alt_a_varname.toggleClass('strong_string');
                alt_b_varname.toggleClass('strong_string');
                alt_a_value.toggleClass('strong_string');
                alt_b_value.toggleClass('strong_string');
            }
        })
    })

})

// predict
$(function () {
    $('#predict').click(function () {
        let latest_ego_estimation = $.cookie('latest_ego_estimation');
        let latest_population_estimation = $.cookie('latest_population_estimation');
        if (latest_ego_estimation === undefined && latest_population_estimation == undefined) {
            alert('There are no available models, please click "Finish" button to estimate ' +
                'ego and/or population model and then go back here to make predictions.');
        } else if (latest_ego_estimation === undefined) {
            alert('There is no available ego model, you can click "Finish" button and then select ' +
                'ego model estimation');
        } else if (latest_population_estimation === undefined) {
            alert('There is no available ego model, you can click "Finish" button and then select ' +
                'population model estimation');
        }
        let exp_id = parseInt($('#experiment_id').text());
        let alt_a_spec = JSON.parse($('#alt_a_spec').text());
        let alt_b_spec = JSON.parse($('#alt_b_spec').text());
        // let varnames = ['mask_1', 'mask_2', 'social_dist', 'commute_dist', 'working_day',
        //     'working_hour', 'home_time', 'refresh_1', 'refresh_2', 'restaurant_1', 'restaurant_2'];
        let varnames = ['Move', 'Commute Distance', 'Rent', 'Large Size', 'Density', 'Income Disparity'];
        let alt_specs = {'alt_a':get_logit_row(alt_a_spec, false), 'alt_b':get_logit_row(alt_b_spec, true)};
        if (latest_ego_estimation !== undefined) {
            latest_ego_estimation = JSON.parse(latest_ego_estimation);
            let probs_ego = logit_predict(alt_specs, latest_ego_estimation, varnames);
            $('#predicted_prob_A_ego')
                .text('Predicted Prob = ' + probs_ego.alt_a.toFixed(3) + ' by Ego Model').fadeIn(300);
            $('#predicted_prob_B_ego')
                .text('Predicted Prob = ' + probs_ego.alt_b.toFixed(3) + ' by Ego Model').fadeIn(300);
            if (probs_ego.alt_a > probs_ego.alt_b) {
                $('#predicted_prob_A_ego').addClass('predicted_chosen')
                $('#predicted_prob_B_ego').removeClass('predicted_chosen')
            } else if (probs_ego.alt_a < probs_ego.alt_b) {
                $('#predicted_prob_B_ego').addClass('predicted_chosen')
                $('#predicted_prob_A_ego').removeClass('predicted_chosen')
            }
        }
        if (latest_population_estimation !== undefined) {
            latest_population_estimation = JSON.parse(latest_population_estimation);
            let probs_population = logit_predict(alt_specs, latest_population_estimation, varnames);
            $('#predicted_prob_A_pop')
                .text('Predicted Prob = ' + probs_population.alt_a.toFixed(3) + ' by Population Model')
                .fadeIn(300);
            $('#predicted_prob_B_pop')
                .text('Predicted Prob = ' + probs_population.alt_b.toFixed(3) + ' by Population Model')
                .fadeIn(300);
            if (probs_population.alt_a > probs_population.alt_b) {
                console.log('FUCK a');
                $('#predicted_prob_A_pop').addClass('predicted_chosen');
                $('#predicted_prob_B_pop').removeClass('predicted_chosen');
            } else if (probs_population.alt_a < probs_population.alt_b) {
                console.log('FUCK b');
                $('#predicted_prob_B_pop').addClass('predicted_chosen');
                $('#predicted_prob_A_pop').removeClass('predicted_chosen');
            }
        }
    })

})

function get_logit_row(profile, move) {
    row_obj = {
        'Move':0,
        'Commute Distance':0,
        'Rent': 0,
        'Large Size': 0,
        'Density': 0,
        'Income Disparity': 0
    }
    if (move) {
        row_obj['Move'] = 1;
    }

    if (profile['commute'] === 1) {
        row_obj['Commute Distance'] = 10
    } else if (profile['commute'] === 2) {
        row_obj['Commute Distance'] = 5
    } else if (profile['commute'] === 3) {
        row_obj['Commute Distance'] = 3
    } else if (profile['commute'] === 4) {
        row_obj['Commute Distance'] = 1
    }

    if (profile['size'] === 2) {
        row_obj['Large Size'] = 1
    }

    if (profile['price'] === 1) {
        row_obj['Rent'] = 1300
    } else if (profile['price'] === 2) {
        row_obj['Rent'] = 1000
    } else if (profile['price'] === 3) {
        row_obj['Rent'] = 750
    } else if (profile['price'] === 4) {
        row_obj['Rent'] = 500
    }

    if (profile['density'] === 1) {
        row_obj['Density'] = 10
    } else if (profile['density'] === 2) {
        row_obj['Density'] = 30
    } else if (profile['density'] === 3) {
        row_obj['Density'] = 50
    } else if (profile['density'] === 4) {
        row_obj['Density'] = 80
    }

    if (profile['income_disparity'] === 1) {
        row_obj['Income Disparity'] = 0.1
    } else if (profile['income_disparity'] === 2) {
        row_obj['Income Disparity'] = 0.25
    } else if (profile['income_disparity'] === 3) {
        row_obj['Income Disparity'] = 0.5
    } else if (profile['income_disparity'] === 4) {
        row_obj['Income Disparity'] = 0.75
    } else if (profile['income_disparity'] === 5) {
        row_obj['Income Disparity'] = 0.9
    }

    return row_obj;
}

function logit_predict(alt_specs, model, varnames) {
    let alt_names = Object.keys(alt_specs);
    let utilities = alt_names.reduce(function (acc, crt_alt) {
        acc[crt_alt] = 0;
        return acc;
    }, {});
    for (let this_var of varnames) {
        for (let this_alt of alt_names) {
            utilities[this_alt] += alt_specs[this_alt][this_var] * model[this_var];
        }
    }
    // in case of overflow
    let mean_util = Object.values(utilities).reduce((x,y)=>x+y) / alt_names.length;
    let utilities_transformed = alt_names.reduce(function (acc, this_alt) {
        if (utilities[this_alt] - mean_util >= 700) {
            acc[this_alt] = 700;
        } else {
            acc[this_alt] = utilities[this_alt] - mean_util;
        }
        return acc;
    }, {});
    let tt_exp_util = Object.values(utilities_transformed).map(x=>Math.exp(x)).reduce((x,y)=>x+y);
    return alt_names.reduce(function (acc, this_alt) {
        acc[this_alt] = Math.exp(utilities_transformed[this_alt]) / tt_exp_util;
        return acc;
    }, {});
}