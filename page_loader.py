#!/usr/bin/env python
import selenium.webdriver as webdriver
from selenium.webdriver.common.keys import Keys
from time import sleep
from os import listdir
from os.path import isfile, join

firefox_extension_path = '/home/pi/.mozilla/firefox/4dtxxbqk.default/extensions/'

if __name__ == "__main__":
    urls = [#['file:///home/pi/dosenet-web/display-monitors/Front.html',10],
            ['https://radwatch.berkeley.edu',30],
            ['https://radwatch.berkeley.edu/rad101#tabs-1',10],
            ['https://radwatch.berkeley.edu/rad101#tabs-2',10],
    		['https://radwatch.berkeley.edu/dosenet/map#dosenet_rad_banner',30],
    		['https://radwatch.berkeley.edu/dosenet/data#data_1',30],
            ['https://radwatch.berkeley.edu/dosenet/schools/etcheverry#spacer_1',20],
            ['https://radwatch.berkeley.edu/dosenet/schools/etcheverry#spacer_2',20]
    		#['file:///home/pi/dosenet-web/display-monitors/WeatherStation.html',20],
            #['file:///home/pi/dosenet-web/display-monitors/FindMore.html',15]
            ]

profile = webdriver.FirefoxProfile()
extensions = []
try:
    extensions = [join(firefox_extension_path, f) for f in listdir(firefox_extension_path) if isfile(join(firefox_extension_path, f))]
except:
    print("Not on Raspberry Pi or can't find extensions, some behavior may be different.")
for f in extensions:
    profile.add_extension(f)

profile.set_preference("hidenavbar.hidden", True)
profile.set_preference("hidenavbar.hideonstart", 1)
profile.set_preference("extensions.hidtb.auto_hide_one_tab", True)

#b = webdriver.Firefox(firefox_profile=profile)
b = webdriver.Firefox()
#b.get('http://localhost')
#b.get('file:///Users/alihanks/dosenet-web/Rad101.html')
#b.find_element_by_xpath('/html/body').send_keys(Keys.F11)

while True:
    for idx,url in enumerate(urls):
        b.get(url[0])
        if idx>=1 and idx <=2:
            b.refresh()
        b.get(url[0])
        sleep(url[1])
