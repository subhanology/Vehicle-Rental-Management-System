import { request, setCredentials, clearCredentials } from './api.js';

const $ = id => document.getElementById(id);
const forms = { customer: $('customerForm'), vehicle: $('vehicleForm'), booking: $('bookingForm') };
const routes = { customer: '/customers', vehicle: '/vehicles', booking: '/bookings' };
const editing = { customer: null, vehicle: null, booking: null };
let customers = [], vehicles = [], bookings = [], role = null;

function message(text, error = false) {
    $('message').textContent = text;
    $('message').classList.toggle('error', error);
}
// An explicit callback handles errors in event-driven asynchronous operations.
function run(action, onError = error => message(error.message, true)) {
    return action().catch(onError);
}
function cell(row, value) {
    const td = row.insertCell(); td.textContent = String(value ?? ''); return td;
}
function button(text, callback, style = 'btn-outline-secondary') {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = `btn btn-sm ${style}`; btn.textContent = text;
    btn.addEventListener('click', callback); return btn;
}
function reset(kind) {
    editing[kind] = null; forms[kind].reset();
    forms[kind].querySelector('[type=submit]').textContent = `Save ${kind}`;
}
function edit(kind, item) {
    editing[kind] = item.id;
    Object.keys(item).forEach(key => {
        const input = forms[kind].elements.namedItem(key);
        if (input && typeof item[key] !== 'object') input.value = item[key];
    });
    forms[kind].querySelector('[type=submit]').textContent = `Update ${kind} #${item.id}`;
    forms[kind].scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function addActions(target, kind, item) {
    if (role !== 'admin') return;
    const group = document.createElement('div'); group.className = 'actions';
    group.append(button('Edit', () => edit(kind, item)), button('Delete', () => {
        if (!confirm(`Delete ${kind} #${item.id}?`)) return;
        run(async () => {
            await request(`${routes[kind]}/${item.id}`, 'DELETE');
            if (editing[kind] === item.id) reset(kind);
            await refresh(); message(`${kind} deleted.`);
        });
    }, 'btn-outline-danger'));
    target.append(group);
}
function fillSelect(select, items) {
    const previous = select.value;
    select.replaceChildren(new Option('Select one', ''));
    items.forEach(({ id, name }) => select.add(new Option(`${name} (#${id})`, String(id))));
    if (items.some(item => String(item.id) === previous)) select.value = previous;
}
function render() {
    $('customerCount').textContent = customers.length;
    $('vehicleCount').textContent = vehicles.length;
    $('bookingCount').textContent = bookings.length;
    fillSelect(forms.booking.elements.customerId, customers);
    fillSelect(forms.booking.elements.vehicleId, vehicles);
    $('vehicleCards').replaceChildren(); $('customerRows').replaceChildren(); $('bookingRows').replaceChildren();
    vehicles.forEach(vehicle => {
        const card = document.createElement('article'); card.className = 'card vehicle-card';
        const heading = document.createElement('h3'); heading.textContent = vehicle.name;
        const description = document.createElement('p'); description.textContent = `${vehicle.registrationNumber} · PKR ${vehicle.dailyRate.toLocaleString()} / day`;
        card.append(heading, description); addActions(card, 'vehicle', vehicle); $('vehicleCards').append(card);
    });
    customers.forEach(customer => {
        const row = $('customerRows').insertRow();
        [customer.id, customer.name, customer.email, customer.phone].forEach(value => cell(row, value));
        addActions(cell(row, ''), 'customer', customer);
    });
    bookings.forEach(booking => {
        const row = $('bookingRows').insertRow();
        [booking.id, booking.customer?.name ?? booking.customerId, booking.vehicle?.name ?? booking.vehicleId, booking.startDate, booking.endDate].forEach(value => cell(row, value));
        addActions(cell(row, ''), 'booking', booking);
    });
    if (!vehicles.length) $('vehicleCards').textContent = 'No vehicles registered.';
}
async function refresh() {
    // Promise.all executes three independent asynchronous GET requests concurrently.
    [customers, vehicles, bookings] = await Promise.all([request('/customers'), request('/vehicles'), request('/bookings')]);
    render();
}
function getData(kind) {
    const form = forms[kind];
    const data = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
    if (Object.values(data).some(value => value === '')) throw new Error('All fields are required.');
    if (kind === 'customer' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Enter a valid email.');
    if (kind === 'vehicle') {
        data.dailyRate = Number(data.dailyRate);
        if (!Number.isInteger(data.dailyRate) || data.dailyRate < 1) throw new Error('Daily rate must be a positive integer.');
    }
    if (kind === 'booking') {
        data.customerId = Number(data.customerId); data.vehicleId = Number(data.vehicleId);
        if (!data.customerId || !data.vehicleId) throw new Error('Choose a customer and vehicle.');
        if (data.startDate > data.endDate) throw new Error('End date must be on or after start date.');
    }
    return data;
}
Object.entries(forms).forEach(([kind, form]) => {
    form.addEventListener('submit', event => {
        event.preventDefault();
        run(async () => {
            const data = getData(kind), id = editing[kind];
            await request(id === null ? routes[kind] : `${routes[kind]}/${id}`, id === null ? 'POST' : 'PUT', data);
            reset(kind); await refresh(); message(`${kind} saved successfully.`);
        });
    });
});
document.querySelectorAll('[data-reset]').forEach(btn => btn.addEventListener('click', () => reset(btn.dataset.reset)));
$('refresh').addEventListener('click', () => run(refresh));
$('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
        const { username, password } = Object.fromEntries(new FormData(event.target));
        setCredentials(username.trim(), password);
        const user = await request('/auth/me'); role = user.role;
        await refresh();
        $('roleLabel').textContent = `Signed in as ${user.username} (${role})`;
        document.querySelectorAll('[data-admin]').forEach(el => el.hidden = role !== 'admin');
        $('loginPanel').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
        event.target.reset(); message('Signed in successfully.');
    }, error => { clearCredentials(); role = null; message(error.message, true); });
});
$('logout').addEventListener('click', () => {
    clearCredentials(); role = null; customers = []; vehicles = []; bookings = [];
    Object.keys(forms).forEach(reset); render();
    $('dashboard').hidden = true; $('logout').hidden = true; $('loginPanel').hidden = false;
    message('Signed out.');
});
