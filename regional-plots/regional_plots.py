import os, re, csv, json
import pandas as pd
import plotly.express as px

class BarPlot(object):
	"""
	"""
	def __init__(self, sensor_type="", avg_csv="average.csv", data_dir="data", generated_dir="generated", my_files=[]):
		"""
		sensor_type: str in the `available_sensors` list

		avg_csv: str; the file name of the csv file used to plot the data (will be written to and read from)

		data_dir and generated_dir: str; absolute path or relative path from the current working directory (directory that this script is called from, not in which this script resides)
			* 'data'
			* 'c:/users/yay/regional-plots/data'

		my_files: iterable of files that correspond with the `sensor_type` and have usable data in them; typically generated using the `filter_files()` method, but can be manually set for testing purposes
		"""
		self.sensor_type = sensor_type
		self.avg_csv = avg_csv
		self.data_dir = data_dir
		self.generated_dir = generated_dir
		self.my_files = my_files

	# attribute validation
	@property
	def sensor_type(self):
		return self.__sensor_type
	@sensor_type.setter
	def sensor_type(self, sensor_type):
		if not isinstance(sensor_type, str):
			raise TypeError(f"sensor_type must be a str, not '{type(avg_csv).__name__}'")
		available_sensors = ['"radiation"', '"aq"', '"adc"', '"d3s"', '"weather"']
		if sensor_type not in available_sensors:
			formatted_sensors_list = '\n\t* '.join(available_sensors)
			raise AttributeError(f"sensor_type must be one of the following:\n\t* {formatted_sensors_list}")
		self.__sensor_type = sensor_type
	@property
	def avg_csv(self):
		return self.__avg_csv
	@avg_csv.setter
	def avg_csv(self, avg_csv):
		if not isinstance(avg_csv, str):
			raise TypeError(f"avg_csv must be a str, not '{type(avg_csv).__name__}'")
		if not avg_csv.endswith(".csv"):
			raise AttributeError("avg_csv must end with a '.csv' extension")
		self.__avg_csv = avg_csv
	@property
	def my_files(self):
		return self.__my_files
	@my_files.setter
	def my_files(self, my_files):
		if not isinstance(my_files, list):
			raise TypeError(f"my_files must be a list, not '{type(my_files).__name__}'")
		self.__my_files = my_files


	def filter_files(self):
		type_ = "" if self.sensor_type == "radiation" else self.sensor_type

		if type_:
			pattern = fr'.+{type_}_month\.csv$'
		else:
			pattern = r'.+[^weather|adc|d3s|aq]_month\.csv$'

		my_files = [f.path for f in os.scandir(self.data_dir) if f.is_file() and re.match(pattern, f.path)]
		data_mark = {"":"cpm", "aq":"PM10"}

		# remove files with unusable data
		for f in my_files:
			try:
				data = list(csv.reader(open(f)))

				# locations with 0 or 1 data point(s)
				if len(data) < 2:
					my_files.remove(f)
				else:
					col = data[0].index(data_mark[type_])
					values = set([i[col] for i in data[1:]])
					# delete or "ignore" file if every measurement is 0 or blank
					if len(values) == 1 and (float(list(values)[0]) == 0 or list(values)[0] == ""):
						my_files.remove(f)
			# catch the "_csv.Error: line contains NUL" error
			except:
				my_files.remove(f)

		self.my_files = my_files
		return my_files

	def create_csv(self, measurement_headers=[], primary_sizes=[], get_custom_value=None, external_vars_needed=["m"]):
		"""
		measurement_headers: iterable
			* ["Average cpm", "Average msv"]
			* ['Average PM25', 'Average AQI25', 'AQI_Category25', 'Average PM10', 'Average AQI10', 'AQI_Category10']

		primary_sizes: iterable of sizes that show up on the csv files
			* ["cpm"]
			* ["PM25", "PM10"]

		get_custom_value: callable that accepts at least a float as input, manipulates the values in the column(s) in `primary_sizes` to produce more values, and returns an iterable
			* a callable that returns a list containing one value - the provided `cpm` multiplied by 0.036

		external_vars_needed: iterable with values in `to_pass_options.keys()`; represents the variable parameters from the scope of this method to pass into `get_custom_value()`
			* ["m"]
			* ["s", "m"]
		"""
		json_data = json.load(open(os.path.join(self.data_dir, "output.geojson")))

		col_headers = ["file_name", "Location", "Region"] + measurement_headers + ["Start", "Stop"]
		# [['asaka_os', 'Asaka High School Outside', 'Asia'], ['chs_os', 'Campolindo HS Outside', 'America'], ['etch_roof', 'Etcheverry Roof', 'America'], ['westend', 'Westend', 'Europe']]
		avg_measurements = [[i["properties"]["csv_location"], i["properties"]["Name"], i["properties"]["timezone"].split("/")[0]] for i in json_data["features"]]
		
		def full_path(fn): return os.path.join(self.data_dir, f'{fn}{"" if self.sensor_type == "radiation" else f"_{self.sensor_type}"}_month.csv')

		# delete bad-data files from df
		avg_measurements = [i for i in avg_measurements if full_path(i[0]) in self.my_files]
		# sort df alphabetically by the file_name column so it matches the order of the files in my_files
		avg_measurements = sorted(avg_measurements, key=lambda x: x[0].lower())

		for row in range(len(avg_measurements)):
			file_name, location, region = avg_measurements[row]
			time_col = "deviceTime_utc"

			csv_data = pd.read_csv(full_path(file_name), usecols=[time_col] + primary_sizes)

			for s in primary_sizes:
				m = csv_data[s].tolist()
				primary_mes = sum(m) / len(m)
				avg_measurements[row].append(round(primary_mes, 6))

				to_pass_options = {"s": s, "m": primary_mes}

				if get_custom_value:
					for additional_mes in get_custom_value(**{k:v for (k,v) in to_pass_options.items() if k in external_vars_needed}):
						avg_measurements[row].append(additional_mes)

			utc_times = csv_data[time_col].tolist()
			avg_measurements[row].append(utc_times[-1].replace("+00:00", " UTC"))
			avg_measurements[row].append(utc_times[0].replace("+00:00", " UTC"))
		
		df_avg = pd.DataFrame(avg_measurements, columns=col_headers)
		df_avg.to_csv(os.path.join(self.generated_dir, self.avg_csv), index=False)


	def create_plot(self, y_col, fig_write_path, title="Average measurements ordered by region", labels={}, hover_template="", hover_data=["Start", "Stop"], customize_plot=None, **kwargs):
		"""
		y_col: str - name of column in `df_avg`, int, pandas Series or array_like object; used as the `y` argument in generating the plotly bar graph (px.bar attribute)
			* "cpm"
			* "Average PM10"

		fig_write_path: str - name of file to save `fig` as; use the filename only (include `.html` extension); the value passed in will be automatically joined with `generated_dir`
			* "cpm_plot.html"
			* "PM25_plot.html"

		title: str - title of the bar graph; used as the `title` argument in generating the plotly bar graph (px.bar attribute)
			* "Average dose rates ordered by region"

		labels: dict that maps names to "pretty" displayed names in the graph; used as the `labels` argument in generating the plotly bar graph (px.bar attribute)
			* {"Average PM25": "Average PM2.5"}

		hover_template: str - text in a box that will appear when a bar is hovered over; used as the `hovertemplate` value in generating the plotly bar graph (go.bar attribute)
			* "<b>%{x}</b><br>Region: %{data.legendgroup}<br>"

		hover_data: iterable of str - `customdata` values that can be used as variables in the `hover_template` str; can be names of columns in `df_avg`

		customize_plot: callable that takes at least the `fig` as a parameter

		**kwargs: extra arguments (besides 'fig') to feed into the `customize_plot()` function
		"""
		df_avg = pd.read_csv(os.path.join(self.generated_dir, self.avg_csv))

		fig = px.bar(
			data_frame=df_avg,
			x="Location",
			y=y_col,
			title=title,
			color="Region",
			labels=labels,
			hover_data=hover_data
		)

		if hover_template:
			for i in fig.data:
				i.hovertemplate = hover_template

		# call custom function; automatically add 'fig' as an argument
		if customize_plot:
			kwargs.update({"fig": fig})
			customize_plot(**kwargs)

		# save fig to disk
		fig.write_html(os.path.join(self.generated_dir, fig_write_path))

