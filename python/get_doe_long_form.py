import json

def profile_to_logit_row(profile, move=True):
    row_obj = {
                'Move':0,
                'Commute Distance': 0,
                'Rent': 0,
                'Large Size': 0,
                'Density': 0,
                'Income Disparity': 0
    }
    if move:
        row_obj['Move'] = 1

    if profile['commute'] == 1:
        row_obj['Commute Distance'] = 10
    elif profile['commute'] == 2:
        row_obj['Commute Distance'] = 5
    elif profile['commute'] == 3:
        row_obj['Commute Distance'] = 3
    elif profile['commute'] == 4:
        row_obj['Commute Distance'] = 1

    if profile['size'] == 2:
        row_obj['Large Size'] = 1

    if profile['price'] == 1:
        row_obj['Rent'] = 1300
    elif profile['price'] == 2:
        row_obj['Rent'] = 1000
    elif profile['price'] == 3:
        row_obj['Rent'] = 750
    elif profile['price'] == 4:
        row_obj['Rent'] = 500

    if profile['density'] == 1:
        row_obj['Density'] = 10
    elif profile['density'] == 2:
        row_obj['Density'] = 30
    elif profile['density'] == 3:
        row_obj['Density'] = 50
    elif profile['density'] == 4:
        row_obj['Density'] = 80


    if profile['income_disparity'] == 1:
        row_obj['Income Disparity'] = 0.1
    elif profile['income_disparity'] == 2:
        row_obj['Income Disparity'] = 0.25
    elif profile['income_disparity'] == 3:
        row_obj['Income Disparity'] = 0.5
    elif profile['income_disparity'] == 4:
        row_obj['Income Disparity'] = 0.75
    elif profile['income_disparity'] == 5:
        row_obj['Income Disparity'] = 0.9
    return row_obj


    

def get_doe_logit_long_form(init_chocie=True):
    experiments = json.load(open('../DOE.json', 'r'))
    results = []
    for ex in experiments:
        this_alt_a = profile_to_logit_row(ex['alt_a'], move=False)
        this_alt_b = profile_to_logit_row(ex['alt_b'], move=True)
        this_alt_a['alt'] = 1
        this_alt_b['alt'] = 2
        if init_chocie:
            this_alt_a['choice'] = 0
            this_alt_b['choice'] = 0
        results.append({'alt_a': this_alt_a, 'alt_b': this_alt_b})
    json.dump(results, open('DOE_logit_long_form.json', 'w'), indent=4)
    return results

    
    
if __name__ == "__main__":
    results = get_doe_logit_long_form()
    print(results)