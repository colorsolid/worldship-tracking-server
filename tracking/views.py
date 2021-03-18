from decouple import config
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpResponse, HttpResponseNotFound
from django.middleware.csrf import get_token
from django.shortcuts import render, redirect
from math import ceil
from tracking.models import Package, Shipment
from urllib.parse import unquote_plus
from .forms import FilterForm
from .utils import *

import datetime
import json
import requests
import time

def index(request):
    search_term = request.POST.get('search_term', '')
    if not search_term:
        search_term = request.GET.get('search_term', '')
    sort_method = request.GET.get('sort_by', '-ship_date')
    previous_sort = sort_method

    if request.method == 'POST':
        filter_form = FilterForm(request.POST)
        if filter_form.is_valid():
            sort_method = filter_form.cleaned_data['sort_method']
            previous_sort = filter_form.cleaned_data['previous_sort']
            start_date = filter_form.cleaned_data['start_date']
            end_date = filter_form.cleaned_data['end_date']
            if previous_sort != sort_method:
                q = f'?sort_by={sort_method}'
            else:
                per_page = filter_form.cleaned_data['results_per_page']
                page_number = filter_form.cleaned_data['page_number']
                q = f'?page={page_number}&per_page={per_page}&sort_by={sort_method}'
            if search_term:
                q += f'&search_term={search_term}'
            if start_date:
                q += f'&start_date={start_date}'
            if end_date:
                q += f'&end_date={end_date}'
            return redirect(f'/{q}')

    if search_term:
        shipments = Shipment.objects.filter(
            Q(package__reference1__icontains=search_term) |
            Q(package__reference2__icontains=search_term) |
            Q(package__tracking_number__icontains=search_term) |
            Q(attention__icontains=search_term) |
            Q(company_name__icontains=search_term) |
            Q(reference1__icontains=search_term) |
            Q(reference2__icontains=search_term) |
            Q(reference3__icontains=search_term) |
            Q(reference4__icontains=search_term) |
            Q(reference5__icontains=search_term) |
            Q(charges__contains=search_term) |
            Q(id__icontains=search_term)
        ).distinct()
    else:
        shipments = Shipment.objects.all()
    start_date = request.GET.get('start_date', '1970-01-01')
    end_date = request.GET.get('end_date', datetime.datetime.now().strftime('%Y-%m-%d'))
    shipments = shipments.filter(void_flag=False).filter(ship_date__range=[start_date, end_date]).order_by(sort_method)
    per_page = request.GET.get('per_page', 12)
    paginator = Paginator(shipments, per_page)
    page_number = request.GET.get('page', 1)
    page_max = ceil(len(shipments) / int(per_page))
    page_max = page_max if page_max else 1
    if int(page_number) > page_max:
        page_number = str(page_max)
    page_obj = paginator.get_page(page_number)
    shipments = paginator.page(page_obj.number)

    filter_form = FilterForm({
        'search_term': search_term,
        'results_per_page': per_page,
        'page_number': page_number,
        'sort_method': sort_method,
        'previous_sort': previous_sort
    })
    # filter_form.fields['results_per_page'].widget.attrs['max'] = paginator.count
    filter_form.fields['page_number'].widget.attrs['max'] = paginator.num_pages

    context = {
        'shipments': shipments,
        'per_page': per_page,
        'page_number': page_number,
        'sort_method': sort_method,
        'filter_form': filter_form
    }
    return render(request, 'tracking/tracking.html', context)


def watcher_data(request):
    csrf_token = get_token(request)
    if request.method == 'POST':
        body = request.body.decode('utf-8')
        body_dict = {}
        for pair in body.split('&'):
            k, v = pair.split('=')
            body_dict[k] = v
        body_dict = json.loads(unquote_plus(body_dict['json']))
        key = config('WATCHER_KEY')
        if 'key' in body_dict and body_dict['key'] == key:
            data = dictify_data(body_dict['data'])
            handle_data(data)
    # return redirect('/')
    return not_found(request)


def not_found(request):
    return HttpResponseNotFound('<h1>Page not found</h1>')
