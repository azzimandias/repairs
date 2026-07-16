import React, { useEffect, useState } from 'react';
import { AutoComplete, Button, Checkbox, ConfigProvider, DatePicker, Dropdown, Input, InputNumber, Segmented, Select, Timeline, notification } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
  Home,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { fetchCurrentUser, fetchRepair, fetchRepairManagers, fetchRepairs, fetchSalesModels, saveRepair } from './api';
import 'antd/dist/reset.css';
import './styles.css';

const homeUrl = import.meta.env.VITE_HOME_URL || '/';
const emptyRequest = { id: '', status: '', status_id: null, equipment: '', client: '' };

const emptyRequestDetails = {
  equipment: {
    model: '',
    serialNumber: '',
    declaredFault: '',
    kit: '',
    externalState: '',
    pickupPoint: '',
    sellerName: '',
    saleOrRepairDate: '',
    invoiceNumber: '',
  },
  client: {
    companyName: '',
    city: '',
    contactPerson: '',
    email: '',
    phone: '',
    postalAddress: '',
    requestManager: '',
    approvedWorks: '',
  },
  repair: {
    engineer: '',
    faultDescription: '',
    faultReasons: '',
    expectedRepair: '',
    repair: '',
    usageViolation: '',
    diagnosisMinutes: '',
    comment: '',
    diagnosisTotal: '',
    repairMinutes: '',
    repairTotal: '',
    spareWaitingComment: '',
    diagnosisAct: '',
    workAct: '',
  },
  parts: [],
};

const fieldLabels = {
  model: 'Модель',
  serialNumber: 'Серийный номер',
  declaredFault: 'Заявленная неисправность',
  kit: 'Комплектация',
  externalState: 'Внешнее состояние',
  pickupPoint: 'Пункт приема/выдачи',
  sellerName: 'Наименование продавца',
  saleOrRepairDate: 'Дата продажи/ремонта',
  invoiceNumber: 'Номер накладной',
  companyName: 'Наименование организации',
  city: 'Город',
  contactPerson: 'Контактное лицо',
  email: 'Электронная почта',
  phone: 'Телефон',
  postalAddress: 'Почтовый адрес',
  requestManager: 'Менеджер заявки',
  approvedWorks: 'Утвержденные работы',
  engineer: 'Инженер заявки',
  faultDescription: 'Описание неисправности',
  faultReasons: 'Причины неисправности',
  expectedRepair: 'Предполагаемый ремонт',
  repair: 'Ремонт',
  usageViolation: 'Нарушение правил эксплуатации',
  diagnosisMinutes: 'Трудозатраты диагностики (мин.)',
  comment: 'Комментарий',
  diagnosisTotal: 'Общая стоимость диагностики',
  repairMinutes: 'Трудозатраты ремонта (мин.)',
  repairTotal: 'Общая стоимость ремонта',
  spareWaitingComment: 'Комментарий об ожидании запчасти',
  diagnosisAct: 'Акт диагностики',
  workAct: 'Акт работ',
};

const dateFieldNames = new Set(['saleOrRepairDate']);

const selectFieldOptions = {
  model: [],
  pickupPoint: [],
  engineer: [],
  faultDescription: [],
  faultReasons: [],
  expectedRepair: [],
  repair: [],
  usageViolation: [],
};

const requestStatusRoadmap = [
  { number: 100, status: 'Заявка создана', role: 'Склад' },
  { number: 200, status: 'Заявка обработана', role: 'Склад' },
  { number: 300, status: 'Принята в сервис-центре', role: 'Сервис-центр' },
  { number: 400, status: 'Диагностика проведена', role: 'Сервис-центр' },
  { number: 450, status: 'Акт диагностики отправлен', role: 'Менеджер' },
  { number: 500, status: 'Объем работы согласован', role: 'Менеджер' },
  { number: 550, status: 'Запчасти получены', role: 'Сервис-центр' },
  { number: 600, status: 'Работа завершена', role: 'Сервис-центр' },
  { number: 700, status: 'Счет выставлен', role: 'Администратор' },
  { number: 800, status: 'Счет оплачен', role: 'Администратор' },
  { number: 850, status: 'Отправлено на склад', role: 'Склад' },
  { number: 900, status: 'Доставлено на склад выдачи', role: 'Склад' },
  { number: 1000, status: 'Оборудование выдано', role: 'Склад' },
];

function mapBackendRepair(repair) {
  const modelName = Array.isArray(repair.model) ? repair.model[0]?.name_seo : repair.model?.name_seo;
  const statusName = Array.isArray(repair.status) ? repair.status[0]?.name : repair.status?.name;
  const engineerName = Array.isArray(repair.engin) ? formatPerson(repair.engin[0]) : formatPerson(repair.engin);
  const managerName =
    repair.manager_name ||
    (Array.isArray(repair.manager) ? formatPerson(repair.manager[0]) : formatPerson(repair.manager));
  const repairCategory = Number(repair.category_repairs);

  return {
    ...repair,
    id: repair.id,
    date: repair.date || repair.created_at || '',
    uid: repair.uid || '',
    equipment: modelName || repair.model_name || repair.name || '-',
    serialNumber: repair.sn || '',
    client: repair.client_org_name || repair.client_name || '-',
    manager: managerName || '-',
    engineer: engineerName || '-',
    issueDate: repair.date_end || '',
    price: Number(repair.price || 0),
    repairType: repairCategory === 2 || repairCategory === 3 ? 'Гарантийный' : 'Платный',
    status: statusName || String(repair.status_id || '-'),
    audience: repair.primary ? 'manager' : 'engineer',
  };
}

function mapBackendRepairDetails(repair) {
  const summary = mapBackendRepair(repair);

  return {
    equipment: {
      model: summary.equipment,
      serialNumber: summary.serialNumber,
      declaredFault: repair.defect_clients || repair.defect_note || repair.client_defect_note || '',
      kit: repair.complete_set || repair.complect || repair.equipment_set || '',
      externalState: repair.condition || repair.external_state || repair.appearance || '',
      pickupPoint: repair.point_of_delivery || repair.conveyance_name || repair.conveyance?.name || '',
      sellerName: repair.sale_org_name || '',
      saleOrRepairDate: formatBackendDateInput(repair.sale_date || repair.date_sale || repair.date),
      invoiceNumber: repair.sale_invoice || repair.invoice_number || repair.number_invoice || '',
    },
    client: {
      companyName: repair.client_org_name || summary.client,
      city: repair.client_sity || repair.client_city || '',
      contactPerson: repair.client_fio_contact || repair.client_contact_name || repair.contact_person || '',
      email: repair.client_email || repair.email || '',
      phone: repair.client_tel || repair.client_phone || repair.phone || '',
      postalAddress: repair.client_post || repair.client_address || repair.post_address || '',
      requestManager: summary.manager,
      approvedWorks: repair.approved_work_name || String(repair.approved_work || ''),
    },
    repair: {
      engineer: summary.engineer,
      faultDescription: repair.engin_defect_note || '',
      faultReasons: repair.probable_causes_note || '',
      expectedRepair: repair.engin_list_repairs_note || '',
      repair: repair.act_text_job || repair.repair_note || repair.repairs_note || '',
      usageViolation: repair.engin_foul_comment || repair.violation_note || repair.operating_rules_violation || '',
      diagnosisMinutes: repair.engin_time_job_diagnostics || repair.diagnostics_work_time || repair.diagnosis_minutes || '',
      comment: repair.engin_comment || repair.client_commet || repair.comment || '',
      diagnosisTotal: repair.diagnostics_price || repair.diagnosis_total || '',
      repairMinutes: repair.engin_time_job || repair.repair_work_time || repair.repair_minutes || '',
      repairTotal: repair.engin_price || repair.repair_price || repair.repair_total || '',
      spareWaitingComment: repair.wait_spares_comment || '',
      diagnosisAct: repair.act_text_diagnostic || repair.diagnostics_act || '',
      workAct: repair.act_text_job || repair.work_act || '',
    },
    parts: Array.isArray(repair.spares) ? repair.spares.map(mapBackendSpare) : [],
  };
}

function formatPerson(person) {
  if (!person) {
    return '';
  }

  return [person.surname, person.name, person.secondname].filter(Boolean).join(' ');
}

function formatBackendDate(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    return formatDate(value * 1000);
  }

  if (/^\d+$/.test(String(value))) {
    return formatDate(Number(value) * 1000);
  }

  return value;
}

function formatBackendDateInput(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString().slice(0, 10);
  }

  if (/^\d+$/.test(String(value))) {
    return new Date(Number(value) * 1000).toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    return String(value).slice(0, 10);
  }

  return value;
}

function mapBackendSpare(spare) {
  return {
    id: spare.id,
    type: spare.type,
    source: Number(spare.type) === 0 ? 'Наша' : 'Покупная',
    modelId: spare.model_id || '',
    model: spare.name || spare.model_name || String(spare.model_id || ''),
    qty: spare.count || 1,
    stock: spare.stock_count ?? spare.count_sklad ?? 0,
    price: spare.price || 0,
    comment: spare.comment || '',
  };
}

function buildBackendFilters(filters) {
  const type = filters.unfinished ? 3 : filters.audience === 'manager' ? 1 : filters.audience === 'engineer' ? 2 : 0;

  return {
    type,
    'category-repair': filters.repairType === 'Гарантийный' ? 2 : filters.repairType === 'Платный' ? 1 : 0,
    manager: Number(filters.manager) || 0,
    query: filters.search,
  };
}

function mapManagerOption(manager) {
  return {
    id: manager.id,
    label:
      manager.label ||
      [manager.surname, manager.name, manager.secondname]
        .filter(Boolean)
        .join(' ') ||
      String(manager.id),
  };
}

function mapSalesModelOption(model) {
  return {
    id: model.id ?? model.model_id ?? model.value ?? model.name ?? model.name_seo,
    label: model.name_seo || model.name || model.label || String(model.id ?? ''),
  };
}

function isOwnPart(part) {
  return part.source === 'Наша' || part.source === 'РќР°С€Р°' || Number(part.type) === 0;
}

function App({ currentUser }) {
  const path = window.location.pathname;
  const detailMatch = path.match(/^\/requests\/([^/]+)$/);

  if (detailMatch) {
    return <RequestPage currentUser={currentUser} requestId={decodeURIComponent(detailMatch[1])} />;
  }

  return <RequestsListPage currentUser={currentUser} />;
}

function AppRoot() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let ignore = false;

    fetchCurrentUser()
      .then((user) => {
        if (!ignore) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCurrentUser(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#2d6fd3',
          borderRadius: 7,
          colorBgContainer: '#f7fbff',
          colorBorder: '#c7d9ee',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <App currentUser={currentUser} />
    </ConfigProvider>
  );
}

function GlobalHeader({ currentUser }) {
  const userName = formatUserName(currentUser) || 'Пользователь';
  const userInitials = getUserInitials(userName);

  return (
    <div className="global-header">
      <div className="title-kicker">
        <a className="home-link" href={homeUrl} title="На главную">
          <Home size={17} />
        </a>
        <p className="eyebrow">Сервис-центр</p>
      </div>
      <Dropdown
        menu={{
          items: [
            {
              key: 'logout',
              label: <a href="/logout">Выйти</a>,
            },
          ],
        }}
        placement="bottomRight"
        trigger={['hover']}
      >
        <div className="user-profile" title="Текущий пользователь">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-name">
            <strong>{userName}</strong>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}

function formatUserName(user) {
  if (!user) {
    return '';
  }

  if (typeof user === 'string') {
    return user;
  }

  return (
    user.full_name ||
    user.fullName ||
    user.fio ||
    [user.name, user.surname].filter(Boolean).join(' ') ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.name ||
    user.login ||
    user.email ||
    ''
  );
}

function getUserInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'П';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function RequestsListPage({ currentUser }) {
  const [filters, setFilters] = useState({
    audience: 'all',
    repairType: 'all',
    manager: 'all',
    unfinished: false,
    search: '',
  });
  const [requests, setRequests] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
  });
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, paginationMeta.lastPage);
  const visibleRequests = requests;
  const nearbyPages = getNearbyPages(page, totalPages);

  useEffect(() => {
    document.title = 'Сервис-центр | Заявки на ремонт';
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchRepairManagers()
      .then((items) => {
        if (!ignore) {
          setManagerOptions(items.map(mapManagerOption));
        }
      })
      .catch(() => {
        if (!ignore) {
          setManagerOptions((current) => current);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);

    fetchRepairs({
      page,
      perPage: pageSize,
      direction: 1,
      orderby: 'date',
      fillters: buildBackendFilters(filters),
    })
      .then((result) => {
        if (ignore) {
          return;
        }

        setRequests(result.data.map(mapBackendRepair));
        setPaginationMeta({
          total: result.total,
          lastPage: result.last_page,
          from: result.from,
          to: result.to,
        });
        setLoadError('');
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        setRequests([]);
        setPaginationMeta({
          total: 0,
          lastPage: 1,
          from: 0,
          to: 0,
        });
        setLoadError(error.message || 'Ошибка загрузки заявок');
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filters, page, pageSize]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }

  function goToPage(value) {
    const nextPage = Math.min(totalPages, Math.max(1, Number(value) || 1));
    setPage(nextPage);
  }

  function openRequest(requestId) {
    window.open(`/requests/${encodeURIComponent(requestId)}`, '_blank', 'noopener,noreferrer');
  }

  function exportExcel() {
    const columns = [
      'Дата',
      'UID',
      'Оборудование',
      'Серийный номер',
      'Клиент',
      'Менеджер',
      'Дата выдачи',
      'Стоимость',
      'Тип ремонта',
      'Статус заявки',
    ];
    const rows = requests.map((request) => [
      request.date,
      request.uid,
      request.equipment,
      request.serialNumber,
      request.client,
      request.manager,
      request.issueDate || '-',
      formatCurrency(request.price),
      request.repairType,
      request.status,
    ]);
    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <table>
            <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows
                .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`)
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repair-requests-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell list-shell">
      <div className="sticky-controls">
        <GlobalHeader currentUser={currentUser} />
        <header className="topbar">
          <div>
            <h1>Заявки на ремонт</h1>
          </div>
          <div className="topbar-actions">
            <Button className="app-button" icon={<Download size={16} />} onClick={exportExcel}>
              Excel
            </Button>
            <Button className="app-button" type="primary" icon={<FilePlus2 size={16} />}>
              Создать заявку
            </Button>
          </div>
        </header>

        <section className="toolbar" aria-label="Фильтры заявок">
          <Segmented
            className="segmented"
            value={filters.audience}
            onChange={(value) => updateFilter('audience', value)}
            options={[
              { value: 'all', label: 'Все' },
              { value: 'manager', label: 'Для менеджера' },
              { value: 'engineer', label: 'Для инженера' },
            ]}
          />

        <label className="checkbox-filter">
            <Checkbox
              checked={filters.unfinished}
              onChange={(event) => updateFilter('unfinished', event.target.checked)}
            />
            Незаконченные
          </label>

          <Select
            value={filters.repairType}
            onChange={(value) => updateFilter('repairType', value)}
            options={[
              { value: 'all', label: 'Любой тип ремонта' },
              { value: 'Платный', label: 'Платный' },
              { value: 'Гарантийный', label: 'Гарантийный' },
            ]}
          />

          <Select
            showSearch
            value={filters.manager}
            onChange={(value) => updateFilter('manager', value)}
            optionFilterProp="label"
            options={[
              { value: 'all', label: 'Все менеджеры' },
              ...managerOptions.map((manager) => ({ value: String(manager.id), label: manager.label })),
            ]}
          />

          <Input
            className="search-field"
            prefix={<Search size={18} />}
            allowClear
            placeholder="Поиск по тексту"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </section>

        <section className="table-pagination" aria-label="Пагинация заявок">
          <span>
            Найдено: <strong>{paginationMeta.total}</strong>
            {paginationMeta.total > 0 && (
              <span className="page-range">
                {paginationMeta.from}-{paginationMeta.to}
              </span>
            )}
          </span>
          <label className="page-size">
            Строк на странице
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
              options={[
                { value: 30, label: '30' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </label>
          <div className="pager">
          <Button className="icon-button" disabled={page === 1} icon={<ChevronLeft size={18} />} onClick={() => setPage(page - 1)} />
          <div className="page-buttons">
            {nearbyPages.map((pageNumber) => (
              <Button
                className={`page-button ${pageNumber === page ? 'active' : ''}`}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
          </div>
          <label className="page-jump">
            <span>№</span>
            <InputNumber
              min={1}
              max={totalPages}
              value={page}
              onChange={(value) => goToPage(value)}
            />
          </label>
          <Button
            className="icon-button"
            disabled={page === totalPages}
            icon={<ChevronRight size={18} />}
            onClick={() => setPage(page + 1)}
          />
          </div>
        </section>
        {loadError && <div className="load-error">{loadError}</div>}
      </div>

      <section className="table-wrap">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>UID</th>
              <th>Оборудование</th>
              <th>Серийный номер</th>
              <th>Клиент</th>
              <th>Менеджер</th>
              <th>Дата выдачи</th>
              <th>Стоимость</th>
              <th>Тип ремонта</th>
              <th>Статус заявки</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <tr className="skeleton-row" key={`request-skeleton-${index}`}>
                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                      <td key={`request-skeleton-${index}-${cellIndex}`}>
                        <span className="skeleton-line" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleRequests.map((request) => (
                  <tr key={request.id} onDoubleClick={() => openRequest(request.id)} title="Двойной клик откроет заявку">
                    <td>{formatDate(request.date)}</td>
                    <td className="mono">{request.uid}</td>
                    <td>{request.equipment}</td>
                    <td className="mono">{request.serialNumber}</td>
                    <td>{request.client}</td>
                    <td>{request.manager}</td>
                    <td>{request.issueDate ? formatDate(request.issueDate) : '-'}</td>
                    <td>{formatCurrency(request.price)}</td>
                    <td>
                      <span className={`repair-type ${request.repairType === 'Гарантийный' ? 'warranty' : 'paid'}`}>
                        {request.repairType}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill">{request.status}</span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && visibleRequests.length === 0 && (
          <div className="empty-state">Заявки по выбранным фильтрам не найдены</div>
        )}
      </section>
    </main>
  );
}

function getNearbyPages(currentPage, totalPages) {
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, Math.min(currentPage - half, totalPages - maxVisible + 1));
  const end = Math.min(totalPages, start + maxVisible - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function RequestPage({ currentUser, requestId }) {
  const [request, setRequest] = useState(emptyRequest);
  const [details, setDetails] = useState(emptyRequestDetails);
  const [parts, setParts] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [salesModels, setSalesModels] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationApi, notificationContext] = notification.useNotification();
  const currentSnapshot = buildRepairSnapshot(request, details, parts);
  const hasChanges = Boolean(initialSnapshot) && currentSnapshot !== initialSnapshot;
  const displayEquipment = details.equipment.model || request.equipment;
  const displayClient = details.client.companyName || request.client;

  useEffect(() => {
    document.title = `Сервис-центр | ${requestId}`;
  }, [requestId]);

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);

    fetchRepair(requestId)
      .then((repair) => {
        if (ignore || !repair) {
          return;
        }

        const mappedRequest = mapBackendRepair(repair);
        const mappedDetails = mapBackendRepairDetails(repair);

        setRequest(mappedRequest);
        setDetails(mappedDetails);
        setParts(mappedDetails.parts);
        setInitialSnapshot(buildRepairSnapshot(mappedRequest, mappedDetails, mappedDetails.parts));
        setLoadError('');
      })
      .catch(() => {
        if (!ignore) {
          setRequest(emptyRequest);
          setDetails(emptyRequestDetails);
          setParts([]);
          setInitialSnapshot('');
          setLoadError('Ошибка загрузки заявки');
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  useEffect(() => {
    let ignore = false;

    fetchSalesModels()
      .then((models) => {
        if (!ignore) {
          setSalesModels(models.map(mapSalesModelOption));
        }
      })
      .catch(() => {
        if (!ignore) {
          setSalesModels([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function addPart(source) {
    const isOwn = source === 'Наша';

    setParts((current) => [
      ...current,
      { source, type: isOwn ? 0 : 1, modelId: '', model: '', qty: 1, stock: isOwn ? 0 : '-', price: 0, comment: '' },
    ]);
  }

  function removePart(index) {
    setParts((current) => current.filter((_, partIndex) => partIndex !== index));
  }

  function updateDetail(section, field, value) {
    setDetails((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function applySavedRepair(result, fallbackRequest = request, fallbackDetails = details, fallbackParts = parts) {
    const nextRequest = result ? mapBackendRepair(result) : fallbackRequest;
    const nextDetails = result ? mapBackendRepairDetails(result) : fallbackDetails;
    const nextParts = result ? nextDetails.parts : fallbackParts;

    setRequest(nextRequest);
    setDetails(nextDetails);
    setParts(nextParts);
    setInitialSnapshot(buildRepairSnapshot(nextRequest, nextDetails, nextParts));

    return { nextRequest, nextDetails, nextParts };
  }

  async function saveRepairPayload(payload, fallbackRequest, successTitle, successDescription) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveRepair(payload);

      applySavedRepair(result, fallbackRequest);
      notificationApi.success({
        title: successTitle,
        description: result?.msg || result?.message || successDescription,
      });
    } catch (error) {
      notificationApi.error({
        title: 'Не удалось сохранить заявку',
        description: error.message || 'Сервер вернул ошибку сохранения.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function moveToNextStatus() {
    const nextStatus = getNextRoadmapStatus(request);

    if (!nextStatus) {
      return;
    }

    const nextRequest = {
      ...request,
      status: nextStatus.status,
      status_id: nextStatus.number,
    };

    await saveRepairPayload(
      buildSaveRepairPayload(nextRequest, details, parts),
      nextRequest,
      'Статус изменён',
      `Заявка переведена в статус «${nextStatus.status}».`,
    );
  }

  async function moveToPreviousStatus() {
    const previousStatus = getPreviousRoadmapStatus(request);

    if (!previousStatus) {
      return;
    }

    const previousRequest = {
      ...request,
      status: previousStatus.status,
      status_id: previousStatus.number,
    };

    await saveRepairPayload(
      buildSaveRepairPayload(previousRequest, details, parts),
      previousRequest,
      'Статус изменён',
      `Заявка переведена в статус «${previousStatus.status}».`,
    );
  }

  async function saveRequest() {
    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveRepair(buildSaveRepairPayload(request, details, parts));

      applySavedRepair(result);
      notificationApi.success({
        title: 'Заявка сохранена',
        description: result?.msg || result?.message || 'Изменения успешно отправлены на сервер.',
      });
    } catch (error) {
      notificationApi.error({
        title: 'Не удалось сохранить заявку',
        description: error.message || 'Сервер вернул ошибку сохранения.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell detail-shell">
      {notificationContext}
      <div className="sticky-controls detail-sticky-controls">
        <GlobalHeader currentUser={currentUser} />
        <header className="topbar detail-header">
          <div className="detail-title">
            <Button className="icon-button back-button" icon={<ArrowLeft size={18} />} onClick={() => window.close()} />
            {isLoading ? (
              <div className="detail-title-skeleton">
                <span className="skeleton-line short" />
                <span className="skeleton-line title" />
              </div>
            ) : (
              <div className="detail-heading">
                <div className="detail-title-row">
                  <span className="detail-request-id">Заявка {request.id}</span>
                  <h1>{displayEquipment}</h1>
                  <span className="detail-client-name">{displayClient}</span>
                </div>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="detail-meta detail-meta-skeleton">
              <span className="skeleton-line pill" />
              <span className="skeleton-line client" />
            </div>
          ) : (
            <div className="detail-meta">
              <Button
                className="app-button"
                type="primary"
                icon={<Save size={16} />}
                disabled={!hasChanges || isSaving}
                loading={isSaving}
                onClick={saveRequest}
              >
                Сохранить
              </Button>
            </div>
          )}
        </header>
      </div>

      <div className="detail-content-scroll">
        {loadError && <div className="load-error">{loadError}</div>}
        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <div className="detail-layout">
            <div className="detail-grid">
              <FormBlock
                title="Оборудование"
                fields={details.equipment}
                onChange={(field, value) => updateDetail('equipment', field, value)}
              />
              <FormBlock
                title="Клиент"
                fields={details.client}
                onChange={(field, value) => updateDetail('client', field, value)}
              />
              <FormBlock
                title="Ремонтные работы"
                fields={details.repair}
                onChange={(field, value) => updateDetail('repair', field, value)}
                wide
              />

              <section className="detail-block wide-block">
                <div className="block-title-row">
                  <h2>Запчасти</h2>
                  <div className="parts-actions">
                    <Button className="app-button" icon={<Plus size={16} />} onClick={() => addPart('Покупная')}>
                      Добавить покупную запчасть
                    </Button>
                    <Button className="app-button" icon={<Plus size={16} />} onClick={() => addPart('Наша')}>
                      Добавить нашу запчасть
                    </Button>
                  </div>
                </div>
                {parts.length > 0 && (
                  <div className="parts-table-wrap">
                    <table className="parts-table">
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Модель</th>
                        <th>Количество</th>
                        <th>На складе</th>
                        <th>Цена</th>
                        <th>Комментарий</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((part, index) => (
                        <tr key={`${part.source}-${index}`}>
                          <td>
                            <Input value={part.source} readOnly />
                          </td>
                        <td>
                          {isOwnPart(part) ? (
                            <PartModelSearch
                              models={salesModels}
                              value={part.model}
                              onChange={(modelName, modelId) => {
                                updatePart(setParts, index, 'model', modelName);
                                updatePart(setParts, index, 'modelId', modelId);
                              }}
                            />
                          ) : (
                            <Input
                              value={part.model}
                              onChange={(event) => updatePart(setParts, index, 'model', event.target.value)}
                              placeholder="Модель запчасти"
                            />
                          )}
                        </td>
                          <td>
                            <InputNumber
                              min={1}
                              value={part.qty}
                              onChange={(value) => updatePart(setParts, index, 'qty', value)}
                            />
                          </td>
                          <td>
                            <Input
                              value={part.stock}
                              onChange={(event) => updatePart(setParts, index, 'stock', event.target.value)}
                            />
                          </td>
                          <td>
                            <InputNumber
                              min={0}
                              value={part.price}
                              onChange={(value) => updatePart(setParts, index, 'price', value)}
                            />
                          </td>
                          <td>
                            <Input
                              value={part.comment}
                              onChange={(event) => updatePart(setParts, index, 'comment', event.target.value)}
                              placeholder="Комментарий"
                            />
                          </td>
                          <td className="part-actions-cell">
                            <Button
                              className="icon-button delete-row-button"
                              danger
                              icon={<Trash2 size={16} />}
                              onClick={() => removePart(index)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <aside className="roadmap-column">
              <StatusRoadmap
                request={request}
                currentStatus={request.status}
                isSaving={isSaving}
                onNextStatus={moveToNextStatus}
                onPreviousStatus={moveToPreviousStatus}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function getRoadmapState(currentStatus, currentStatusId) {
  const currentNumber = Number(currentStatusId);
  const currentIndex = requestStatusRoadmap.findIndex(
    (step) => step.number === currentNumber || step.status.toLowerCase() === String(currentStatus || '').toLowerCase(),
  );
  const triggerStatus = currentIndex >= 0 ? requestStatusRoadmap[currentIndex].status : currentStatus;

  return { currentNumber, currentIndex, triggerStatus };
}

function getEffectiveStatusNumber(request) {
  const statusNumber = Number(request.status_id);

  if (statusNumber === 800 && Number(request.send_sklad) === 1) {
    return 850;
  }

  if (statusNumber === 850 && Number(request.get_sklad) === 1) {
    return 900;
  }

  return statusNumber;
}

function isWarrantyRepair(request) {
  const category = Number(request.category_repairs);

  return category === 2 || category === 3;
}

function getNextRoadmapStatus(request) {
  const backendNextStatus = getRoadmapStatusByNumber(request.nextstatus);

  if (backendNextStatus) {
    return backendNextStatus;
  }

  const currentNumber = getEffectiveStatusNumber(request);
  const currentIndex = requestStatusRoadmap.findIndex((step) => step.number === currentNumber);
  let nextStatus = requestStatusRoadmap[currentIndex + 1];

  if (!nextStatus) {
    return null;
  }

  if (isWarrantyRepair(request) && nextStatus.number === 400) {
    nextStatus = requestStatusRoadmap.find((step) => step.number === 450);
  }

  if (isWarrantyRepair(request) && nextStatus.number === 600) {
    nextStatus = requestStatusRoadmap.find((step) => step.number === 800);
  }

  if (nextStatus?.number === 800 && Number(request.send_sklad) === 1) {
    nextStatus = requestStatusRoadmap.find((step) => step.number === 850);
  }

  if (nextStatus?.number === 850 && Number(request.get_sklad) === 1) {
    nextStatus = requestStatusRoadmap.find((step) => step.number === 900);
  }

  return nextStatus || null;
}

function getRoadmapStatusByNumber(statusNumber) {
  const number = Number(statusNumber);

  if (!number) {
    return null;
  }

  return requestStatusRoadmap.find((step) => step.number === number) || null;
}

function getPreviousRoadmapStatus(request) {
  const currentNumber = getEffectiveStatusNumber(request);
  const currentIndex = requestStatusRoadmap.findIndex((step) => step.number === currentNumber);

  if (currentIndex <= 0) {
    return null;
  }

  return requestStatusRoadmap[currentIndex - 1] || null;
}

function StatusBadge({ currentStatus, currentStatusId }) {
  const { triggerStatus } = getRoadmapState(currentStatus, currentStatusId);

  return <span className="status-pill status-trigger">{triggerStatus || 'Статус не указан'}</span>;
}

function StatusRoadmap({ request, currentStatus, isSaving, onNextStatus, onPreviousStatus }) {
  const effectiveStatusNumber = getEffectiveStatusNumber(request);
  const { currentIndex } = getRoadmapState(currentStatus, effectiveStatusNumber);
  const previousStatus = getPreviousRoadmapStatus(request);
  const nextStatus = getNextRoadmapStatus(request);
  const timelineItems = requestStatusRoadmap.map((step, index) => ({
    content: (
      <span className="roadmap-timeline-content">
        <span className="roadmap-timeline-title">
          {step.status}
          {index === currentIndex && <span className="roadmap-current-label">текущий</span>}
        </span>
        <span className="roadmap-timeline-role">{step.role}</span>
      </span>
    ),
    className: index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'pending',
    color: index <= currentIndex ? 'blue' : 'gray',
  }));

  return (
    <section className="roadmap-card">
      <div className="roadmap-card-header">
        <span className="status-tooltip-title">Этапы заявки</span>
        <StatusBadge currentStatus={currentStatus} currentStatusId={effectiveStatusNumber} />
      </div>
      <Timeline className="roadmap-timeline" items={timelineItems} />
      <div className="roadmap-actions">
        <Button
          className="app-button"
          disabled={!previousStatus || isSaving}
          loading={isSaving}
          onClick={onPreviousStatus}
        >
          {previousStatus ? `Предыдущий: ${previousStatus.status}` : 'Начальный статус'}
        </Button>
        <Button
          className="app-button"
          disabled={!nextStatus || isSaving}
          loading={isSaving}
          onClick={onNextStatus}
          type="primary"
        >
          {nextStatus ? `Следующий: ${nextStatus.status}` : 'Финальный статус'}
        </Button>
      </div>
    </section>
  );
}

function PartModelSearch({ models, value, onChange }) {
  const query = String(value || '').toLowerCase().trim();
  const options = models
    .filter((model) => !query || model.label.toLowerCase().includes(query) || String(model.id).includes(query))
    .slice(0, 30)
    .map((model) => ({
      value: model.label,
      label: (
        <span className="model-option">
          <span>{model.label}</span>
          <small>{model.id}</small>
        </span>
      ),
      modelId: model.id,
    }));

  return (
    <AutoComplete
      className="model-search"
      value={value}
      options={options}
      popupMatchSelectWidth={360}
      onChange={(nextValue) => onChange(nextValue, '')}
      onSelect={(nextValue, option) => onChange(nextValue, option.modelId)}
      notFoundContent="Модель не найдена"
    >
      <Input placeholder="Найти модель" />
    </AutoComplete>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail-grid">
      <SkeletonFormBlock fields={9} />
      <SkeletonFormBlock fields={8} />
      <SkeletonFormBlock fields={14} wide />
      <section className="detail-block wide-block">
        <div className="block-title-row">
          <span className="skeleton-line block-heading" />
          <div className="parts-actions skeleton-actions">
            <span className="skeleton-line action" />
            <span className="skeleton-line action" />
          </div>
        </div>
        <div className="parts-table-wrap">
          <table className="parts-table">
            <thead>
              <tr>
                {Array.from({ length: 7 }).map((_, index) => (
                  <th key={`parts-head-skeleton-${index}`}>
                    <span className="skeleton-line header" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr className="skeleton-row" key={`parts-row-skeleton-${rowIndex}`}>
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <td key={`parts-cell-skeleton-${rowIndex}-${cellIndex}`}>
                      <span className="skeleton-line input" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SkeletonFormBlock({ fields, wide = false }) {
  return (
    <section className={`detail-block ${wide ? 'wide-block' : ''}`}>
      <span className="skeleton-line block-heading" />
      <div className="fields-grid">
        {Array.from({ length: fields }).map((_, index) => (
          <div className="field skeleton-field" key={`field-skeleton-${index}`}>
            <span className="skeleton-line label" />
            <span className="skeleton-line input" />
          </div>
        ))}
      </div>
    </section>
  );
}

function FormBlock({ title, fields, onChange, wide = false }) {
  return (
    <section className={`detail-block ${wide ? 'wide-block' : ''}`}>
      <h2>{title}</h2>
      <div className="fields-grid">
        {Object.entries(fields).map(([name, value]) => (
          <label className="field" key={name}>
            <span>{fieldLabels[name]}</span>
            {selectFieldOptions[name] ? (
              <Select
                value={value}
                variant="borderless"
                showSearch
                optionFilterProp="label"
                options={getSelectOptions(name, value).map((option) => ({ value: option, label: option || ' ' }))}
                onChange={(nextValue) => onChange(name, nextValue)}
              />
            ) : dateFieldNames.has(name) ? (
              <DatePicker
                value={value ? dayjs(value) : null}
                variant="borderless"
                format="DD.MM.YYYY"
                placeholder=""
                onChange={(date) => onChange(name, date ? date.format('YYYY-MM-DD') : '')}
              />
            ) : String(value).length > 56 ? (
              <Input.TextArea
                className="long-text-field"
                value={value}
                rows={4}
                onChange={(event) => onChange(name, event.target.value)}
              />
            ) : (
              <Input value={value} onChange={(event) => onChange(name, event.target.value)} />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

function getSelectOptions(name, value) {
  const options = selectFieldOptions[name] || [];
  const stringValue = String(value ?? '');

  if (!stringValue && options.length === 0) {
    return [''];
  }

  if (!stringValue || options.includes(stringValue)) {
    return options;
  }

  return [stringValue, ...options];
}

function buildRepairSnapshot(request, details, parts) {
  return JSON.stringify({
    status: request.status,
    status_id: request.status_id,
    details,
    parts,
  });
}

function getNumericPayloadValue(value, fallbackValue) {
  const trimmedValue = String(value ?? '').trim();
  const numericValue = Number(trimmedValue);

  return trimmedValue !== '' && Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function buildSaveRepairPayload(request, details, parts) {
  return {
    ...request,
    status_id: request.status_id,
    model_name: details.equipment.model,
    sn: details.equipment.serialNumber,
    defect_clients: details.equipment.declaredFault,
    complete_set: details.equipment.kit,
    condition: details.equipment.externalState,
    point_of_delivery: details.equipment.pickupPoint,
    sale_org_name: details.equipment.sellerName,
    sale_date: details.equipment.saleOrRepairDate,
    sale_invoice: details.equipment.invoiceNumber,
    client_org_name: details.client.companyName,
    client_sity: details.client.city,
    client_fio_contact: details.client.contactPerson,
    client_email: details.client.email,
    client_tel: details.client.phone,
    client_post: details.client.postalAddress,
    approved_work: getNumericPayloadValue(details.client.approvedWorks, request.approved_work),
    approved_work_name: details.client.approvedWorks,
    engin_defect_note: details.repair.faultDescription,
    probable_causes_note: details.repair.faultReasons,
    engin_list_repairs_note: details.repair.expectedRepair,
    act_text_job: details.repair.repair,
    engin_foul_comment: details.repair.usageViolation,
    engin_time_job_diagnostics: details.repair.diagnosisMinutes,
    engin_comment: details.repair.comment,
    diagnostics_price: details.repair.diagnosisTotal,
    engin_time_job: details.repair.repairMinutes,
    engin_price: details.repair.repairTotal,
    wait_spares_comment: details.repair.spareWaitingComment,
    act_text_diagnostic: details.repair.diagnosisAct,
    spares: parts.map((part) => ({
      ...part,
      count: part.qty,
      model_id: part.modelId,
      name: part.model,
    })),
  };
}

function updatePart(setParts, index, field, value) {
  setParts((current) => current.map((part, partIndex) => (partIndex === index ? { ...part, [field]: value } : part)));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

createRoot(document.getElementById('root')).render(<AppRoot />);
