const API_ORIGIN = getApiOrigin();
const REPAIRS_ENDPOINT = `${API_ORIGIN}/api/repairs/actionrepairs`;
const MANAGERS_ENDPOINT = `${API_ORIGIN}/repairs/managers`;
const MODELS_ENDPOINT = `${API_ORIGIN}/api/sales/getmodels`;
const USER_ENDPOINT = `${API_ORIGIN}/api/usda`;

function getApiOrigin() {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  }

  return `${window.location.protocol}//${window.location.hostname}`;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...getXsrfHeaders(),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);

  handleAuthError(response.status);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, `Ошибка запроса (${response.status})`));
  }

  return result;
}

function handleAuthError(status) {
  if (![401, 403, 419].includes(status)) {
    return;
  }

  console.log('Auth/session error:', status);

  document.cookie.split(';').forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });

  window.location.href = `${API_ORIGIN}/login`;
}

function getXsrfHeaders() {
  const xsrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (!xsrfToken) {
    return {};
  }

  return {
    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
  };
}

function getApiErrorMessage(result, fallback) {
  if (!result) {
    return fallback;
  }

  return result.msg || result.message || result.error || fallback;
}

export async function fetchRepairs(params) {
  const result = await apiFetch(`${REPAIRS_ENDPOINT}?${buildRepairQuery(params)}`);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки заявок'));
  }

  if (Array.isArray(result)) {
    return {
      data: result,
      page: params.page || 1,
      per_page: params.perPage || result.length,
      total: result.length,
      last_page: 1,
      from: result.length ? 1 : 0,
      to: result.length,
    };
  }

  return {
    data: Array.isArray(result?.data) ? result.data : [],
    page: Number(result?.page || params.page || 1),
    per_page: Number(result?.per_page || params.perPage || 0),
    total: Number(result?.total || 0),
    last_page: Number(result?.last_page || 1),
    from: Number(result?.from || 0),
    to: Number(result?.to || 0),
  };
}

export async function fetchRepair(id) {
  const query = new URLSearchParams();
  query.set('id', String(id));
  query.set('page', '1');
  query.set('per_page', '1');

  const result = await apiFetch(`${REPAIRS_ENDPOINT}?${query.toString()}`);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки заявки'));
  }

  if (Array.isArray(result)) {
    return result.find((repair) => String(repair.id) === String(id)) || result[0] || null;
  }

  if (Array.isArray(result?.data)) {
    return result.data.find((repair) => String(repair.id) === String(id)) || result.data[0] || null;
  }

  return result || null;
}

export async function saveRepair(repair) {
  const result = await apiFetch(REPAIRS_ENDPOINT, {
    method: repair?.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(repair),
  });

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка сохранения ремонта'));
  }

  return result;
}

export async function fetchCurrentUser() {
  const result = await apiFetch(USER_ENDPOINT);

  return result?.data || result?.user || result || null;
}

export async function fetchRepairManagers() {
  const result = await apiFetch(MANAGERS_ENDPOINT);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки менеджеров'));
  }

  return Array.isArray(result?.data) ? result.data : [];
}

export async function fetchSalesModels() {
  const result = await apiFetch(MODELS_ENDPOINT);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки моделей'));
  }

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.rows)) {
    return result.rows;
  }

  if (Array.isArray(result?.models)) {
    return result.models;
  }

  return [];
}

function buildRepairQuery({ page, perPage, direction, orderby, fillters }) {
  const query = new URLSearchParams();

  query.set('page', String(page || 1));
  query.set('per_page', String(perPage || 50));
  query.set('direction', String(direction || 1));
  query.set('orderby', orderby || 'date');

  Object.entries(fillters || {}).forEach(([key, value]) => {
    query.set(`fillters[${key}]`, value ?? '');
  });

  return query.toString();
}
