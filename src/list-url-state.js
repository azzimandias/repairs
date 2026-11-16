export const columnKeys = ['id', 'date', 'uid', 'equipment', 'serialNumber', 'client', 'issueDate', 'price', 'status'];
const defaultFilters = {
  ...Object.fromEntries(columnKeys.map(key => [key, ''])),
  repairType: 'all',
  manager: 'all',
};

export function readListUrlState(search) {
  const params = new URLSearchParams(search);
  const repairType = params.get('repairType');
  const manager = params.get('manager');
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));

  return {
    filters: {
      ...Object.fromEntries(columnKeys.map(key => [key, params.get(key) || ''])),
      repairType: ['Платный', 'Гарантийный'].includes(repairType) ? repairType : 'all',
      manager: /^\d+$/.test(manager || '') && Number(manager) > 0 ? manager : 'all',
    },
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [30, 50, 100].includes(pageSize) ? pageSize : 30,
  };
}

export function buildListUrl(href, { filters, page, pageSize }) {
  const url = new URL(href);
  for (const key of ['audience', 'unfinished', 'search']) url.searchParams.delete(key);
  const values = { ...filters, page, pageSize };
  const defaults = { ...defaultFilters, page: 1, pageSize: 30 };

  Object.entries(values).forEach(([key, value]) => {
    if (value === defaults[key]) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value === true ? '1' : String(value));
    }
  });

  return `${url.pathname}${url.search}${url.hash}`;
}
