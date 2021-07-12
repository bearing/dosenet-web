import pandas as pd
from datetime import datetime as dt
import calendar
import json
from pathlib import Path
import time

###################################################################

#
display_names = pd.read_csv("station.csv", index_col="nickname").get("Name")
def display_name_of(file_name):
    return display_names.loc[file_name]


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

###################################################################

def format_str_to_date(str):
    # 2020-02-25 01:57:07+00:00
    if len(str) == 25:
        return dt.strptime(str[:-6], "%Y-%m-%d %H:%M:%S")

    # 2020-03-29 21:41:44+0000
    elif len(str) == 25:
        return dt.strptime(str[:-5], "%Y-%m-%d %H:%M:%S")

    # unknown
    else:
        return dt.strptime(str);

###################################################################

def format_str_to_year_month(str):
    return str[:7]

###################################################################

def merge_sort(arr):

    if len(arr) > 1:
        m = len(arr) // 2
        left = arr[:m]
        right = arr[m:]
        left = merge_sort(left)
        right = merge_sort(right)

        arr = []

        while len(left) > 0 and len(right) > 0:
            if left[0] < right[0]:
                arr.append(left.pop(0))
            else:
                arr.append(right.pop(0))

        for i in left:
            arr.append(i)
        for i in right:
            arr.append(i)

    return arr

###################################################################

def rmdir(directory):
    directory = Path(directory)
    if directory.exists():
        for item in directory.iterdir():
            if item.is_dir():
                rmdir(item)
            else:
                item.unlink()
        directory.rmdir()

###################################################################

# the meta function you call to do everything for you
def chop_csv(file_name, date_range, month_gap=1, src_path=Path(""), end_path=Path("")):

    # get the data from the specified csv file
    data = pd.read_csv(src_path / file_name)

    monthly_sums = dict()
    monthly_record_count = dict()

    date_range_unix = [date_range[0].timestamp(), date_range[1].timestamp()]
    date_range_str = [date_range[0].strftime("%Y-%m"), date_range[1].strftime("%Y-%m")]

    # figure out which indexes are the right gaps
    for i, series in data.iterrows():

        date_unix = series['deviceTime_unix']
        if date_range_unix[0] <= date_unix <= date_range_unix[1]:
            # cpm_count = series['cpm']
            cpm_count = series['temperature']

            year_month = format_str_to_year_month(series['deviceTime_local'])
            if year_month in monthly_sums:
                monthly_sums[year_month] += cpm_count
                monthly_record_count[year_month] += 1
            else:
                monthly_sums[year_month] = cpm_count
                monthly_record_count[year_month] = 1

    monthly_avgs_dict = dict()
    for date, monthly_sum in monthly_sums.items():
        monthly_avgs_dict[date] = monthly_sum / monthly_record_count[date]


######## below was commented out

    sorted_dates = merge_sort(list(monthly_avgs_dict))
    sorted_monthly_avgs = []
    for date in sorted_dates:
#         print(type(monthly_avgs_dict))
        sorted_monthly_avgs.append(monthly_avgs_dict[date])


    data_dict = {
        'month_local': sorted_dates,
        'avg_cpm': sorted_monthly_avgs
    }

    df = pd.DataFrame(data_dict, columns=['month_local', 'avg_cpm'])

    end_path.mkdir(parents=True, exist_ok=True)
    df.to_csv(end_path / file_name, index=False)
    print("pushing averaged data to " + str(end_path / file_name))

################METADATA

    # add info to the metadata file.
    metadata = dict()
    try:
        with open(end_path / "metadata.json") as file:
            metadata = json.load(file)
        print("updating metadata.json")
    except FileNotFoundError:
        print("metadata.json not found, creating new file")
    except ValueError:
        print("contents of metadata.json are not formatted correctly, creating new file")

    with open(end_path / "metadata.json", "w") as file:
        # if the "files" key does not exist
        if not "files" in metadata:
            metadata["files"] = [file_name[:-4]]
        # if the "files" key does exist but the current file is not in the array
        elif not file_name[:-4] in metadata["files"]:
            metadata["files"].append(file_name[:-4])
        # if they both exist, no need to update

        # metadata["date_range"] = date_range_str

        print(metadata)
        print(file)

        json.dump(metadata, file)



    return monthly_avgs_dict



###################################################################

def create_avg(file_names, date_range, month_gap=1, src_path=Path(""), end_path=Path("")):
    common_date_range = (dt(2016,10,1), dt(2018,3,1))
    common_date_range = (dt(2018,2,1), dt(2019,3,1))

    end_path.mkdir(parents=True, exist_ok=True)

    # format file_names
#     for i in range(len(file_names)):
    file_names = [file_name + ".csv" if file_name[-4:] != ".csv" else file_name for file_name in file_names]
    location_names = [file_name[:-4] if file_name[-4:] == ".csv" else file_name for file_name in file_names]

    avgs_by_location = dict()

    for file_name, location_name in zip(file_names, location_names):
        avgs_by_location[location_name] = chop_csv(file_name, date_range, month_gap, src_path, end_path)

    avgs_by_date = dict()

    for location, location_avgs in avgs_by_location.items():
        print(location_avgs)
        for date, monthly_avg in location_avgs.items():
            if not date in avgs_by_date:
                avgs_by_date[date] = dict()
            avgs_by_date[date][location] = monthly_avg

    print(avgs_by_date)



######## below was commented out

    # TODO: FIX THE METADATA OUTPUT

    # add info to the metadata file.
    metadata = dict()
    try:
        with open(end_path / "metadata.json") as file:
            metadata = json.load(file)
            print(metadata)
        print("updating metadata.json")
    except FileNotFoundError:
        print("metadata.json not found, creating new file")
    except ValueError:
        print("contents of metadata.json are not formatted correctly, creating new file")

    with open(end_path / "metadata.json", "w") as file:
        metadata["chart_type"] = "bar_graph"

        # metadata["date_range"] = date_range_str


        json.dump(metadata, file)

###################################################################

file_names = ["alameda_hs.csv", "campolindo.csv", "foothills.csv", "ghs.csv", "harbor_bay.csv"]
file_names = ["alameda_hs.csv", "campolindo.csv"]
file_names = ["etch_roof_weather.csv", "miramonte_os_weather.csv", "pinewood_os_weather.csv"]

date_range = (dt(2016,10,1), dt(2018,3,1))
date_range = (dt(2018,3,1), dt(2019,3,1))

create_avg(file_names, date_range, end_path=Path("monthly_avgs"))
