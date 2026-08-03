const API_ORIGIN = getApiOrigin();
const REPAIRS_ENDPOINT = `${API_ORIGIN}/api/repairs/actionrepairs`;
const MANAGERS_ENDPOINT = `${API_ORIGIN}/api/repairs/managers`;
const MODELS_ENDPOINT = `${API_ORIGIN}/api/sales/getmodels`;
const SPARE_MODEL_ENDPOINT = `${API_ORIGIN}/api/repairs/spares/model`;
const REPAIR_OPTIONS_ENDPOINT = `${API_ORIGIN}/api/repairs/options`;
const BID_SELECTS_ENDPOINT = `${API_ORIGIN}/api/sales/bidselects`;
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

export async function orderRepairSpareParts(repairId, spareIds) {
  const result = await apiFetch(
    `${API_ORIGIN}/api/repairs/${encodeURIComponent(repairId)}/spare-parts/order`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spare_ids: spareIds }),
    },
  );

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Не удалось заказать запчасти'));
  }

  return result;
}

export async function fetchCurrentUser() {
  const result = await apiFetch(USER_ENDPOINT);
  const payload = result?.data || result;

  if (payload?.user && typeof payload.user === 'object') {
    return {
      ...payload.user,
      acls: payload.acls || payload.user.acls || [],
    };
  }

  if (payload && !Array.isArray(payload) && typeof payload === 'object') {
    return {
      ...payload,
      acls: payload.acls || result?.acls || [],
    };
  }

  return payload || null;
}

export async function fetchRepairManagers() {
  const result = await apiFetch(MANAGERS_ENDPOINT);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки менеджеров'));
  }

  return Array.isArray(result?.data) ? result.data : [];
}

export async function fetchRepairOrganizations(search = '') {
  const normalizedSearch = String(search || '').trim();

  if (!normalizedSearch) {
    return [];
  }

  const query = new URLSearchParams({ query: normalizedSearch });
  const result = await apiFetch(`${API_ORIGIN}/sales/data/getorgslist?${query.toString()}`);

  return Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
}

export async function fetchOrganizationRequisites(organizationId) {
  const normalizedOrganizationId = String(organizationId ?? '').trim();

  if (!normalizedOrganizationId || normalizedOrganizationId === '0') {
    return [];
  }

  const numericOrganizationId = Number(normalizedOrganizationId);
  const result = await apiFetch(BID_SELECTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        requisite_select: Number.isFinite(numericOrganizationId)
          ? numericOrganizationId
          : normalizedOrganizationId,
      },
    }),
  });
  const requisites = result?.selects?.requisite_select;

  return Array.isArray(requisites)
    ? requisites
        .map((requisite) => ({
          ...requisite,
          id: requisite.value ?? requisite.key,
        }))
        .filter((requisite) => requisite.id !== null && requisite.id !== undefined && String(requisite.id) !== '0')
    : [];
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

export async function fetchSpareModel(modelId) {
  const query = new URLSearchParams();
  query.set('id', String(modelId));

  const result = await apiFetch(`${SPARE_MODEL_ENDPOINT}?${query.toString()}`);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки запчасти'));
  }

  return result?.data || result || null;
}

export async function fetchRepairOptions() {
  const result = await apiFetch(REPAIR_OPTIONS_ENDPOINT);

  if (result?.error) {
    throw new Error(getApiErrorMessage(result, 'Ошибка загрузки справочников ремонта'));
  }

  const payload = result?.data && !Array.isArray(result.data) ? result.data : result;
  const legacySelectsResult = await apiFetch(BID_SELECTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        conveyance_select: true,
      },
    }),
  }).catch(() => null);
  const legacyConveyances = legacySelectsResult?.selects?.conveyance_select;
  const conveyances = (
    Array.isArray(legacyConveyances) ? legacyConveyances : payload?.conveyances || []
  )
    .map((conveyance) => ({
      ...conveyance,
      id: conveyance.value ?? conveyance.key ?? conveyance.id,
      label: conveyance.label || conveyance.name,
    }))
    .filter(
      (conveyance) =>
        conveyance.id !== null &&
        conveyance.id !== undefined &&
        String(conveyance.id).trim() !== '' &&
        String(conveyance.id) !== '0',
    );

  return {
    engineers: Array.isArray(payload?.engineers) ? payload.engineers : [],
    defects: Array.isArray(payload?.defects) ? payload.defects : [],
    defect_causes: Array.isArray(payload?.defect_causes) ? payload.defect_causes : [],
    repair_types: Array.isArray(payload?.repair_types) ? payload.repair_types : [],
    conveyances,
  };
}

export async function downloadRepairDocument(repairId, documentType) {
  const response = await fetch(
    `${API_ORIGIN}/api/repairs/${encodeURIComponent(repairId)}/documents/${encodeURIComponent(documentType)}`,
    {
      credentials: 'include',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    },
  );

  handleAuthError(response.status);

  if (!response.ok) {
    throw await createResponseError(response, 'Не удалось скачать документ');
  }

  const blob = await response.blob();
  const filename = getDownloadFilename(response.headers.get('content-disposition'), `${documentType}.docx`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function createInvoiceRequest(repairId) {
  const response = await fetch(`${API_ORIGIN}/api/repairs/${encodeURIComponent(repairId)}/invoice-requests`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getXsrfHeaders(),
    },
    body: JSON.stringify({}),
  });
  const result = await response.json().catch(() => null);

  handleAuthError(response.status);

  if (response.status === 409 && result?.error === 'invoice_request_already_exists') {
    return { ...result, alreadyExists: true };
  }

  if (!response.ok) {
    const error = new Error(getApiErrorMessage(result, 'Не удалось отправить заявку на счёт'));
    error.data = result;
    throw error;
  }

  return result;
}

async function createResponseError(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    payload = text ? { message: text } : null;
  }

  const error = new Error(getApiErrorMessage(payload, fallbackMessage));
  error.data = payload;

  return error;
}

function getDownloadFilename(disposition, fallback) {
  if (!disposition) {
    return fallback;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  const value = encodedMatch?.[1] || plainMatch?.[1];

  if (!value) {
    return fallback;
  }

  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
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
