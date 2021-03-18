'use strict';


const col_names = [
  'void_flag', 'service_type', 'shipment_id', 'ship_date',
  'estimated_delivery_date', 'saturday_delivery_flag', 'charges',
  'package_count', 'company_name', 'attention', 'address1',
  'address2', 'country', 'zip_code', 'city', 'state', 'email_address',
  'customer_account_number', 'weight', 'tracking_number', 'reference1',
  'reference2'
];


/*
const col_names = [
  'Voided', 'Service Type', 'Shipment ID', 'Ship Date',
  'Estimated Delivery Date', 'Saturday Delivery', 'Charges',
  'Number of Packages', 'Company Name', 'Attention', 'Address 1',
  'Address 2', 'Country', 'Zip', 'City', 'State', 'Email Address',
  'Customer Account', 'Weight', 'Tracking Number', 'Reference 1',
  'Reference 2'
];
*/

function jump_to_page() {
  let page_num = document.getElementById('page-select').value;
  let per_page = document.getElementById('per-page').value;
  let link = `/?page=${page_num}&sortby=ship_date&per_page=${per_page}`;
  window.location.href = link;
}

const hidden = ['void_flag'];


let thead = null;
let l_tbody = null;
let r_tbody = null;
let search_input = null;

let _reset = true;

let _data = [];
let _packages = [];
let _filtered = [];


function start() {
  let wait = setInterval(function() {
    console.log(document.readyState, document.readyState === 'complete')
    if (document.readyState === 'complete') {
      console.log('test')
      clearInterval(wait);
      let max = (window.innerHeight - 180) + 'px';
      $('.table-container').css('max-height', max);
      document.getElementById('info-display').style.maxHeight = max;
      thead = document.getElementById('thead');
      l_tbody = document.getElementById('l-tbody');
      r_tbody = document.getElementById('r-tbody');
      search_input = document.getElementById('search-input');
      get_csv(handle_data);
    }
  }, 500);
}


function get_csv(callback) {
  console.log('csv')
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open('GET', '/static/UPS_CSV_EXPORT.csv', true); // true for asynchronous
  xmlHttp.send(null);
}


function handle_data(data) {
  return null;
  //console.log(data);
  data = data.replace(/,,/g, ';;');
  data = data.replace(/",/g, ';');
  data = data.replace(/,"/g, ';');
  let lines = data.split('\n');
  _data = [];
  _packages = [];
  for (let line of lines) {
    let cols = line.split(';');
    let item = {};
    for (let i = 0; i < cols.length; i++) {
      let col_name = col_names[i];
      item[col_names[i]] = cols[i].replace(/"/g, '');
    }
    _packages.push(item);
  }
  let voided = [];
  let valid = [];
  _packages.forEach(function(a, i) {
    if (Object.keys(a).length === col_names.length) {
      if (a.void_flag[0] === 'N') valid.push(a);
      else if (voided.indexOf(a['shipment_id']) === -1) voided.push(a['shipment_id']);
    }
  });
  _packages = valid.filter(a => (voided.indexOf(a['shipment_id']) === -1));
  _packages.sort((a, b) => (parseInt(a['ship_date']) < parseInt(b['ship_date']) ? 1 : -1));
  for (let _package of _packages) {
    let shipment = _data.filter(a => (a[0]['shipment_id'] === _package['shipment_id']));
    if (shipment.length) {
      shipment = shipment[0];
      shipment.push(_package);
    }
    else {
      shipment = [_package];
      _data.push(shipment);
    }
  }
  console.log(_data)
  _filtered = _data;
  present_data();
}


function present_data() {
  l_tbody.innerHTML = '';
  for (let shipment of _filtered) {
    let tr = document.createElement('tr');
    tr.setAttribute('id', shipment[0]['shipment_id']);
    tr.onclick = select;
    for (let col of ['ship_date', 'company_name']) {
      let td = document.createElement('td');
      let val = shipment[0][col];
      td.setAttribute('value', val);
      if (col === 'ship_date') {td.innerHTML = parse_date(val);}
      else td.innerHTML = val;
      tr.appendChild(td);
    }
    l_tbody.appendChild(tr);
  }
}


function parse_date(str) {
  if (!str.length) return '?';
  let parts = [];
  parts.push(str.substring(4, 6));
  parts.push(str.substring(6, 8));
  parts.push(str.substring(0, 4));
  return parts.join('/');
}


function parse_time(str) {
  let parts = [];
  parts.push(str.substring(8, 10));
  parts.push(str.substring(10, 12));
  parts.push(str.substring(12, 14));
  return parts.join(':');
}


function show_shipment_info(shipment) {
  $('#message').css('display', 'none');

  let values = col_names.map(col_name => (shipment[0][col_name]));
  let data = {};

  col_names.forEach((col, i) => data[col] = values[i]);
  data['weight'] = 0;
  shipment.forEach((_package, i) => data['weight'] += _package['weight']);
  data['weight'] = parseFloat(data['weight']);
  let tracking = shipment.map(_package => (_package['tracking_number']));

  let ship_to = `
    <div class="jumbotron text-dark text-left">
    <h4>${data['company_name']}</h4>
    ${data['attention'] ? (data['attention']) + '<br>' : ''}
    ${data['address1']}
    ${data['address2'] ? ('<br>' + data['address2']) : ''}
    <br>
    ${data['city']}, ${data['state']} ${data['zip_code']}
    ${data['email_address'] ? '<br>' + data['email_address'] : ''}
    </div>
  `;

  let charges = parseFloat(data['charges']);

  let gen_info = `
    <div class="row">
      <div class="col-xl-3 text-right">
        <div class="small d-inline">ship_date: </div>
      </div>
      <div class="col-xl-2 text-left">
        <div class="badge badge-dark mt-2">${parse_date(data['ship_date']).trim()}</div>
      </div>
      <div class="col-xl-4 text-right">
        <div class="small d-inline">estimated_delivery_date: </div>
      </div>
      <div class="col-xl-3 text-left">
        <div class="badge badge-dark mt-2">${parse_date(data['estimated_delivery_date'])}</div>
      </div>
    </div>
    <div class="row">
      <div class="col-xl-3 text-right">
        <div class="small d-inline">Reference #: </div>
      </div>
      <div class="col-xl-2 text-left">
        <div class="badge badge-dark mt-2">${data['reference1'].trim().replace(/,?\s/g, '<br>')}</div>
      </div>
      <div class="col-xl-4 text-right">
        <div class="small d-inline">Reference #: </div>
      </div>
      <div class="col-xl-3 text-left">
        <div class="badge badge-dark mt-2">${data['reference2'].trim().replace(/,?\s/g, '<br>')}</div>
      </div>
    </div>
    <div class="row">
      <div class="col-xl-3 text-right">
        <div class="small d-inline">service_type: </div>
      </div>
      <div class="col-xl-2 text-left">
        <div class="badge badge-dark mt-2">${data['service_type']}</div>
      </div>
      <div class="col-xl-4 text-right">
        <div class="small d-inline">saturday_delivery_flag: </div>
      </div>
      <div class="col-xl-3 text-left">
        <div class="badge badge-dark mt-2">${data['saturday_delivery_flag']}</div>
      </div>
    </div>
    <div class="row pb-3">
      <div class="col-xl-3 text-right">
        <div class="small d-inline">${charges ? 'charges' : 'Bill to'}: </div>
      </div>
      <div class="col-xl-2 text-left">
        <div class="badge badge-dark mt-2">${charges ? '$' + data['charges'] : data['customer_account_number']}</div>
      </div>
      <div class="col-xl-4 text-right">
        <div class="small d-inline">package_count: </div>
      </div>
      <div class="col-xl-3 text-left">
        <div class="badge badge-dark mt-2">${data['package_count']}</div>
      </div>
    </div>
    <div class="row border-top pt-1">
      <div class="col-xl-2"></div>
      <div class="col-xl-8">
        <h3>Tracking</h3>
      </div>
      <div class="col-xl-2"></div>
    </div>
  `;

  tracking.forEach(function(num, i) {
    gen_info += `
      <div class="mt-3 row">
        <div class="col-xl-3">
          ${shipment.length > 1 && i === 0 ? '<a href="https://wwwapps.ups.com/WebTracking?loc=en_US&TypeOfInquiryNumber=T&Requester=WS" id="track-all-btn" class="${shipment.length > 1 ? \'\' : \'d-none\'} btn btn-block btn-warning font-weight-bold" role="button">Track all</a>': ''}
          ${shipment.length > 1 && i === 1 ? '<button onclick="copy_all()" class="btn btn-block btn-warning font-weight-bold" role="button">Copy all</button>': ''}
        </div>
        <div class="col-xl-6">
          <a role="button" class="btn-tracking btn btn-block btn-warning font-weight-bold mb-2" href="http://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=${num}">${num}</a>
        </div>
        <div class="col-xl-3">
          <button onclick="copy(this.value)" value="${num}" class="btn btn-block btn-warning font-weight-bold">Copy</button>
        </div>
      </div>
    `;
  });

  document.getElementById('ship-to').innerHTML = ship_to;
  document.getElementById('gen-info').innerHTML = gen_info;

  let all_btn = document.getElementById('track-all-btn')

  if (shipment.length > 1) {
    all_btn.classList.remove('d-none');
    shipment.forEach((_package, i) => {
      all_btn.href += `&InquiryNumber${i + 1}=${_package['tracking_number']}`
    })
  }
}


function select() {
  let table = document.getElementById('table');
  let tr_arr = [].slice.call(table.getElementsByTagName('tr'));
  for (let tr of tr_arr) {
    tr.classList.remove('bg-secondary');
    tr.classList.remove('text-light');
  }
  this.classList.add('bg-secondary');
  this.classList.add('text-light');
  let id = this.id;
  let shipment = null;
  for (let _shipment of _data) {
    if (_shipment.length) {
      if (_shipment[0]['shipment_id'] === id) {
        shipment = _shipment;
        break;
      }
    }
  }
  if (shipment) {
    show_shipment_info(shipment);
  }
}


function refresh() {
  l_tbody.innerHTML = '';
  setTimeout(function() {
    get_csv(handle_data);
  }, 1000);
  document.getElementById('dropdownMenuButton').innerHTML = 'Ship date - Newest to oldest';
}


function resort(btn) {
  document.getElementById('dropdownMenuButton').innerHTML = btn.innerHTML;
  let type = btn.getAttribute('value');
  if (type === 'ship_asc') {
    _data.sort((a, b) => (parseInt(a[0]['ship_date']) > parseInt(b[0]['ship_date']) ? 1 : -1));
    _filtered.sort((a, b) => (parseInt(a[0]['ship_date']) > parseInt(b[0]['ship_date']) ? 1 : -1));
  }
  if (type === 'ship_desc') {
    _data.sort((a, b) => (parseInt(a[0]['ship_date']) < parseInt(b[0]['ship_date']) ? 1 : -1));
    _filtered.sort((a, b) => (parseInt(a[0]['ship_date']) < parseInt(b[0]['ship_date']) ? 1 : -1));
  }
  present_data();
}


function copy(val, spar_s=false) {
  var $temp = $('<input>');
  $('body').append($temp);
  $temp.val(val).select();
  let success = document.execCommand('copy');
  if (spar_s) $('.spar-s').css('display', 'inline');
  else $('.spar-s').css('display', 'none');
  $('.toast-body').html(val.replace(/, /g, '<br>'));
  $('.toast').toast('show');
  $temp.remove();
}


function copy_all() {
  let btns = [].slice.call(document.getElementsByClassName('btn-tracking'));
  let tracking = btns.map(btn => (btn.innerHTML)).join(', ');
  copy(tracking, true);
}


function search() {
  let term = search_input.value.toLowerCase();
  let keys = Object.keys(_data[0][0]);
  _filtered = _data.filter(shipment => {
    for (let key of keys) {
      if (shipment[0][key].toLowerCase().indexOf(term) >= 0) return true;
    }
    return false;
  });
  present_data();
}


function input(e) {
  if (e.keyCode === 13) search();
}


function clear_input() {
  search_input.value = '';
}


// S O C K E T ------------------------------------------------ //

function start_socket() {
  let loc = window.location;
  var ws_start = 'ws://';
  if (loc.protocol == 'https:') {
    ws_start = 'wss://';
  }
  var endpoint = ws_start + loc.host + loc.pathname + 'ws';
  var socket = new WebSocket(endpoint);

  socket.onmessage = socket_message;

  socket.onopen = socket_open;

  socket.onerror = function(e) {
    console.log('error', e);
  };

  socket.onclose = socket_close;
}


function socket_open() {
  console.log('connected');
}


function socket_message(e) {
  console.log(e);
  let data = JSON.parse(e.data);
  console.log(data);
  if (data.count) {
    document.getElementById('connections').innerText = data.count;
  }
  if (data.id) {
    console.log(data.id);
  }
  if (data.shipments && _reset) {
  }
}


function socket_close() {

}


start_socket();

start();
