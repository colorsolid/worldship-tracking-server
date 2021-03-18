from decouple import config

import csv
import json
import os
import requests
import time

# FILEPATH = r'C:\Users\shipping\Documents\UPS_CSV_EXPORT.csv'

BASE_PATH = os.path.realpath(os.path.dirname(__file__))
FILEPATH = os.path.join(BASE_PATH, 'UPS_CSV_EXPORT.csv')


class Watcher:
    def __init__(self, filepath):
        self.mtime = 0
        self.size = 0
        self.filepath = filepath
        self.line_count = 0
        self.csv_list = []
        self.quit = False


    def watch_for_changes(self):
        print('Watching for file changes')
        while not self.quit:
            stats = os.stat(self.filepath)
            if not any((self.size, self.mtime, self.line_count)):
                self.update_stats(stats)
                self.read_file()
                self.get_lines(startup=True)
            else:
                if self.size != stats.st_size or self.mtime != stats.st_mtime:
                    self.update_stats(stats)
                    self.get_lines()
            time.sleep(10)


    def update_stats(self, stats):
        self.size = stats.st_size
        self.mtime = stats.st_mtime


    def read_file(self):
        with open(self.filepath, 'r') as infile:
            self.csv_list = list(csv.reader(infile))
            self.line_count = len(self.csv_list)


    def get_lines(self, startup=False):
        if startup:
            new_lines = self.csv_list
        else:
            before = self.line_count
            self.read_file()
            diff = self.line_count - before
            if diff:
                new_lines = self.csv_list[-diff:]
            else:
                new_lines = []
        post_data(new_lines)


def post_data(data):
    s = requests.Session()
    token_r = s.get(url)
    csrf_token = token_r.cookies['csrftoken']
    r = s.post(url=url, data={
        'csrfmiddlewaretoken': csrf_token,
        'json': json.dumps({
            'key': config('WATCHER_KEY'),
            'data': data
        })
    })


if __name__ == '__main__':
    url = 'http://127.0.0.1:8001/watcher_data'
    watcher = Watcher(FILEPATH)
    watcher.watch_for_changes()
