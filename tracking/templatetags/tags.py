from django import template

register = template.Library()

@register.filter(name='blank')
def blank(value):
    if value == '0':
        return ''
    else:
        return value

@register.filter(name='timestamp')
def timestamp(value):
    value = str(value)
    y, m, d = value.split('-')
    return f'{m}/{d}/{y}'

@register.filter(name='equals')
def equals(value, arg):
    args = arg.split(',')
    if len(args) == 1:
        test_value = args
        true, false = [True, False]
    else:
        test_value, true, false = arg.split(',')
    if value == test_value:
        return true
    else:
        return false
