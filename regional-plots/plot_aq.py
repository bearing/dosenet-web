from py_mini_racer import py_mini_racer

import pandas as pd
import plotly.express as px
import glob, json, csv


# remove all the irrelevant files
def filter_files():
	my_files = glob.glob("data/*_aq_month.csv")
	remove_files = []

	# remove blank files
	for f in my_files:
		try:
			data = list(csv.reader(open(f)))

			# locations with 0 or 1 data point(s)
			if len(data) < 2:
				remove_files.append(f)
			else:
				col = data[0].index("PM10")
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
	return my_files

def create_csv(my_files):
	# dose rate units and their conversion rates relative to cpm
	sizes = ["25", "10"]
	PM_sizes = ["PM25", "PM10"]
	types = ["PM", "AQI"]

	json_data = json.load(open("data/output.geojson"))

	# [['asaka_os', 'Asaka High School Outside', 'Asia'], ['chs_os', 'Campolindo HS Outside', 'America'], ['etch_roof', 'Etcheverry Roof', 'America'], ['westend', 'Westend', 'Europe']]
	all_sizes = []
	for size in sizes:
		all_sizes.append(f"PM{size}")
		all_sizes.append(f"AQI{size}")
		all_sizes.append(f"AQI_Category{size}")
	col_headers = ["file_name", "Location", "Region"] + all_sizes + ["Start", "Stop"]
	avg_PM_2D = [[i["properties"]["csv_location"], i["properties"]["Name"], i["properties"]["timezone"].split("/")[0]] for i in json_data["features"]]

	# delete bad-data files from df
	avg_PM_2D = [i for i in avg_PM_2D if f"data\\{i[0]}_aq_month.csv" in my_files]

	# sort df alphabetically by the file_name column so it matches the order of the files in my_files
	avg_PM_2D = sorted(avg_PM_2D, key=lambda x: x[0].lower())

	ctx = py_mini_racer.MiniRacer()
	ctx.eval(open("calcAQI.js").read())
	max_aqi = dict(zip(sizes, [0 for _ in range(len(sizes))]))

	# open and read every file
	for i in range(len(avg_PM_2D)):
		file_name, location, region = avg_PM_2D[i]
		time_col = "deviceTime_utc"

		csv_data = pd.read_csv(f"data\\{file_name}_aq_month.csv", usecols=[time_col] + PM_sizes)
		for size in PM_sizes:
			m = csv_data[size].tolist()
			avg_PM = round(sum(m) / len(m), 6)
			avg_PM_2D[i].append(avg_PM)

			# first arg is one of ["PM25", "PM10"] and second arg is the PM as a float
			avg_AQI, AQI_category = ctx.call("CalcAQI", size, avg_PM)
			avg_PM_2D[i].append(avg_AQI)
			avg_PM_2D[i].append(AQI_category)

			if avg_AQI > max_aqi[size.replace("PM", "")]:
				max_aqi[size.replace("PM", "")] = avg_AQI

		utc_times = csv_data[time_col].tolist()
		avg_PM_2D[i].append(utc_times[-1].replace("+00:00", " UTC"))
		avg_PM_2D[i].append(utc_times[0].replace("+00:00", " UTC"))

	df_avg = pd.DataFrame(avg_PM_2D, columns=col_headers)
	df_avg.to_csv("generated/average_aq.csv", index=False)
	return sizes, types, max_aqi


def plot(sizes, types, max_aqi):
	df_avg = pd.read_csv("generated/average_aq.csv")

	for size in sizes:
		for type_ in types:
			fig = px.bar(df_avg,
				x="Location",
				y=f"{type_}{size}",
				title="Average air quality measurements ordered by region",
				color="Region",
				labels={"PM25":"PM2.5", "AQI25": "AQI2.5"},
				hover_data=["Start", "Stop"],
			)

			for i in fig.data:
				i.hovertemplate = "<b>%{x}</b><br>Region: %{data.legendgroup}<br>" + f"{type_}{size.replace('25', '2.5')}" + ": %{y}<br>Data collected from <i>%{customdata[0]}</i> to <i>%{customdata[1]}</i><extra></extra>"

			if type_ == "AQI":
				# zoom in
				fig.update_layout(yaxis=dict(range=[0, max_aqi[size] + 20]))

				for lower, upper, color in [[0, 50, "#00e400"], [50, 100, "#ffff00"], [100, 150, "#ff7e00"], [150, 200, "#ff0000"], [200, 300, "#99004c"], [300, 500, "#7e0023"]]:
					fig.add_hrect(
						y0=lower, y1=upper,
						fillcolor=color, opacity=0.5,
						layer="below", line_width=0,
					)

			fig.write_html(f"generated/{type_}{size}_plot.html")


# close all related files before running this program
def main():
    my_files = filter_files()
    sizes, types, max_aqi = create_csv(my_files)
    plot(sizes, types, max_aqi)

main()
