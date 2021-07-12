import pandas as pd
from datetime import datetime as dt
import calendar
import json
from pathlib import Path

def month_delta(date, delta):
    m = date.month + delta
    y = date.year
    while m < 1 or m > 12:
        if m < 1:
            m += 12
            y -= 1
        else: # m > 12
            m -= 12
            y += 1
    d = min(date.day, calendar.monthrange(y, m)[1])
    return date.replace(day=d,month=m, year=y)

def format_str_to_date(str):
    return dt.strptime(str[:-6], "%Y-%m-%d %H:%M:%S")

# the meta function you call to do everything for you
def chop_csv(month_gap, src_path, src_name, end_path, end_name):
    # get the data from the specified csv file
    data = pd.read_csv(src_path + src_name + '.csv')

    # set the reference date to a month gap before the last recorded date on the csv file
    ref_date = month_delta(format_str_to_date(data.loc[0, 'deviceTime_local']), -month_gap)
    cutoff_indexes = [0]

    # figure out which indexes are the right gaps
    for i, series in data.iterrows():

        date = format_str_to_date(series['deviceTime_local'])
        if date <= ref_date : # at cutoff
            cutoff_indexes.insert(0, i)
            while date < ref_date:
                ref_date = month_delta(ref_date, -month_gap)

    # cut the data using the cutoff indexes found above
    new_dfs = []
    for i in range(len(cutoff_indexes) - 1):
        new_dfs.append( data[cutoff_indexes[i + 1] : cutoff_indexes[i]] )

    # push the cut dataframes to the correct csv files
    output_dir = Path(end_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    for i, df in enumerate(new_dfs):
        df.to_csv(output_dir / Path(end_name + "_" + str(i) + ".csv"), index=False)

    # add info to the metadata file.
    metadata = dict()
    try:
        with open(end_path + "metadata.json", "r") as file:
            metadata = json.load(file)
        print("updating metadata.json")
    except FileNotFoundError:
        print("metadata.json not found, creating new file")
    except ValueError:
        print("contents of metadata.json are not formatted correctly, creating new file")

    with open(end_path + "metadata.json", "w") as file:
        metadata["file_count"] = len(new_dfs)
        json.dump(metadata, file)

# etch_roof_year.csv
# chop_csv(1, "", "etch_roof_year", "etch_roof_year/", "etch_roof_year")

# etch_roof_weather_year.csv
chop_csv(1, "", "etch_roof_weather_year", "etch_roof_weather_year/", "etch_roof_weather_year")
