const defaultFilters = {
  audience: 'all',
  repairType: 'all',
  manager: 'all',
  unfinished: false,
  search: '',
};

export function readListUrlState(search) {
  const params = new URLSearchParams(search);
  const audience = params.get('audience');
  const repairType = params.get('repairType');
  const manager = params.get('manager');
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));

  return {
    filters: {
      audience: ['manager', 'engineer'].includes(audience) ? audience : 'all',
      repairType: ['Платный', 'Гарантийный'].includes(repairType) ? repairType : 'all',
      manager: /^\d+$/.test(manager || '') && Number(manager) > 0 ? manager : 'all',
      unfinished: params.get('unfinished') === '1',
      search: params.get('search') || '',
    },
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [30, 50, 100].includes(pageSize) ? pageSize : 30,
  };
}

export function buildListUrl(href, { filters, page, pageSize }) {
  const url = new URL(href);
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
