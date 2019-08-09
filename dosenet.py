import os
import numpy
import pandas
import glob
import json
import csv
import pickle
import time
import itertools
import argparse

def create_my_files():
    set_dir()
    all_files = glob.glob('*_month.csv')
    weather_files = glob.glob('*_weather_month.csv')
    adc_files = glob.glob('*_adc_month.csv')
    aq_files = glob.glob('*_aq_month.csv')
    d3s_files = glob.glob('*_d3s_month.csv')
    broken_files = []
    remove_files = []
    remove_files.extend(weather_files)
    remove_files.extend(adc_files)
    remove_files.extend(aq_files)
    remove_files.extend(d3s_files)
    for file in all_files:
        # put blank files into broken_files
        if sum(1 for line in open(file)) == 1 or sum(1 for line in open(file)) == 0:
            # locations with 0 or 1 data point(s)
            broken_files.append(file)
        else: # if it's not blank, so it has columns to parse through
            if file not in remove_files: # if it has a "cpm" column:
                data = pandas.read_csv(file)
                if numpy.average(data.cpm) == 0: # if the average of the cpms is 0, then all the values are 0
                    broken_files.append(file) # delete the file from my_files
                else:
                    # drop the data points in each file where a single data point does not exist or equals 0
                    data.drop(data[data.cpm == 0].index, axis=0, inplace=True)
                    #data.drop(data[data.cpm == ""].index, axis=0, inplace=True)
                    data.to_csv(file, index=False)
    remove_files.extend(broken_files)
    global my_files
    #my_files is a list of all location_month.csv stuff...MONTH only!!!!!
    my_files = [file for file in all_files if file not in remove_files]
    #make csv file
    my_files_csv = pandas.DataFrame(my_files, columns=['csv file'])
    my_files_csv.to_csv('my_files.csv', index=False)
    #pickle (store) my_files into a text file cause why not
    with open('myfiles', 'wb') as f: # 'wb' makes it a binary file
        pickle.dump(my_files, f)
    read_json_file()

def read_json_file():
    set_dir()
    global location
    location = sorted([file[:-10] for file in my_files])
    list_of_official_names = [] #pretty name
    global list_of_csv_locations
    list_of_csv_locations = [] #ugly name
    global json_csv_list
    json_csv_list = []
    json_file_name = "output.geojson"
    # Directory structure on surver is not flat
    if not os.path.isfile(json_file_name):
      json_file_name = "../output.geojson"
    with open(json_file_name) as json_file:
        data = json.load(json_file)
        for i in range(0, len(data["features"])): #for all the lists in the json file:
            if data["features"][i]["properties"]["csv_location"] in location: #if the name in the list in the json file does NOT have bad data (all 0s)
                # "Name" is the readable name, but "csv_location" is the abbreviated version of the name
                list_of_official_names.append(data["features"][i]["properties"]["Name"])
                list_of_csv_locations.append(data["features"][i]["properties"]["csv_location"])
                # LIST: [[name1, csvlocation1], [name2, csvlocation2], [name3, csvlocation3], [name4, csvlocation4], [name5, csvlocation5], etc]
                json_csv_list.append([data["features"][i]["properties"]["Name"], data["features"][i]["properties"]["csv_location"]])
                # originally, the [i] in average_cpms_list was "file" in my_files, which is organized alphabetically
                # data features, properties name is organized differently, so uhh...I guess we have to sort it?
                # see replace_abbrev_filename_with_official_name method
    create_json_based_csv()

def create_json_based_csv():
    set_dir()
    json_based_dataframe = pandas.DataFrame(json_csv_list, columns=['Official Name', 'csv Location (abbrev)'])
    json_based_dataframe.to_csv(r'json_based_with_both_names.csv', index=False)
    sort_official_names_alpha()

def sort_official_names_alpha():
    set_dir()
    with open('json_based_with_both_names.csv', 'r') as f:
        # convert the csv file into an array named "data"
        data = [line for line in csv.reader(f)]
        # preserves header row
        data[1:] = sorted(data[1:], key=lambda x: x[0])
    # converts data array back into csv file
    with open('json_based_with_both_names.csv', 'w') as f:  # no newline='' on purpose
        csv.writer(f).writerows(data)
    create_all_cpms()

def create_all_cpms():
    set_dir()
    all_cpm_data = []
    list_of_files = ['list of files']
    name_data = pandas.read_csv('json_based_with_both_names.csv')
    abbrev_names = (name_data["csv Location (abbrev)"] + "_month.csv").tolist()
    for file in abbrev_names:
        list_of_files.append(file)
        all_data = pandas.read_csv(file)
        cpm_data = all_data["cpm"].tolist()
        all_cpm_data.append(cpm_data)
    if all_cpm_data[0] != list_of_files:
        all_cpm_data.insert(0, list_of_files)
    if all_cpm_data[1][0] != abbrev_names[0]:
        for array in range(1, len(all_cpm_data)):
            all_cpm_data[array].insert(0, abbrev_names[array - 1])

    all_cpm_data = [list(row) for row in itertools.zip_longest(*all_cpm_data, fillvalue='')]
    with open('all_cpms.csv', 'w', newline='') as f:  # no newline='' on purpose
        csv.writer(f).writerows(all_cpm_data)
    read_csv_file_and_calc_average()

def read_csv_file_and_calc_average():
    set_dir()
    with open('json_based_with_both_names.csv', 'r') as f:
        reader = csv.reader(f)
        file_data = list(reader)
    # average_cpms_list is a list of many two-value lists that all have [location, average cpm]
    global average_cpms_list
    average_cpms_list = []
    # get rid of blank spaces...ugh
    file_data = [x for x in file_data if x != []]
    global location_data
    location_data = []
    for entry in range(1, len(file_data)):
        location_data.append(file_data[entry][1] + "_month.csv")
    for file in location_data:
        global average_cpms
        #average_cpms is a variable that changes (gets replaced), so if you print it outside of the loop, it will only print the last value (from the last file)
        #same with individual_file_cpms, except individual_file_cpms is a list of cpms that changes, while average_cpms is an average of the floats in that list
        data = pandas.read_csv(file)
        #retrieve data from one column (named "cpm") and add it to the individual_file_cpms list
        individual_file_cpms = data.cpm.tolist()
        average_cpms = numpy.average(individual_file_cpms)
        average_cpms_list.append([file, average_cpms])
    replace_abbrev_filename_with_official_name()

def replace_abbrev_filename_with_official_name():
    set_dir()
    def blanklines(rownum):
        if rownum % 2 == 0:
            return False
        return True
    #remove blank (even) rows (keep only odd rows)
    json_based_no_spaces = pandas.read_csv('json_based_with_both_names.csv', skiprows=lambda x: blanklines(x))
    #update json_based_with_both_names.csv
    json_based_no_spaces.to_csv(r'json_based_with_both_names.csv', index=False)
    #make a list to retrieve official_name values from
    json_based_no_spaces_list = json_based_no_spaces.values.tolist()
    for filetoreplace in range(0, len(my_files)):
        #replace ugly names with pretty names
        average_cpms_list[filetoreplace][0] = json_based_no_spaces_list[filetoreplace][0]
    create_final_average_csv_file()

def create_final_average_csv_file():
    set_dir()
    #make the final csv file which we will use to graph
    average_cpm_dataframe = pandas.DataFrame(average_cpms_list, columns=['Location', 'Average cpm'])
    average_cpm_dataframe.to_csv(r'average_cpm.csv', index=False)
    create_time_range_and_append_to_my_files_with_average_cpm()

def create_time_range_and_append_to_my_files_with_average_cpm():
    set_dir()
    global all_files_and_start_and_end_ranges
    all_files_and_start_and_end_ranges = []
    with open('json_based_with_both_names.csv', 'r') as namedata:
        reader = csv.reader(namedata)
        global names_dict
        names_dict = dict(reader)
    with open('average_cpm.csv', 'r') as cpmdata:
        reader = csv.reader(cpmdata)
        global cpms_dict
        cpms_dict = dict(reader)
    for file in my_files:
        global simplefilename
        simplefilename = file[:-10]
        global officialfilename
        officialfilename = list(names_dict.keys())[list(names_dict.values()).index(simplefilename)]
        filedata = pandas.read_csv(file)
        # data_from_each_file is getting overwritten every time the statement loops over
        data_from_each_file = filedata["deviceTime_local"].tolist()
        global end_of_month_or_most_recent_time_of_each_file
        end_of_month_or_most_recent_time_of_each_file = data_from_each_file[0]
        try:
            global start_of_month_or_180_entries_from_most_recent_time_of_each_file
            start_of_month_or_180_entries_from_most_recent_time_of_each_file = data_from_each_file[180]
        except IndexError:
            start_of_month_or_180_entries_from_most_recent_time_of_each_file = data_from_each_file[-1]
        #the second parameter here allows you to search a dictionary backwards
        all_files_and_start_and_end_ranges.append([file, list(names_dict.keys())[list(names_dict.values()).index(simplefilename)], start_of_month_or_180_entries_from_most_recent_time_of_each_file, end_of_month_or_most_recent_time_of_each_file, cpms_dict.get(officialfilename), "", ""])
        #update csv
        my_files_csv = pandas.DataFrame(all_files_and_start_and_end_ranges, columns=['csv file', 'Name', 'start of range', 'end of range/most recent time', 'Average cpms', 'overall most recent', 'one month back'])
        my_files_csv.to_csv(r'my_files.csv', index=False)
    sort_my_files_by_recent_date()

def sort_my_files_by_recent_date():
    set_dir()
    with open('my_files.csv', 'r') as f:
        data = [line for line in csv.reader(f)]
        #sorted_data is just used to find "new_cell", it's not saved so "data" is still in alphabetical order
        sorted_data = sorted(data[1:], key=lambda x: x[3]) # sorting the whole csv file by column index 3, preserving the header (ignoring the 1st row)
        new_cell = sorted_data[-1][3]
        # data[row][column]
        data[1][5] = new_cell[:-6]
    with open('my_files.csv', 'w', newline='') as f: #newline='' makes sure there aren't random blank lines everywhere when the rows are written
        csv.writer(f).writerows(data)
    one_month_back()

def one_month_back():
    set_dir()
    os.environ['TZ'] = 'UTC'
    with open('my_files.csv', 'r') as f:
        data = [line for line in csv.reader(f)]
        mostrecenttime = data[1][5]
        pattern = '%Y-%m-%d %H:%M:%S'
        epochtime = int(time.mktime(time.strptime(mostrecenttime, pattern)))
        onemonthbackepoch = int(epochtime - 2635200)
        data[1][6] = time.strftime(pattern, time.localtime(onemonthbackepoch))
    with open('my_files.csv', 'w', newline='') as f:
        csv.writer(f).writerows(data)
    create_colormap()

def create_colormap():
    # create 2 extra columns with sorted cpms from greatest to least in one column and their corresponding locations #
    set_dir()
    columns_list = ['list of files', 'Location', 'Average cpm', 'All locations (sorted by cpm)', 'All average cpms (sorted)']
    cpmdata = pandas.read_csv('average_cpm.csv')
    name_data = pandas.read_csv('json_based_with_both_names.csv')
    all_average_cpms_unsorted = cpmdata["Average cpm"].tolist() # create all average cpms column
    all_average_cpms = sorted(all_average_cpms_unsorted, key=float, reverse=True) # sorting just one column (all average cpms)
    all_locations = cpmdata["Location"].tolist() # create all locations column
    #make the combined list with all placeholder zeros
    #don't do all_locations_and_cpms_list = [[0, 1]] * len(all_locations) because then if you try to reference a value using its index, you will reference all of them
    all_locations_and_cpms_list = [[0, 0] for _ in range(0, len(all_locations))]
    for entry in range(0, len(all_locations)):
        # make new list from which to create new csv filed
        all_locations_and_cpms_list[entry][0] = all_locations[entry]
        all_locations_and_cpms_list[entry][1] = all_average_cpms_unsorted[entry]
    all_locations_and_cpms = pandas.DataFrame(all_locations_and_cpms_list, columns=['All locations', 'All average cpms'])
    all_locations_and_cpms.to_csv(r'all_locations_and_cpms.csv', index=False)
    with open('all_locations_and_cpms.csv', 'r') as f:
        data = [line for line in csv.reader(f)]
        data = sorted(data[1:], key=lambda x: x[1], reverse=True) #sort by column index 1 (second column) - all average cpms
    with open('all_locations_and_cpms.csv', 'w', newline='') as f:
        csv.writer(f).writerows(data)
    rounded_list_avg = []
    rounded_list_sorted = []
    column = 4  # how many total columns you want
    # add zeros to the end of each sub-list as a placeholder
    new_average_cpms_list = list(map(lambda x: x + ([0] * (column - len(x))), average_cpms_list))
    # converts csv file into a list --> pandas dataframe --> list
    with open('all_locations_and_cpms.csv', 'r') as f:
        reader = csv.reader(f)
        locationlist = list(reader)
    locationcsv = pandas.DataFrame(locationlist, columns=['location', 'cpm'])
    locationdata = locationcsv["location"].tolist()
    for entry in range(0, len(new_average_cpms_list)):
        #substitute each 0 with an actual location value
        new_average_cpms_list[entry][2] = locationdata[entry]
        # now substitute in the 4th column
        new_average_cpms_list[entry][3] = all_average_cpms[entry]
        rounded_list_avg.append(new_average_cpms_list[entry][3])
        rounded_list_sorted.append(new_average_cpms_list[entry][1])
    #create two lists with elements rounded to 6 decimal places
    rounded_list_avg = list(numpy.around(numpy.array(rounded_list_avg), 6))
    rounded_list_sorted = list(numpy.around(numpy.array(rounded_list_sorted), 6))
    #substitute each element in rounded list with a rounded decimal
    for entry in range(0, len(new_average_cpms_list)):
        new_average_cpms_list[entry][3] = rounded_list_avg[entry]
        new_average_cpms_list[entry][1] = rounded_list_sorted[entry]

    #########################################################
    ##### add file names to a column in average_cpm.csv #####
    #########################################################

    new_average_cpms_list = list(map(lambda x: x + ([''] * (column - len(x))), new_average_cpms_list))

    global abbrev_names
    global official_names
    abbrev_names = (name_data["csv Location (abbrev)"] + "_month.csv").tolist()
    official_names = name_data["Official Name"].tolist()

    for slot in range(0, len(new_average_cpms_list)):
        new_average_cpms_list[slot].insert(0, abbrev_names[slot])

    average_cpm_dataframe = pandas.DataFrame(new_average_cpms_list, columns=columns_list)
    average_cpm_dataframe.to_csv(r'average_cpm.csv', index=False)

    #################################################################################
    ##### update my_files.csv so the first two columns are in the correct order #####
    #################################################################################

    cpm_data = pandas.read_csv('average_cpm.csv')
    average_cpms = cpm_data["Average cpm"].tolist()

    with open('my_files.csv', 'r') as f:
        #convert the csv file into an array named "data"
        file_data = [line for line in csv.reader(f)]
    for entry in range(1, len(file_data) - 1):
        file_data[entry][0] = abbrev_names[entry - 1]
        file_data[entry][1] = official_names[entry - 1]
        file_data[entry][4] = average_cpms[entry - 1]

    with open('my_files.csv', 'w', newline='') as f: # newline = '' removes spaces between the rows
        csv.writer(f).writerows(file_data)

    os.remove("all_locations_and_cpms.csv")
    create_colormap_2()

def create_colormap_2():
    set_dir()
    from colour import Color
    color_range_start = Color('#840000')
    color_range_end = Color('#0000BD')
    color_range = list(color_range_start.range_to(color_range_end, len(official_names)))
    hex_colors = []
    for color in color_range:
        hex_colors.append(color.hex_l)
    with open('average_cpm.csv', 'r') as f:
        cpm_data = [line for line in csv.reader(f)]
    cpm_data[0].append('hex color codes')
    # transpose
    cpm_data = [list(row) for row in itertools.zip_longest(*cpm_data, fillvalue='')]
    column = len(hex_colors) + 1  # total columns
    # add blanks to the end of each sub-list as a placeholder
    cpm_data = list(map(lambda x: x + ([''] * (column - len(x))), cpm_data))
    for entry in range(1, len(hex_colors) + 1):
        cpm_data[len(cpm_data) - 1][entry] = hex_colors[entry - 1]
    # re-transpose
    cpm_data = [list(row) for row in itertools.zip_longest(*cpm_data, fillvalue='')]
    with open('average_cpm.csv', 'w', newline='') as f:
        csv.writer(f).writerows(cpm_data)
    add_tracename()

def add_tracename():
    set_dir()
    for file in range(0, len(location_data)):
        with open(location_data[file], 'r') as f:
            month_file_data = [line for line in csv.reader(f)]
            month_file_data = [list(row) for row in itertools.zip_longest(*month_file_data, fillvalue='')]
            if month_file_data[0][0] != 'tracename': # if and only if there isn't already tracename
                month_file_data.insert(0, [''])
                month_file_data[0] = ['' for _ in range(0, len(month_file_data[1]) - 1)]
                month_file_data[0].insert(0, 'tracename')
                month_file_data[0][1] = official_names[file]
            month_file_data = [list(row) for row in itertools.zip_longest(*month_file_data, fillvalue='')]
        with open(location_data[file], 'w', newline='') as f:
            csv.writer(f).writerows(month_file_data)
    add_microsieverts_graph()

def add_microsieverts_graph():
    set_dir()
    columns_list = ['list of files', 'Location', 'Average msv', 'All locations (sorted by msv)', 'All average msvs (sorted)']
    with open('average_cpm.csv', 'r') as f:
        msv_data = [line for line in csv.reader(f)]
    msv_data = [list(row) for row in itertools.zip_longest(*msv_data, fillvalue='')]
    for col_name in range(0, len(msv_data) - 1):
        msv_data[col_name][0] = columns_list[col_name]

    # convert average msv
    for index in range(1, len(msv_data[2])):
        msv_data[2][index] = numpy.around((float(msv_data[2][index]) * 0.036), decimals = 6) # conversion factor = 0.036
    # convert all average msvs (sorted)
    for index in range(1, len(msv_data[4])):
        msv_data[4][index] = numpy.around((float(msv_data[4][index]) * 0.036), decimals = 6) # conversion factor = 0.036
    msv_data = [list(row) for row in itertools.zip_longest(*msv_data, fillvalue='')]
    with open('average_msv.csv', 'w', newline='') as f:
        csv.writer(f).writerows(msv_data)
    add_all_msvs()

def add_all_msvs():
    set_dir()
    with open('all_cpms.csv', 'r') as f:
        msv_data = [line for line in csv.reader(f)]
        msv_data = [list(row) for row in itertools.zip_longest(*msv_data, fillvalue='')]
    for array in range(0, len(msv_data)):
        msv_data[array] = list(filter(lambda x: x != '', msv_data[array]))
    for array2 in range(0, len(msv_data)):
        for element in range(0, len(msv_data[array2])):
            try:
                if type(float(msv_data[array2][element])) == float:
                    msv_data[array2][element] = float(msv_data[array2][element]) * 0.036
            except ValueError:
                msv_data[array2][element] = msv_data[array2][element]
    msv_data = [list(row) for row in itertools.zip_longest(*msv_data, fillvalue='')]
    with open('all_msvs.csv', 'w', newline='') as f:
        csv.writer(f).writerows(msv_data)
    add_msv_errors()

def add_msv_errors():
    set_dir()
    all_msv_errors = []
    all_locations = []
    for location in abbrev_names:
        all_locations.append(location)
        cpm_data = pandas.read_csv(location)
        error_data = cpm_data["cpmError"].tolist()
        for error in range(0, len(error_data)):
            error_data[error] = float(error_data[error]) * 0.036
        all_msv_errors.append(error_data)
    if all_msv_errors[0][0] != abbrev_names[0]:
        for array in range(0, len(all_msv_errors)):
            all_msv_errors[array].insert(0, all_locations[array])
    all_msv_errors = [list(row) for row in itertools.zip_longest(*all_msv_errors, fillvalue='')]
    with open('all_msv_errors.csv', 'w', newline='') as f:
        csv.writer(f).writerows(all_msv_errors)

def main():
    global path_name
    parser = argparse.ArgumentParser(description="Script to prepare network data for website graphs")
    parser.add_argument('inpath', type=str,
                                  help="Full path to files to run over")
    args = parser.parse_args()
    path_name = args.inpath
    create_my_files()

def set_dir():
    os.chdir(path_name)

main()
