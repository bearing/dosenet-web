import os
from copy import deepcopy
from colour import Color

import numpy
import pandas as pd
import plotly.express as px
import glob
import json
import csv


# remove all the irrelevant files
def filter_files():
    global my_files
    my_files = sorted(glob.glob("data/*_month.csv"), key=str.lower)
    weather_files = glob.glob("data/*_weather_month.csv")
    adc_files = glob.glob("data/*_adc_month.csv")
    aq_files = glob.glob("data/*_aq_month.csv")
    d3s_files = glob.glob("data/*_d3s_month.csv")

    for i in [weather_files, adc_files, aq_files, d3s_files]:
        for j in i:
            my_files.remove(j)

    remove_files = []

    # remove blank files
    for f in my_files:
        try:
            data = list(csv.reader(open(f)))

            # locations with 0 or 1 data point(s)
            if len(data) < 2:
                remove_files.append(f)
            else:
                col = data[0].index("cpm")
                cpms = set([i[col] for i in data[1:]])
                # delete or "ignore" file if every cpm is 0 or blank
                if len(cpms) == 1 and (float(list(cpms)[0]) == 0 or list(cpms)[0] == ""):
                    remove_files.append(f)
                else:
                    for i in data[1:]:
                        # delete entire row if row's "cpm" column value is 0 or empty
                        if i[col] in [0, ""]:
                            data.remove(i)
                            break
        # catch the "_csv.Error: line contains NUL" error
        except:
            remove_files.append(f)

    my_files = [i for i in my_files if i not in remove_files]

# create average cpm/msv csv files used for the first graph
# all measurements and errors are presented in a list in a cell
def all_avg_csvs():
    # dose rate units and their conversion rates relative to cpm
    global conversions
    conversions = {"cpm": 1, "msv": 0.036}

    # column headers for each file
    col_all = ["file_name", "Location"]
    col_avg = deepcopy(col_all)
    col_all.append("utc time")

    json_data = json.load(open("data/output.geojson"))

    # 2d array representing the dataframe we're writing to the csv file
    df_all = [[i["properties"]["csv_location"], i["properties"]["Name"]] for i in json_data["features"]]

    # delete bad-data files from df
    df_all = [i for i in df_all if f"data\\{i[0]}_month.csv" in my_files]

    # sort df alphabetically by the file_name column so it matches the order of the files in my_files
    df_all = sorted(df_all, key=lambda x: x[0].lower())
    df_avg = deepcopy(df_all)

    # add file-specific column headers
    for unit in list(conversions.keys()):
        col_all += [f"All {unit}s", f"{unit} errors"]
        col_avg.append(f"Average {unit}")

    # measurements = dose rates = counts
    utc_time, all_measurements, all_errors, avg_measurements = [[] for i in range(4)]

    # open and read every file
    for file in my_files:
        with open(file) as f:
            csv_data = list(csv.reader(f))

            # each file has a list of mes and err
            # mes is short for measurement
            f_time, f_mes, f_err = [[] for i in range(3)]

            # they don't have "msv" columns; we have to calculate that ourselves
            time_col = csv_data[0].index("deviceTime_utc")
            mes_col = csv_data[0].index("cpm")
            err_col = csv_data[0].index("cpmError")

            # each sublist is a row
            for row in csv_data[1:]:
                time = row[time_col]

                # round for consistency
                mes = float(row[mes_col])
                err = float(row[err_col])

                f_time.append(time)
                f_mes.append(mes)
                f_err.append(err)

            utc_time.append(f_time)

            rates = list(conversions.values())
            all_measurements.append([[round(i * rate, 6) for i in f_mes] for rate in rates])
            all_errors.append([[round(i * rate, 6) for i in f_err] for rate in rates])
            avg_measurements.append([round(sum(f_mes) / len(f_mes) * rate, 6) for rate in rates])

    # add in the measurements and their errors
    for i in range(len(df_all)):
        df_all[i].append(utc_time[i])

        for j in range(len(conversions)):
            df_all[i].append(all_measurements[i][j])
            df_all[i].append(all_errors[i][j])
            df_avg[i].append(avg_measurements[i][j])

    # add in the column headers
    df_all.insert(0, col_all)
    df_avg.insert(0, col_avg)

    for _type in ["all", "average"]:
        # write df to csv file
        with open(f"{_type}.csv", "w", newline="") as f:
            df = df_all if _type == "all" else df_avg
            csv.writer(f).writerows(df)

# first graph - averages
# sort each sensor location by region based on timezone
def set_colors():
    fn = "average.csv"
    f = open(fn)
    json_file = json.load(open("data/output.geojson"))
    name_zone = [[i["properties"]["Name"], i["properties"]["timezone"].split("/")[0]] for i in json_file["features"]]

    data = list(csv.reader(f))

    # region is 'America', while region_color is the color code associated with 'America'
    data[0].append("region")
    data[0].append("region_color")

    region_col = data[0].index("region")

    for location in data[1:]:
        for i in name_zone:
            if i[0] == location[1]:
                location.append(i[1])
                break

    # create colormap
    continents = list(set([i[1].split("/")[0] for i in name_zone]))
    num_regions = len(continents)

    # creates a colormap from the visible spectrum divided into "num_regions" intervals from "start" to "end"
    start = Color("red")
    end = Color("blue")
    color_map = list(start.range_to(end, num_regions))

    # maps continents to colors
    cont_color = {continents[i]: color_map[i] for i in range(num_regions)}

    for location in data[1:]:
        # hex_l is the 6-digit hex color code
        color_code = cont_color[location[region_col]].hex_l
        location.append(color_code)

    f.close()
    with open(fn, "w", newline='') as f:
        csv.writer(f).writerows(data)


def plot():
    # string quoting must conform to json standards
    def jformat(arg):
        arg = arg.replace("'", "!").replace('"', "'").replace("!", '"')
        return json.loads(arg)

    df_avg = pd.read_csv("average.csv")

    for unit in list(conversions.keys()):
        funit = "CPM (counts per minute)" if unit == "cpm" else "μSv/hr (microsieverts per hour)"

        # generate graphs as html files
        fig = px.bar(data_frame=df_avg, x="Location", y=f"Average {unit}", color="region", labels={"region": "Region", f"Average {unit}": funit}, title="Average dose rates ordered by region")
        fig.write_html(f"{unit}_plot.html")


# close all related files before running this program
def main():
    filter_files()
    all_avg_csvs()
    set_colors()
    plot()

main()
