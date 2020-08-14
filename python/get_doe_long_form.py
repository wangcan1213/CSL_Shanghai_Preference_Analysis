import json

def profile_to_logit_row(profile):
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
    if profile['mask'] == 1:
        row_obj['mask_1'] = 1
        row_obj['mask_2'] = 0
    elif profile['mask'] == 2:
        row_obj['mask_1'] = 0
        row_obj['mask_2'] = 1

    if profile['social_dist'] == 1:
        row_obj['social_dist'] = 1

    if profile['commute_dist'] == 1:
        row_obj['commute_dist'] = 10
    elif profile['commute_dist'] == 2:
        row_obj['commute_dist'] = 5
    elif profile['commute_dist'] == 3:
        row_obj['commute_dist'] = 3
    elif profile['commute_dist'] == 4:
        row_obj['commute_dist'] = 1
    elif profile['commute_dist'] == 5:
        row_obj['commute_dist'] = 0.09469697

    if profile['working_day'] == 1:
        row_obj['working_day'] = 5
    elif profile['working_day'] == 2:
        row_obj['working_day'] = 4
    elif profile['working_day'] == 3:
        row_obj['working_day'] = 2
    elif profile['working_day'] == 4:
        row_obj['working_day'] = 1

    if profile['working_hour'] == 1:
        row_obj['working_hour'] = 8
    elif profile['working_hour'] == 2:
        row_obj['working_hour'] = 4
    elif profile['working_hour'] == 3:
        row_obj['working_hour'] = 2
    elif profile['working_hour'] == 4:
        row_obj['working_hour'] = 1

    if profile['home_efficiency'] == 1:
        row_obj['home_time'] = 0.8
    elif profile['home_efficiency'] == 2:
        row_obj['home_time'] = 1
    elif profile['home_efficiency'] == 3:
        row_obj['home_time'] = 1.2
    elif profile['home_efficiency'] == 4:
        row_obj['home_time'] = 1.5
    elif profile['home_efficiency'] == 5:
        row_obj['home_time'] = 2

    if profile['refreshment'] == 1:
        row_obj['refresh_1'] = 1
        row_obj['refresh_2'] = 0
    elif profile['refreshment'] == 2:
        row_obj['refresh_1'] = 0
        row_obj['refresh_2'] = 1

    if profile['restaurants'] == 1:
        row_obj['restaurant_1'] = 1
        row_obj['restaurant_2'] = 0
    elif profile['restaurants'] == 2:
        row_obj['restaurant_1'] = 0
        row_obj['restaurant_2'] = 1
    return row_obj


    

def get_doe_logit_long_form(init_chocie=True):
    experiments = json.load(open('../DOE.json', 'r'))
    results = []
    for ex in experiments:
        this_alt_a = profile_to_logit_row(ex['alt_a'])
        this_alt_b = profile_to_logit_row(ex['alt_b'])
        this_alt_a['alt'] = 1
        this_alt_b['alt'] = 2
        if init_chocie:
            this_alt_a['choice'] = 0
            this_alt_b['choice'] = 0
        results.append({'alt_a': this_alt_a, 'alt_b': this_alt_b})
    json.dump(results, open('DOE_logit_long_form.json', 'w'))
    return results

    
    
if __name__ == "__main__":
    results = get_doe_logit_long_form()
    print(results)