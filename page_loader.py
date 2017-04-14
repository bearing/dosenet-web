import selenium.webdriver as webdriver
from time import sleep
from os import listdir
from os.path import isfile, join

firefox_extension_path = '/home/pi/.mozilla/firefox/4dtxxbqk.default/extensions/'

if __name__ == "__main__":
    urls = ['file:///home/pi/dosenet-web/display-monitors/Front.html', 'https://radwatch.berkeley.edu',
            'https://radwatch.berkeley.edu/rad101#tab2',
            'https://radwatch.berkeley.edu/rad101#tab3',
    		'https://radwatch.berkeley.edu/dosenet/map#dosenet_rad_banner',
    		'https://radwatch.berkeley.edu/dosenet/data#chartdata',
    		'https://radwatch.berkeley.edu/dosenet/data#alldata',
    		'file:///home/pi/dosenet-web/display-monitors/WeatherStation.html',
            'file:///home/pi/dosenet-web/display-monitors/FindMore.html']
    sleeps = [10,30,10,10,30,30,30,20,15]

profile = webdriver.FirefoxProfile()
extensions = [join(firefox_extension_path, f) for f in listdir(firefox_extension_path) if isfile(join(firefox_extension_path, f))]
for f in extensions:
    profile.add_extension(f)

profile.set_preference("hidenavbar.hidden", True)
profile.set_preference("hidenavbar.hideonstart", 1)
profile.set_preference("extensions.hidtb.auto_hide_one_tab", True)

b = webdriver.Firefox(firefox_profile=profile)
b.set_window_position(0,0)
b.set_window_size(1024, 768)

while True:
    for idx, url in enumerate(urls):
        b.get(url)
        sleep(sleeps[idx])