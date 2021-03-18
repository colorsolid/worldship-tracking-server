import json

from channels.db import database_sync_to_async
from django.core import serializers
from django.db import models


class Shipment(models.Model):
    id = models.CharField(primary_key=True, max_length=15, default='')
    ship_date = models.DateField()
    estimated_delivery_date = models.DateField()
    company_name = models.CharField(max_length=100, default='')
    attention = models.CharField(max_length=100, default='')
    address1 = models.CharField(max_length=100, default='')
    address2 = models.CharField(max_length=100, default='')
    city = models.CharField(max_length=100, default='')
    state = models.CharField(max_length=100, default='')
    zip_code = models.CharField(max_length=10, default='')
    country = models.CharField(max_length=50, default='')
    package_count = models.IntegerField(default=0)
    service_type = models.CharField(max_length=30, default='')
    charges = models.CharField(max_length=8, default='')
    email_address = models.CharField(max_length=50, default='')
    void_flag = models.BooleanField(default=False)
    saturday_delivery_flag = models.CharField(max_length=1, default='')
    customer_account_number = models.CharField(max_length=10, default='')
    reference1 = models.CharField(max_length=100, default='')
    reference2 = models.CharField(max_length=100, default='')
    reference3 = models.CharField(max_length=100, default='')
    reference4 = models.CharField(max_length=100, default='')
    reference5 = models.CharField(max_length=100, default='')


    def __str__(self):
        return str(self.__dict__)

    def get_packages(self):
        return self.package_set.all()

    def get_tracking_numbers(self):
        return [p.tracking_number for p in self.get_packages()]

    def get_references(self):
        refs = []
        for ref in [
            self.reference1, self.reference2, self.reference3,
            self.reference4, self.reference5
        ]:
            if ref and ref != '0':
                refs.append(ref)
        for package in self.get_packages():
            for ref in [package.reference1, package.reference2]:
                if ref and ref != '0':
                    refs.append(ref)
        return list(set(refs))

    class Meta:
        ordering = ['-ship_date']


class Package(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.DO_NOTHING)
    weight = models.FloatField(default=0)
    tracking_number = models.CharField(max_length=20, default='')
    reference1 = models.CharField(max_length=100, default='')
    reference2 = models.CharField(max_length=100, default='')
