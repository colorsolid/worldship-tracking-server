from django.conf.urls import url, re_path

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url('watcher_data', views.watcher_data, name='watcher data'),
    re_path(r'.*', views.not_found, name='page not found')
]
