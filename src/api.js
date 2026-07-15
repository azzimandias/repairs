const REPAIRS_ENDPOINT = `${getApiOrigin()}/repairs/actionrepairs`;
const MANAGERS_ENDPOINT = `${getApiOrigin()}/repairs/managers`;
const MODELS_ENDPOINT = `${getApiOrigin()}/api/sales/getmodels`;

function getApiOrigin() {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  }

  return `${window.location.protocol}//${window.location.hostname}`;
}

export async function fetchRepairs(params) {
  const response = await fetch(`${REPAIRS_ENDPOINT}?${buildRepairQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.msg || 'Ошибка загрузки заявок');
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

  const response = await fetch(`${REPAIRS_ENDPOINT}?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.msg || 'Ошибка загрузки заявки');
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
  const response = await fetch(REPAIRS_ENDPOINT, {
    method: repair?.id ? 'PUT' : 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(repair),
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.msg || 'Ошибка сохранения ремонта');
  }

  return result;
}

export async function fetchRepairManagers() {
  const response = await fetch(MANAGERS_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.msg || 'Ошибка загрузки менеджеров');
  }

  return Array.isArray(result?.data) ? result.data : [];
}

export async function fetchSalesModels() {
  const response = await fetch(MODELS_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.msg || 'Ошибка загрузки моделей');
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
