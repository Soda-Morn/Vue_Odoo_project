import { rpc } from './odoo'

// Odoo call_kw helper — used for all model operations
const kw = (model, method, args = [], kwargs = {}) =>
  rpc('/web/dataset/call_kw', { model, method, args, kwargs })

const MODEL      = 'axiv.fuel.request'
const LINE_MODEL = 'axiv.fuel.request.line'

const FUEL_REQUEST_FIELDS = [
  'name', 'request_date', 'request_by_id', 'vehicle_id',
  'vehicle_type_id', 'vehicle_code', 'beginning_fuel', 'total_fuel', 'request_reason',
]

export const fuelAPI = {
  getList: () => kw(MODEL, 'search_read', [[]], {
    fields: FUEL_REQUEST_FIELDS,
    order:  'request_date desc',
    limit:  80,
  }),

  getOne: (id) => kw(MODEL, 'read', [[id]], {
    fields: ['name', 'request_date', 'request_by_id', 'vehicle_id',
             'vehicle_type_id', 'vehicle_code', 'beginning_fuel', 'request_reason'],
  }),

  getLines: (requestId, qtyField = 'fuel_qty') => kw(LINE_MODEL, 'search_read',
    [[['fuel_request_id', '=', requestId]]],
    { fields: ['id', 'fuel_type', qtyField] },
  ),

  create: (data)     => kw(MODEL, 'create', [data]),
  update: (id, data) => kw(MODEL, 'write',  [[id], data]),
  remove: (id)       => kw(MODEL, 'unlink', [[id]]),

  // Calls server onchange when vehicle changes — returns vehicle_type_id and vehicle_code
  vehicleOnchange: (vehicleId) => kw(MODEL, 'onchange', [
    [],
    { vehicle_id: vehicleId },
    ['vehicle_id'],
    { vehicle_type_id: {}, vehicle_code: {} },
  ]),

  // Fetches fuel_type selection options from the line model definition
  getFuelTypeOptions: () => kw(LINE_MODEL, 'fields_get', [['fuel_type']], { attributes: ['selection'] }),

  // Discovery: checks what model request_by_id references (hr.employee vs res.users)
  discoverRequestFields: () => kw(MODEL, 'fields_get', [['request_by_id']], { attributes: ['relation'] }),

  // Discovery: fetch ALL line model fields — caller detects the qty field by type + label
  discoverLineFields: () => kw(LINE_MODEL, 'fields_get', [], { attributes: ['type', 'string'] }),

  // Shared dropdown options
  getVehicles:  () => kw('fleet.vehicle', 'search_read', [[['active', '=', true]]], { fields: ['id', 'name'], limit: 200 }),
  getEmployees: () => kw('hr.employee',  'search_read', [[['active', '=', true]]], { fields: ['id', 'name'], limit: 200 }),
  getUsers:     () => kw('res.users',    'search_read', [[['active', '=', true]]], { fields: ['id', 'name'], limit: 200 }),
}
