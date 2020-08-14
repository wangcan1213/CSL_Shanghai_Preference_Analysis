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
        let varnames = ['mask_1', 'mask_2', 'social_dist', 'commute_dist', 'working_day',
            'working_hour', 'home_time', 'refresh_1', 'refresh_2', 'restaurant_1', 'restaurant_2'];
        let alt_specs = {'alt_a':get_logit_row(alt_a_spec), 'alt_b':get_logit_row(alt_b_spec)};
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

function get_logit_row(profile) {
    row_obj = {
        'mask_1':0, 'mask_2':0,
        'social_dist': 0,
        'commute_dist': 0,
        'working_day': 0,
        'working_hour': 0,
        'home_time': 0,
        'refresh_1': 0, 'refresh_2':0,
        'restaurant_1':0, 'restaurant_2':0
    }
    if (profile['mask'] === 1){
        row_obj['mask_1'] = 1;
        row_obj['mask_2'] = 0;
    } else if (profile['mask'] === 2) {
        row_obj['mask_1'] = 0;
        row_obj['mask_2'] = 1;
    }

    if (profile['social_dist'] === 1) {
        row_obj['social_dist'] = 1;
    }

    if (profile['commute_dist'] === 1) {
        row_obj['commute_dist'] = 10;
    } else if (profile['commute_dist'] === 2) {
        row_obj['commute_dist'] = 5;
    } else if (profile['commute_dist'] === 3) {
        row_obj['commute_dist'] = 3;
    } else if (profile['commute_dist'] === 4) {
        row_obj['commute_dist'] = 1;
    } else if (profile['commute_dist'] === 5) {
        row_obj['commute_dist'] = 0.09469697;
    }

    if (profile['working_day'] === 1) {
        row_obj['working_day'] = 5;
    } else if (profile['working_day'] === 2) {
        row_obj['working_day'] = 4;
    } else if (profile['working_day'] === 3) {
        row_obj['working_day'] = 2
    } else if (profile['working_day'] === 4) {
        row_obj['working_day'] = 1;
    }

    if (profile['working_hour'] === 1) {
        row_obj['working_hour'] = 8;
    } else if (profile['working_hour'] === 2) {
        row_obj['working_hour'] = 4;
    } else if (profile['working_hour'] === 3) {
        row_obj['working_hour'] = 2;
    } else if (profile['working_hour'] === 4) {
        row_obj['working_hour'] = 1;
    }

    if (profile['home_efficiency'] === 1) {
        row_obj['home_time'] = 0.8;
    } else if (profile['home_efficiency'] === 2) {
        row_obj['home_time'] = 1;
    } else if (profile['home_efficiency'] === 3) {
        row_obj['home_time'] = 1.2;
    } else if (profile['home_efficiency'] === 4) {
        row_obj['home_time'] = 1.5;
    } else if (profile['home_efficiency'] === 5) {
        row_obj['home_time'] = 2;
    }

    if (profile['refreshment'] === 1) {
        row_obj['refresh_1'] = 1;
        row_obj['refresh_2'] = 0;
    } else if (profile['refreshment'] === 2) {
        row_obj['refresh_1'] = 0;
        row_obj['refresh_2'] = 1;
    }

    if (profile['restaurants'] === 1) {
        row_obj['restaurant_1'] = 1;
        row_obj['restaurant_2'] = 0;
    } else if (profile['restaurants'] === 2) {
        row_obj['restaurant_1'] = 0;
        row_obj['restaurant_2'] = 1;
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