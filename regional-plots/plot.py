from regional_plots import BarPlot


# instantiate
rad_plot = BarPlot(sensor_type="radiation", avg_csv="average_rad.csv")
my_files = rad_plot.filter_files()

# format csv
units = ["cpm", "msv"]
all_units = []
for unit in units:
    all_units.append(f"Average {unit}")

def convert_to_msv(m):
    return [round(m * 0.036, 6)]

rad_plot.create_csv(measurement_headers=all_units, primary_sizes=["cpm"], get_custom_value=convert_to_msv, external_vars_needed=["m"])

# create plot
for unit in units:
    funit = "Average CPM (counts per minute)" if unit == "cpm" else "Average μSv/hr (microsieverts per hour)"
    hover_template = "<b>%{x}</b><br>Region: %{data.legendgroup}<br>" + f"Average {funit}" + ": %{y}<br>Data collected from <i>%{customdata[0]}</i> to <i>%{customdata[1]}</i><extra></extra>"

    rad_plot.create_plot(y_col=f"Average {unit}", fig_write_path=f"{unit}_plot.html", title="Average dose rates ordered by region", labels={f"Average {unit}": funit}, hover_template=hover_template)
