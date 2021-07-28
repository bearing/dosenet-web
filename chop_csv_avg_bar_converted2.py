import pandas as pd
from datetime import datetime as dt
import calendar
import json
from pathlib import Path
import time


# things to load in once
display_names = pd.read_csv("station.csv", index_col="nickname").get("Name")
# print(display_names)

type_suffixes = pd.read_csv("type_suffixes.csv", index_col="datatype").get("fileSuffix")
for type, suffix in type_suffixes.items():
    if str(suffix) == "nan":
        type_suffixes[type] = ""
# print(type_suffixes)



def display_name_of(nickname):
    # return display_names.loc[nickname]
    return nickname
    # if nickname[-7:] == "weather":
    #     return display_names.loc[nickname[:-8]]
    # return display_names.loc[nickname]


def suffix_of_type(type):
    if type_suffixes[type] == "NaN":
        return ""
    return type_suffixes[type]

def file_name_of(nickname, type):
    return f"{nickname}{suffix_of_type(type)}.csv"


# print(file_name_of("etch_roof", "humidity"))
# print(file_name_of("etch_roof", "cpm"))
# print(file_name_of("etch_roof", "temperature"))


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
    # 2020-02-25 01:57:07+00:00
    if len(str) == 25:
        return dt.strptime(str[:-6], "%Y-%m-%d %H:%M:%S")

    # 2020-03-29 21:41:44+0000
    elif len(str) == 24:
        return dt.strptime(str[:-5], "%Y-%m-%d %H:%M:%S")

    # unknown
    else:
        return dt.strptime(str);



def format_str_to_year_month(str):
    return str[:7]



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



def emptydir(directory):
    directory = Path(directory)
    if directory.exists():
        for item in directory.iterdir():
            if item.is_dir():
                rmdir(item)
            else:
                item.unlink()



def rmdir(directory):
    directory = Path(directory)
    if directory.exists():
        for item in directory.iterdir():
            if item.is_dir():
                rmdir(item)
            else:
                item.unlink()
        directory.rmdir()



# the meta function you call to do everything for you
# ^^ old comment, now is just a part of the more meta function that uses this to chop up the files of
# many sensors
def chop_csv(file_name, types, date_range, interval, src_path=Path(""), end_path=Path("")):

    # get the data from the specified csv file
    data = pd.read_csv(src_path / file_name)

    monthly_sums = dict()
    monthly_record_count = dict()

    date_range_unix = [date_range[0].timestamp(), date_range[1].timestamp()]
    date_range_str = [date_range[0].strftime("%Y-%m"), date_range[1].strftime("%Y-%m")]

    # figure out which indexes are the right gaps
    for i, row in data.iterrows():

        date_unix = row['deviceTime_unix']
        if date_range_unix[0] <= date_unix <= date_range_unix[1]:
            # print(row)
            # cpm_count = row['humidity'] ###########################cpm####################################

            year_month = format_str_to_year_month(row['deviceTime_local'])

            if year_month in monthly_sums:
                for type in types:
                    monthly_sums[year_month][type] += row[type]
                monthly_record_count[year_month] += 1
            else:
                monthly_sums[year_month] = dict()
                monthly_record_count[year_month] = dict()
                for type in types:
                    # print(row[type])
                    monthly_sums[year_month][type] = row[type]
                monthly_record_count[year_month] = 1

    # print(monthly_sums)
    # print()
    # print(monthly_record_count)
    # print("------")

    monthly_avgs_dict = dict()
    for date, monthly_sum in monthly_sums.items():
        monthly_avgs_dict[date] = dict()
        for type in types:
            monthly_avgs_dict[date][type] = monthly_sum[type] / monthly_record_count[date]

    # print(monthly_avgs_dict)
    # print("=======\n")
    return monthly_avgs_dict

    # code below commented out bc it pushed the chopped data to csv, but now it is just a helper func

#     sorted_dates = merge_sort(list(monthly_avgs_dict))
#     sorted_monthly_avgs = []
#     for date in sorted_dates:
# #         print(type(monthly_avgs_dict))
#         sorted_monthly_avgs.append(monthly_avgs_dict[date])


#     data_dict = {
#         'month_local': sorted_dates,
#         'avg_cpm': sorted_monthly_avgs
#     }

#     df = pd.DataFrame(data_dict, columns=['month_local', 'avg_cpm'])

#     end_path.mkdir(parents=True, exist_ok=True)
#     df.to_csv(end_path / file_name, index=False)
#     print("pushing averaged data to " + file_name)






def create_avg(file_names, types, date_range, interval, src_path=Path(""), end_path=Path("")):

    # type = "cpm"

    common_date_range = (dt(2016,10,1), dt(2018,3,1))

    # format file_names
    # location.csv, location_weather.csv
    file_names = sorted([file_name + ".csv" if file_name[-4:] != ".csv" else file_name for file_name in file_names])
    # location, location_weather
    location_names = [file_name[:-4] if file_name[-4:] == ".csv" else file_name for file_name in file_names]
    # Location High School
    display_names = [display_name_of(location_name) for location_name in location_names]
    # location
    # location_names = [file_name[:-12] if file_name[-11:] == "weather.csv" else file_name for file_name in file_names]

    avgs_by_location = dict()

    # for file_name, location_name in zip(file_names, location_names):
    #     avgs_by_location[location_name] = chop_csv(file_name, types, date_range, interval, src_path, end_path)
    # print(avgs_by_location)

    for location_name in location_names:
        files_to_avg = {}
        for type in types:
            file_name_of_type = file_name_of(location_name, type)
            if not file_name_of_type in files_to_avg:
                files_to_avg[file_name_of_type] = []
            files_to_avg[file_name_of_type].append(type)
        
        avgs_from_files = []
        for file_name, types_in_file in files_to_avg.items():
            avgs_from_files.append(chop_csv(file_name, types_in_file, date_range, interval, src_path, end_path))
        # print(avgs_from_files)

        location_avgs = dict()
        for file_avg in avgs_from_files:
            for date, avgs in file_avg.items():
                if not date in location_avgs:
                    location_avgs[date] = dict()
                # TODO:THERE IS A BETTER WAY OF DOING THIS #########################################################
                # print(avgs)
                for type in types:
                    if not type in avgs:
                        if not type in location_avgs[date]:
                            location_avgs[date][type] = "NaN"
                    else:
                        location_avgs[date][type] = avgs[type]
                
                    
                # for type, avg in avgs.items():
                #     location_avgs[date][type] = avg

        avgs_by_location[location_name] = location_avgs

    print(avgs_by_location)

    avgs_by_date = dict()

    for location, location_avgs in avgs_by_location.items():
        for date, interval_avg in location_avgs.items():
            if not date in avgs_by_date:
                avgs_by_date[date] = dict()
            for type in types:
                if not type in avgs_by_date[date]:
                    avgs_by_date[date][type] = dict()
                print(interval_avg)
                # print()
                # print(interval_avg["pressure"])
                # print()
                # print(avgs_by_date[date])
                # print()
                # print(avgs_by_date[date][type])
                # print()
                # print(avgs_by_date[date][type][location])
                avgs_by_date[date][type][location] = interval_avg[type]

    # print(avgs_by_date)
    # print()
    # print("sorted")
    # print()

    sorted_dates = merge_sort(list(avgs_by_date))
#     print(sorted_dates)

    csv_exports = []

    for date in sorted_dates:
        avg_vals = dict()

#         for key, val in avgs_by_date[date].items():
#             locations.append(key)
#             avg_cpms.append(val)

        # print(list(avgs_by_date[date][types[0]]))
        # print(avgs_by_date[date])

        for location in location_names:
            avg_vals[location] = dict()
            for type in types:
                if location in list(avgs_by_date[date][type]):
                    avg_vals[location][type] = avgs_by_date[date][type][location]
                    # avg_cpms.append(avgs_by_date[date][type][location])
                else:
                    avg_vals[location][type] = "NaN"
                    # avg_cpms.append("NaN")

        # print(avg_cpms)

        export_dict = {'location': list(avg_vals)}
        for type in types:
            export_dict[f"avg_{type}"] = []
            for location in list(avg_vals):
                export_dict[f"avg_{type}"].append(avg_vals[location][type])
        # print(export_dict)

        csv_exports.append(pd.DataFrame(export_dict, columns=list(export_dict)))
#         print()
#         print(export_dict)
#         print()
        # csv_exports.append(pd.DataFrame(export_dict, columns=['location', 'avg_' + type]))

    # print(csv_exports[5])
    # type(csv_exports)
    # type(csv_exports[5])

    emptydir(end_path)
    end_path.mkdir(parents=True, exist_ok=True)

    for i, df in enumerate(csv_exports):
        df.to_csv(end_path / (f"data_{i}.csv"), index=False)



    with open(end_path / "metadata.json", "w") as file:
        metadata = {
            "chart_type": "bar_graph",
            "description": "insert desription of data to help people know what the data in the files is for. human read, not machine parsed.",
            "file_name": "data",
            "file_count": len(csv_exports),
            "locations": location_names,
            "display_names": display_names,
            "start_date": format_str_to_year_month(str(date_range[0])),
            "interval": interval,
            "datatypes": types,
        }

        json.dump(metadata, file)



start_time = time.perf_counter()



file_names = ["alameda_hs.csv", "campolindo.csv", "foothills.csv", "ghs.csv", "harbor_bay.csv"]
file_names = ["alameda_hs.csv", "campolindo.csv", "foothills.csv", "ghs.csv", "harbor_bay.csv", "miramonte.csv", "lbl.csv", "koriyama_ch.csv", "kaist.csv", "jlhs.csv"]
file_names = ["etch_roof_weather.csv", "miramonte_os_weather.csv", "pinewood_os_weather.csv", "chs_os_weather.csv"]
file_names = ["etch_roof.csv", "miramonte_os.csv", "pinewood_os.csv", "chs_os.csv"]

# file_names = ["alameda_hs.csv", "campolindo.csv"]
date_range = (dt(2016,10,1), dt(2018,3,1))
date_range = (dt(2018,3,1), dt(2019,3,1))

# create_avg(file_names, ("temperature", "pressure", "humidity"), date_range, interval="month", end_path=Path("monthly_avgs"))
create_avg(file_names, ("temperature", "humidity", "cpm"), date_range, interval="month", end_path=Path("monthly_avgs"))
# create_avg(file_names, ("temperature", "humidity"), date_range, interval="day", end_path=Path("daily_avgs"))



end_time = time.perf_counter()

print(f"Finished formatting data in {(end_time - start_time) // 60 :0.0f}:{(end_time - start_time) % 60 :0.3f} minutes.")