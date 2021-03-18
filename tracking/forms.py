from django import forms


class FilterForm(forms.Form):
    search_term = forms.CharField(label='', max_length=200, required=False)
    results_per_page = forms.IntegerField(label='Shipments per page')
    page_number = forms.IntegerField(label='Page number')
    sort_method = forms.ChoiceField(
        label='Order by',
        choices=(
            ('-ship_date', 'Newest to oldest'),
            ('ship_date', 'Oldest to newest')
        )
    )
    previous_sort = forms.CharField()
    start_date = forms.DateField(required=False)
    end_date = forms.DateField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'

        search_input = self.fields['search_term']
        search_input.widget.attrs['id'] = 'search-input'
        search_input.widget.attrs['placeholder'] = 'Search customer names or sales/purchase order numbers'

        per_page_input = self.fields['results_per_page']
        per_page_input.widget.attrs['id'] = 'per-page-input'
        per_page_input.widget.attrs['min'] = 1

        page_number_input = self.fields['page_number']
        page_number_input.widget.attrs['id'] = 'page-number-input'
        page_number_input.widget.attrs['min'] = 1

        sort_method_select = self.fields['sort_method']
        sort_method_select.widget.attrs['id'] = 'sort-method-select'

        self.fields['previous_sort'].widget = forms.HiddenInput()

        start_date_input = self.fields['start_date']
        start_date_input.widget.attrs['id'] = 'start-date-input'
        start_date_input.widget.attrs['data-provide'] = 'datepicker'
        start_date_input.widget.attrs['placeholder'] = 'Start date'

        end_date_input = self.fields['end_date']
        end_date_input.widget.attrs['id'] = 'end-date-input'
        end_date_input.widget.attrs['data-provide'] = 'datepicker'
        end_date_input.widget.attrs['placeholder'] = 'End date'
