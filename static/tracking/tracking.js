let params = new URLSearchParams(window.location.search);

if (params.has('search_term')) {
  $('#search-input').val(params.get('search_term'));
}
if (params.has('start_date')) {
  $('#start-date-input').val(fix_date(params.get('start_date')));
}
if (params.has('end_date')) {
  $('#end-date-input').val(fix_date(params.get('end_date')));
}

function fix_date(date) {
  let [y, m, d] = date.split('-');
  return `${m}/${d}/${y}`;
}

function jump_to_page() {
  let page_num = $('#page-select').val();
  let per_page = parseInt($('#per-page').val());
  console.log(per_page, $('#per-page').val())
  if (!per_page) per_page = 12;
  let link = `/?page=${page_num}&sort_by=ship_date&per_page=${per_page}`;
  // window.location.href = link;
}

$('#btn-jump-to-page').click(jump_to_page);

function copy(val, spare_s=false) {
  var $temp = $('<input>');
  $('body').append($temp);
  $temp.val(val).select();
  let success = document.execCommand('copy');
  if (spare_s) $('.spare-s').css('display', 'inline');
  else $('.spare-s').css('display', 'none');
  $('.toast-body').html(val.replace(/, /g, '<br>'));
  $('.toast').toast('show');
  $temp.remove();
}


function copy_all(tracking_numbers) {
  copy(tracking_numbers.join(', '), true);
}

function display_shipment(shipment) {
  $('#message').addClass('d-none');
  let id = shipment.dataset.id;
  $('.shipment-tr').removeClass('bg-secondary').removeClass('text-light');
  $(shipment).addClass('bg-secondary').addClass('text-light');
  $('.shipment').addClass('d-none');
  $('.shipment-' + id).removeClass('d-none');
}

function pass_params(param_keys) {
  let url = '/';
  param_keys.forEach(function(param_key, index, array) {
    if (params.has(param_key)) {
      url += `${index === 0 ? '?': '&'}${param_key}=${params.get(param_key)}`;
    }
  });
  window.location.href = url;
}

$('.btn-clear').click(function() {
  pass_params(['per_page', 'sort_by']);
});

$('#btn-clear-dates').click(function() {
  pass_params(['per_page', 'sort_by', 'search_term']);
});

document.querySelector('.shipment-tr').click();
