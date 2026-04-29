# Fleet Fuel Management System

A web application built with **Vue 3** to manage fuel requests for a vehicle fleet, integrated with an **Odoo** backend via JSON-RPC API. This project was created as a hands-on learning experience with Vue.js — to understand how a modern frontend framework works in a real-world scenario, from authentication and routing to state management and data visualization.

---

## Why I Built This

I built this project primarily **to learn Vue.js** by building something real, not just following a tutorial. Instead of writing a toy counter app, I chose a real business case (fuel request management) so I would be forced to deal with actual problems: API integration, form handling, state management, routing guards, and data visualization.

The goals were:
- Learn the **Vue 3 Composition API** and understand how it differs from the Options API
- Practice **Pinia** for state management across multiple pages
- Understand **Vue Router** and how to protect routes based on authentication
- Use **Chart.js** to display real data in charts
- Build reusable **components** and **composables** as Vue encourages
- Connect a frontend app to a real backend (Odoo) over HTTP

By the end of this project, I can explain how Vue 3 works, why the Composition API is powerful, and how all the pieces fit together in a production-style app.

---

## Features

### Authentication
- Login page with username and password
- Show/hide password toggle
- Error display on wrong credentials
- Session persists in `localStorage` so you stay logged in after page refresh
- Automatic redirect: if not logged in → go to `/login`; if already logged in → skip login page
- **Session expiry handling**: if the Odoo server session expires, any API call automatically clears local state and redirects to `/login`

### Fuel Request List
- Table showing all fuel requests from Odoo
- Columns: request name, date, requester, vehicle, vehicle type, code, beginning fuel, total fuel
- Edit and delete buttons for each row
- Delete confirmation modal (prevents accidental deletion)
- "New" button to create a new request

### Fuel Request Form (Create & Edit)
- Single form used for both creating and editing (detects mode via route params)
- Fields: date, requester, beginning fuel, reason for request
- Vehicle dropdown with **auto-populate**: selecting a vehicle fills in vehicle type and code automatically (uses Odoo `onchange` API)
- Dynamic fuel request lines table: add/remove rows, each with fuel type and quantity
- Sticky header with breadcrumb navigation

### Reporting Dashboard
- 4 summary stat cards: total requests, total fuel used, unique vehicles, unique requesters
- Bar chart: **Fuel by Requester** (who used how much fuel)
- Bar chart: **Fuel by Vehicle** (which vehicle used how much fuel)
- Breakdown tables under each chart showing exact numbers and totals

---

## Project Structure

```
src/
├── api/                    # Odoo API calls (JSON-RPC)
│   ├── odoo.js             # Base HTTP client (axios + session auth)
│   └── fleet.js            # Fuel request CRUD and field discovery
│
├── stores/                 # Pinia state management
│   ├── auth.js             # Login/logout, user state
│   ├── fuel.js             # Fuel request list, create, update, delete
│   └── reporting.js        # Reporting data with computed aggregations
│
├── composables/            # Reusable logic functions
│   ├── useFormatters.js    # Date, number, many2one field formatters
│   └── useDeleteConfirm.js # Generic delete confirmation logic
│
├── components/             # Reusable UI components
│   ├── StatCard.vue        # Metric card (label + value)
│   ├── BarChart.vue        # Chart.js bar chart wrapper
│   ├── BreakdownTable.vue  # Data table with totals
│   ├── AppSpinner.vue      # Loading spinner
│   ├── AppError.vue        # Error message banner
│   └── AppEmpty.vue        # Empty state placeholder
│
├── layouts/
│   └── MainLayout.vue      # Sidebar + navigation shell
│
├── views/
│   ├── LoginView.vue
│   ├── fuel/
│   │   ├── FuelListView.vue
│   │   └── FuelFormView.vue
│   └── reporting/
│       └── ReportingView.vue
│
└── router/
    └── index.js            # Routes + navigation guards
```

---

## Vue.js Features Used and Explained

This section explains every Vue 3 feature used in this project so you can describe them confidently.

---

### 1. Composition API and `<script setup>`

Vue 3 introduced the **Composition API** as an alternative to the Options API. Instead of separating code into `data`, `methods`, `computed`, and `watch` sections, you write everything as regular JavaScript inside a `setup()` function — or using the `<script setup>` shorthand.

**Why it is better:**
- Logic can be grouped by feature, not by option type
- Easy to extract into composables (reusable functions)
- Better TypeScript support
- Less boilerplate

**Example from this project:**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(false)
const records = ref([])
const total = computed(() => records.value.length)

onMounted(() => {
  // runs when component mounts to the DOM
})
</script>
```

Every single component in this project uses `<script setup>` — there is no Options API code.

---

### 2. `ref()` — Reactive Variables

`ref()` creates a reactive variable. When it changes, Vue automatically updates the DOM.

```js
const count = ref(0)
count.value++  // in JS you access .value
```

In templates you do NOT write `.value` — Vue handles that:
```html
<p>{{ count }}</p>
```

Used throughout this project for: form inputs, loading states, error messages, selected record IDs, chart data.

---

### 3. `computed()` — Derived State

`computed()` creates a value that is automatically recalculated when its dependencies change. It is cached — it only re-runs when the data it reads actually changes.

```js
const summary = computed(() => ({
  totalRequests: records.value.length,
  totalFuel: records.value.reduce((sum, r) => sum + r.total_fuel, 0),
}))
```

Used in `useReportingStore` to group fuel records by requester and vehicle, and calculate totals.

---

### 4. `watch()` — Reacting to Changes

`watch()` lets you run code when a reactive value changes. Useful for side effects (API calls, DOM updates).

```js
watch(props.items, (newItems) => {
  chart.data.labels = newItems.map(i => i.label)
  chart.update()
}, { deep: true })
```

`{ deep: true }` means watch nested properties inside an object or array, not just the reference.

Used in `BarChart.vue` to update the Chart.js chart whenever new data arrives via props.

---

### 5. Lifecycle Hooks

Vue components have a lifecycle: created → mounted → updated → unmounted. You can run code at each stage.

| Hook | When it runs |
|------|-------------|
| `onMounted` | After component is added to the DOM |
| `onBeforeUnmount` | Just before component is removed |

```js
onMounted(() => {
  chart = new Chart(canvas.value, config)  // create Chart.js instance
})

onBeforeUnmount(() => {
  chart?.destroy()  // clean up to prevent memory leaks
})
```

Every view uses `onMounted` to fetch data from the API when the page loads.

---

### 6. Template Refs (`ref="canvas"`)

To access an actual DOM element from JavaScript (e.g., a `<canvas>` needed for Chart.js), you use a template ref:

```vue
<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
const canvas = ref(null)  // same name as the ref attribute
onMounted(() => {
  new Chart(canvas.value, ...)  // canvas.value is the real DOM element
})
</script>
```

Used in `BarChart.vue` to give Chart.js the canvas element it needs to draw on.

---

### 7. Props — Passing Data Into Components

Props are how a parent component passes data down to a child component.

```vue
<!-- Parent -->
<StatCard label="Total Fuel" :value="1500" color="text-blue-600" />

<!-- StatCard.vue -->
<script setup>
const props = defineProps({
  label: String,
  value: Number,
  color: { type: String, default: 'text-gray-900' }
})
</script>
```

Key rule: **props flow down, events flow up.** A child should never modify props directly.

---

### 8. `v-model` — Two-Way Binding

`v-model` binds a form input's value to a reactive variable, keeping them in sync automatically.

```html
<input v-model="username" type="text" />
<!-- same as: :value="username" @input="username = $event.target.value" -->
```

Used on every form field in `LoginView.vue` and `FuelFormView.vue`.

---

### 9. `v-if` / `v-else` — Conditional Rendering

Renders or removes elements from the DOM based on a condition.

```html
<AppSpinner v-if="loading" />
<AppError v-else-if="error" :message="error" />
<table v-else>...</table>
```

Used to show loading spinners, error banners, or empty state messages before showing actual data.

---

### 10. `v-for` — List Rendering

Renders a list of elements from an array.

```html
<tr v-for="record in records" :key="record.id">
  <td>{{ record.name }}</td>
</tr>
```

The `:key` attribute is required — it helps Vue track which items changed, moved, or were removed so it can update the DOM efficiently.

---

### 11. Dynamic Class Binding (`:class`)

`:class` lets you apply CSS classes conditionally.

```html
<span :class="isActive ? 'text-blue-600 font-bold' : 'text-gray-500'">
  Dashboard
</span>
```

Used in `MainLayout.vue` to highlight the active navigation link.

---

### 12. Event Modifiers

Vue provides shorthand modifiers for common event patterns:

```html
<form @submit.prevent="handleSubmit">   <!-- prevents page reload -->
<div @click.self="closeModal">          <!-- only fires if clicked element is this div, not a child -->
```

Used in the delete confirmation modal to close it when clicking the dark overlay.

---

### 13. `<Transition>` — Animations

Vue's built-in `<Transition>` component adds CSS animations when elements enter or leave the DOM.

```html
<Transition name="fade">
  <div v-if="showModal">...</div>
</Transition>
```

You define the animation in CSS using classes like `.fade-enter-active`, `.fade-leave-to`. Used for the modal and error shake animation.

---

## Pinia — State Management

**Pinia** is the official state management library for Vue 3. It replaces Vuex with a simpler, more intuitive API.

### Why use Pinia instead of just `ref()` in components?

When multiple pages/components need the same data, you do not want each one to fetch it independently. Pinia stores live outside of any component, so any component can read or update the same shared state.

### Store Structure

```js
// src/stores/reporting.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useReportingStore = defineStore('reporting', () => {
  const records = ref([])
  const loading = ref(false)

  const byRequester = computed(() => {
    const map = {}
    for (const r of records.value) {
      const name = r.request_by_id?.[1] ?? 'Unknown'
      map[name] = (map[name] ?? 0) + r.total_fuel
    }
    return Object.entries(map)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total)
  })

  async function fetchData() {
    loading.value = true
    records.value = await getList()
    loading.value = false
  }

  return { records, loading, byRequester, fetchData }
})
```

### Three Stores in This Project

| Store | What it manages |
|-------|----------------|
| `useAuthStore` | Logged-in user, login/logout actions |
| `useFuelStore` | Fuel request list, CRUD operations |
| `useReportingStore` | Reporting data, computed aggregations by requester/vehicle |

---

## Vue Router

**Vue Router** is the official routing library for Vue. It maps URL paths to components.

### Route Configuration

```js
const routes = [
  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'fuel', component: FuelListView },
      { path: 'fuel/new', component: FuelFormView },
      { path: 'fuel/:id/edit', component: FuelFormView },  // :id is a dynamic param
      { path: 'reporting', component: ReportingView },
    ]
  }
]
```

### Navigation Guards

Guards run before a route loads and can redirect the user.

```js
router.beforeEach((to, from) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' }   // redirect to login
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { path: '/fuel' }    // already logged in, skip login page
  }
})
```

### Dynamic Route Params

The same `FuelFormView` component handles both creating and editing:

```js
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
// /fuel/new    → isEdit = false
// /fuel/5/edit → isEdit = true, route.params.id = '5'
```

### Lazy Loading Routes

```js
component: () => import('../views/reporting/ReportingView.vue')
```

This tells Vite to split the component into a separate JavaScript file that is only downloaded when the user navigates to that route — making the initial page load faster.

---

## Composables — Reusable Logic

A **composable** is a function that uses Vue's reactivity system and can be shared across multiple components. It is the Composition API's answer to mixins.

### `useFormatters`

```js
export function useFormatters() {
  const fmt = (date) => new Date(date).toLocaleDateString('en-GB')
  const m2o = (field) => Array.isArray(field) ? field[1] : field ?? '-'
  const num = (n) => Number(n).toFixed(2)
  return { fmt, m2o, num }
}
```

`m2o` handles Odoo's many2one fields, which come as `[id, "Display Name"]` arrays.

### `useDeleteConfirm`

A generic composable that manages the delete confirmation flow for any list. It takes the delete function as a parameter so the same logic works for fuel requests, vehicles, or anything else.

```js
export function useDeleteConfirm(deleteFn) {
  const deleteId = ref(null)
  const deleting = ref(false)

  async function confirmDelete() {
    deleting.value = true
    await deleteFn(deleteId.value)
    deleteId.value = null
    deleting.value = false
  }

  return { deleteId, deleting, confirmDelete }
}
```

---

## Chart.js Features Used

**Chart.js** is a JavaScript charting library. This project uses it through a custom Vue wrapper component (`BarChart.vue`).

### Tree-shaking (Importing Only What You Need)

Chart.js v4 requires you to register only the parts you use, keeping the bundle small:

```js
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)
```

### Chart Configuration

```js
new Chart(canvas.value, {
  type: 'bar',
  data: {
    labels: props.items.map(i => i.label),
    datasets: [{
      data: props.items.map(i => i.total),
      backgroundColor: props.bg,
      borderColor: props.border,
      borderWidth: 1,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toFixed(2)} L`
        }
      }
    },
    scales: {
      y: { ticks: { callback: (v) => v + ' L' } }
    }
  }
})
```

### Updating the Chart Without Recreating It

When new data arrives (via props), the chart updates without being destroyed and rebuilt:

```js
watch(() => props.items, (newItems) => {
  chart.data.labels = newItems.map(i => i.label)
  chart.data.datasets[0].data = newItems.map(i => i.total)
  chart.update()
}, { deep: true })
```

### Cleanup to Prevent Memory Leaks

When the component is removed from the DOM, the Chart.js instance must be destroyed:

```js
onBeforeUnmount(() => {
  chart?.destroy()
})
```

---

## Authentication — How It Works End to End

This section explains the full authentication flow: from the user clicking "Login" to every page being protected.

### Step 1 — The Login Request

When the user submits the login form, the app calls Odoo's session endpoint using **JSON-RPC over HTTP POST**:

```js
// src/api/odoo.js
const response = await axios.post('/web/session/authenticate', {
  jsonrpc: '2.0',
  method: 'call',
  params: {
    db: import.meta.env.VITE_ODOO_DB,
    login: username,
    password: password,
  }
}, { withCredentials: true })  // IMPORTANT: sends and receives cookies
```

`withCredentials: true` tells the browser to include cookies in cross-origin requests. Without it, Odoo's session cookie would be ignored and every request would appear as unauthenticated.

### Step 2 — What Odoo Returns

A successful login returns a JSON object with user details:

```json
{
  "result": {
    "uid": 3,
    "name": "Soda MORN",
    "username": "soda",
    "session_id": "abc123..."
  }
}
```

If the credentials are wrong, Odoo returns `result.uid = false` (not an HTTP error). So the app checks for this:

```js
if (!response.data.result?.uid) {
  throw new Error('Invalid username or password')
}
```

### Step 3 — Storing the User in Pinia + localStorage

After a successful login, the user object is saved in two places:

```js
// src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') ?? 'null'))

  const isAuthenticated = computed(() => !!user.value)

  async function login(username, password) {
    const result = await odooLogin(username, password)
    user.value = result
    localStorage.setItem('auth_user', JSON.stringify(result))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  return { user, isAuthenticated, login, logout }
})
```

| Storage | Why |
|---------|-----|
| **Pinia (`user` ref)** | Makes the user available reactively to all components right now |
| **localStorage** | Persists across page refreshes — the store reloads it on startup |

This means if you refresh the page, `user` is restored from localStorage immediately, so you stay logged in without having to log in again.

### Step 4 — `isAuthenticated` as a Computed Property

`isAuthenticated` is a `computed()` that returns `true` if `user.value` is not null:

```js
const isAuthenticated = computed(() => !!user.value)
```

The double `!!` converts any truthy value to `true` and any falsy value (`null`, `undefined`) to `false`. This is used by the navigation guard to decide whether to allow or block access.

### Step 5 — Route Guards Enforce Authentication

Every time the user navigates to any page, `router.beforeEach` runs first:

```js
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Page requires login but user is not authenticated → redirect to /login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' }
  }

  // User is already logged in and tries to visit /login → skip it, go to /fuel
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { path: '/fuel' }
  }
})
```

Routes are tagged in their definition with `meta`:

```js
{ path: '/login',  meta: { guestOnly: true } }       // only for guests
{ path: '/',       meta: { requiresAuth: true } }     // only for logged-in users
```

This means no component needs to check `isAuthenticated` individually — the guard handles it for the whole app.

### Step 6 — Logout

Logout calls Odoo to destroy the server-side session, then clears local state:

```js
async function logout() {
  await axios.post('/web/session/destroy', { jsonrpc: '2.0', method: 'call' },
    { withCredentials: true })
  user.value = null
  localStorage.removeItem('auth_user')
  router.push('/login')
}
```

The Odoo cookie is invalidated on the server, and the local user state is cleared. The router guard then prevents access to any protected page.

### Step 7 — Automatic Redirect on Session Expiry

Odoo sessions expire on the server after a period of inactivity. When this happens, Odoo still returns HTTP 200 but includes an error in the JSON body:

```json
{
  "error": {
    "code": 100,
    "message": "Odoo Session Expired",
    "data": { "name": "odoo.http.SessionExpiredException" }
  }
}
```

Because axios treats any 200 response as a success, the app would silently fail to load data and leave the user on a broken page. To fix this, an axios **response interceptor** is registered in `main.js` right after the router and Pinia are set up:

```js
// src/main.js
api.interceptors.response.use(
    (response) => {
        const error = response.data?.error
        const isSessionExpired =
            error?.data?.name === 'odoo.http.SessionExpiredException' ||
            error?.message === 'Odoo Session Expired' ||
            error?.code === 100
        if (isSessionExpired) {
            localStorage.removeItem(USER_KEY)
            router.push({ name: 'login' })
        }
        return response
    },
    (networkError) => {
        if (networkError.response?.status === 401) {
            localStorage.removeItem(USER_KEY)
            router.push({ name: 'login' })
        }
        return Promise.reject(networkError)
    }
)
```

The interceptor is placed in `main.js` (not in `odoo.js`) to avoid a circular import: `odoo.js` imports nothing from the app, but `auth.js` imports from `odoo.js`, and `router/index.js` imports from `auth.js` — so importing router inside `odoo.js` would create a cycle. Registering the interceptor in `main.js` after both are initialized breaks that cycle cleanly.

The two cases handled:
| Trigger | What Happened |
|---------|--------------|
| `error.data.name === 'odoo.http.SessionExpiredException'` | Server-side Odoo session expired |
| HTTP `401` | Network-level unauthorized (fallback) |

In both cases: `auth_user` is removed from `localStorage`, and the router redirects to `/login`. The existing navigation guard then prevents re-entry to any protected page.

---

## Odoo API Integration — How It Works

The app talks to Odoo using **JSON-RPC**, which is Odoo's standard remote procedure call format. Every request goes to the same URL (`/web/dataset/call_kw`) but with different `model` and `method` values in the body.

### The JSON-RPC Request Format

All CRUD operations follow this structure:

```js
POST /web/dataset/call_kw
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model":  "axiv.fuel.request",   // Odoo model name
    "method": "search_read",          // Odoo method to call
    "args":   [[]],                   // positional arguments (domain filter)
    "kwargs": {                       // keyword arguments
      "fields": ["name", "total_fuel"],
      "limit":  80,
      "order":  "request_date desc"
    }
  }
}
```

### The Axios Base Client

All requests go through a single axios instance configured with the Odoo base URL and cookie support:

```js
// src/api/odoo.js
const client = axios.create({
  baseURL: import.meta.env.VITE_ODOO_URL,
  withCredentials: true,   // send session cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

async function callKw(model, method, args, kwargs) {
  const res = await client.post('/web/dataset/call_kw', {
    jsonrpc: '2.0',
    method: 'call',
    params: { model, method, args, kwargs },
  })
  if (res.data.error) throw new Error(res.data.error.data?.message)
  return res.data.result
}
```

`callKw` is the single reusable function. All CRUD functions below just call it with different arguments.

### Error Handling

Odoo never returns HTTP 4xx/5xx for application errors. It always returns HTTP 200 but puts an `error` key in the JSON body. So the app checks for it explicitly:

```js
if (res.data.error) {
  throw new Error(res.data.error.data?.message ?? 'Unknown error')
}
```

This means you cannot rely on axios's built-in error handling — you must check `res.data.error` yourself.

### Reading Records — `search_read`

Fetches multiple records matching a domain filter. An empty domain `[]` means "all records".

```js
// src/api/fleet.js
export async function getList() {
  return callKw('axiv.fuel.request', 'search_read', [[]], {
    fields: ['name', 'request_date', 'request_by_id', 'vehicle_id',
             'vehicle_type_id', 'vehicle_code', 'beginning_fuel', 'total_fuel'],
    limit: 80,
    order: 'request_date desc',
  })
}
```

The result is an array of objects. Many2one fields (like `vehicle_id`) come back as `[id, "Display Name"]` — that is why the `m2o()` composable exists.

### Reading One Record — `read`

Fetches a single record by ID with all its fields:

```js
export async function getOne(id) {
  return callKw('axiv.fuel.request', 'read', [[id]], {
    fields: ['name', 'request_date', 'request_by_id', 'vehicle_id',
             'vehicle_type_id', 'vehicle_code', 'beginning_fuel',
             'total_fuel', 'request_reason'],
  })
}
```

Used in `FuelFormView` when opening an existing record for editing.

### Creating a Record — `create`

```js
export async function create(data) {
  return callKw('axiv.fuel.request', 'create', [data], {})
}
```

`data` is a plain object with field names as keys:

```js
{
  request_date: '2026-04-29',
  request_by_id: 5,
  vehicle_id: 12,
  beginning_fuel: 30.0,
  request_reason: 'Field trip',
}
```

Returns the new record's ID as an integer.

### Updating a Record — `write`

```js
export async function update(id, data) {
  return callKw('axiv.fuel.request', 'write', [[id], data], {})
}
```

`args` takes an array of IDs as the first element (you can update multiple records at once in Odoo), and the changed fields as the second element. Returns `true` on success.

### Deleting a Record — `unlink`

```js
export async function remove(id) {
  return callKw('axiv.fuel.request', 'unlink', [[id]], {})
}
```

Same pattern — array of IDs. Returns `true` on success. After calling this, the store removes the record from its local `records` array so the UI updates immediately without a refetch.

### Onchange — Auto-Populate Fields

When the user selects a vehicle, the app calls Odoo's `onchange` method to get the vehicle type and code automatically — exactly like Odoo's own web client does:

```js
export async function vehicleOnchange(vehicleId) {
  return callKw('axiv.fuel.request', 'onchange',
    [[], { vehicle_id: vehicleId }, ['vehicle_id'], {
      vehicle_id: '1',
      vehicle_type_id: '1',
      vehicle_code: '1',
    }],
    {}
  )
}
```

The response contains `value` with the fields Odoo wants to fill in:

```json
{
  "value": {
    "vehicle_type_id": [3, "Pickup Truck"],
    "vehicle_code": "TRK-001"
  }
}
```

The form then applies these values, saving the user from having to fill them manually.

### Dynamic Field Discovery — `fields_get`

The Odoo model's field names can differ between installations. For example, the fuel quantity field might be `fuel_qty` or `qty` depending on the module version. Instead of hardcoding the name, the app discovers it at runtime:

```js
export async function discoverLineFields() {
  const fields = await callKw('axiv.fuel.request.line', 'fields_get', [], {
    attributes: ['string', 'type'],
  })
  // Find the quantity field dynamically
  const qtyField = Object.keys(fields).find(k =>
    fields[k].type === 'float' && k.includes('qty')
  )
  return qtyField ?? 'fuel_qty'
}
```

This makes the app resilient to minor model differences across Odoo instances.

### Full API Method Reference

| Function | Odoo Method | Model | Purpose |
|----------|------------|-------|---------|
| `getList()` | `search_read` | `axiv.fuel.request` | Fetch all requests |
| `getOne(id)` | `read` | `axiv.fuel.request` | Fetch single request for editing |
| `getLines(id)` | `search_read` | `axiv.fuel.request.line` | Fetch fuel lines for a request |
| `create(data)` | `create` | `axiv.fuel.request` | Create new request |
| `update(id, data)` | `write` | `axiv.fuel.request` | Update existing request |
| `remove(id)` | `unlink` | `axiv.fuel.request` | Delete request |
| `vehicleOnchange(id)` | `onchange` | `axiv.fuel.request` | Auto-fill vehicle type and code |
| `discoverLineFields()` | `fields_get` | `axiv.fuel.request.line` | Detect quantity field name |
| `discoverRequestFields()` | `fields_get` | `axiv.fuel.request` | Detect if requester is user or employee |
| `getVehicles()` | `search_read` | `fleet.vehicle` | Fetch vehicles for dropdown |
| `getEmployees()` | `search_read` | `hr.employee` | Fetch employees for dropdown |
| `getUsers()` | `search_read` | `res.users` | Fetch users for dropdown |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Vue 3** | Frontend framework (Composition API) |
| **Vite** | Build tool and dev server |
| **Pinia** | State management |
| **Vue Router** | Client-side routing |
| **Axios** | HTTP requests |
| **Chart.js 4** | Bar charts |
| **Tailwind CSS 4** | Utility-first styling |
| **Odoo** | Backend ERP providing the JSON-RPC API |

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Set VITE_ODOO_URL=http://your-odoo-server

# Start development server
npm run dev

# Build for production
npm run build
```

---

## What I Learned

- How Vue 3's **Composition API** organizes code better than Options API for complex components
- How **Pinia stores** share state between pages without prop drilling
- How **Vue Router navigation guards** protect routes and redirect users
- How to wrap a third-party library (Chart.js) in a **Vue component** with proper lifecycle management
- How to build **composables** that extract logic and make it reusable
- How to connect to a real backend API and handle loading/error/empty states cleanly
- How **Tailwind CSS** speeds up UI development with utility classes
- How **axios interceptors** catch server-side session expiry in JSON-RPC APIs (where errors come back as HTTP 200) and redirect the user automatically
- Why circular imports matter and how to avoid them by registering interceptors in `main.js` instead of inside the API module
