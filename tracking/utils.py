from tracking.models import Package, Shipment

import datetime
import random
import string
import time


def rand(string_length=20):
    return ''.join([
        random.choice(string.ascii_letters + string.digits)
            for n in range(string_length)
    ])


def time_this(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        duration = end_time - start_time
        dur_str = '{:.2f}'.format(duration)
        print(f'function: {func.__name__}() executed in {dur_str} seconds')
        return result
    return wrapper


COLUMN_HEADERS = [
    'void_flag', 'service_type', 'id', 'ship_date',
    'estimated_delivery_date', 'saturday_delivery_flag', 'charges',
    'package_count', 's_reference1', 's_reference2', 's_reference3',
    's_reference4', 's_reference5', 'company_name', 'attention', 'address1',
    'address2', 'country', 'zip_code', 'city', 'state', 'email_address',
    'customer_account_number', 'weight', 'tracking_number', 'reference1',
    'reference2'
]


def dictify_data(data):
    for line_index, line in enumerate(data):
        line_dict = {}
        for column_index, value in enumerate(line):
            if COLUMN_HEADERS[column_index] == 'void_flag':
                value = (line[column_index] == 'Y')
            if value:
                line_dict[COLUMN_HEADERS[column_index]] = value
            else:
                line_dict[COLUMN_HEADERS[column_index]] = 0
        data[line_index] = line_dict
    return data


def parse_package_and_shipment_data(line):
    package_keys = ['weight', 'reference1', 'reference2', 'tracking_number']
    package_data = {}
    for key in package_keys:
        package_data[key] = line.pop(key)
    shipment_data = {k.replace('s_', ''):v for k, v in line.items()}
    shipment_data['ship_date'] = format_date(shipment_data['ship_date'])
    shipment_data['estimated_delivery_date'] = format_date(shipment_data['estimated_delivery_date'])
    return package_data, shipment_data


def format_date(date_str):
    y = date_str[0:4]
    m = date_str[4:6]
    d = date_str[6:8]
    return datetime.date(*[int(v) for v in [y, m, d]])


@time_this
def handle_data(data):
    shipments = Shipment.objects.all()
    packages = Package.objects.all()
    updated_shipments = []
    new_shipments = []
    new_packages = []
    skip = []
    for line in data:
        package_data, shipment_data = parse_package_and_shipment_data(line)
        id = shipment_data['id']
        void_flag = shipment_data['void_flag']
        try:
            shipment = shipments.get(id=id)
            if shipment.void_flag != void_flag and shipment.void_flag == 'N':
                shipment.void_flag = void_flag
                updated_shipments.append(shipment)
        except Shipment.DoesNotExist:
            if id not in skip:
                shipment = Shipment(**shipment_data)
                new_shipments.append(shipment)
                skip.append(id)
        tracking_number = package_data['tracking_number']
        if void_flag:
            continue
        try:
            package = packages.get(tracking_number=tracking_number)
        except Package.DoesNotExist:
            if not tracking_number in skip:
                package_data['shipment'] = shipment
                package = Package(**package_data)
                new_packages.append(package)
                skip.append(tracking_number)
    Shipment.objects.bulk_update(updated_shipments, ['void_flag'])
    Shipment.objects.bulk_create(new_shipments)
    Package.objects.bulk_create(new_packages)
    print('done')
