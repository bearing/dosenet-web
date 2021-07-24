from regional_plots import BarPlot
from py_mini_racer import py_mini_racer


# instantiate
aq_plot = BarPlot(sensor_type="aq", avg_csv="average_aq.csv")
my_files = aq_plot.filter_files()

# format csv
sizes = ["25", "10"]
all_sizes = []
for size in sizes:
	all_sizes.append(f"Average PM{size}")
	all_sizes.append(f"Average AQI{size}")
	all_sizes.append(f"AQI_Category{size}")

ctx = py_mini_racer.MiniRacer()
ctx.eval(open("calcAQI.js").read())
max_aqi = 0

def calc_aqi_data(s, m):
	avg_AQI, AQI_category = ctx.call("CalcAQI", s, m)

	global max_aqi
	if avg_AQI > (max_aqi or 0):
		max_aqi = avg_AQI

	return avg_AQI, AQI_category

aq_plot.create_csv(measurement_headers=all_sizes, primary_sizes=[f"PM{s}" for s in sizes], get_custom_value=calc_aqi_data, external_vars_needed=["s", "m"])

# create plot
units = ["PM", "AQI"]
for unit in units:
	for size in sizes:
		def customize_plot(fig):
			if unit == "AQI":
				# zoom in
				fig.update_layout(yaxis=dict(range=[0, max_aqi + 10]))

				for lower, upper, color in [[0, 50, "#00e400"], [50, 100, "#ffff00"], [100, 150, "#ff7e00"], [150, 200, "#ff0000"], [200, 300, "#99004c"], [300, 500, "#7e0023"]]:
					fig.add_hrect(
						y0=lower, y1=upper,
						fillcolor=color, opacity=0.5,
						layer="below", line_width=0,
					)

		plot_id = f"{unit}{size}"

		# prettify labels
		pretty_size = size.replace("25","2.5")
		label_map = {f"Average {plot_id}": f"Average {unit}{pretty_size}"}
		if unit == "AQI":
			label_map.update({f"Average AQI{size}": f"Average AQI (based on PM{pretty_size})"})
		hover_template = "<b>%{x}</b><br>Region: %{data.legendgroup}<br>" + f"Average {plot_id}" + ": %{y}<br>Data collected from <i>%{customdata[0]}</i> to <i>%{customdata[1]}</i><extra></extra>"
		for i in label_map:
			hover_template = hover_template.replace(i, label_map[i])

		# big reveal
		aq_plot.create_plot(y_col=f"Average {plot_id}", fig_write_path=f"{plot_id}_plot.html", title="Average air quality measurements ordered by region", labels=label_map, hover_template=hover_template, customize_plot=customize_plot)