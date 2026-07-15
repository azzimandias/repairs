import React, { useEffect, useState } from 'react';
import { AutoComplete, Button, Checkbox, ConfigProvider, DatePicker, Input, InputNumber, Segmented, Select } from 'antd';
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
  Search,
  Trash2,
} from 'lucide-react';
import { fetchRepair, fetchRepairManagers, fetchRepairs, fetchSalesModels } from './api';
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
  { id: 100, status: 'Заявка создана', role: 'Склад' },
  { id: 200, status: 'Заявка обработана', role: 'Склад' },
  { id: 300, status: 'Принято в сервис-центр', role: 'Сервис-центр' },
  { id: 400, status: 'Диагностика проведена', role: 'Сервис-центр' },
  { id: 450, status: 'Акт диагностики отправлен', role: 'Менеджер' },
  { id: 500, status: 'Объём работы согласован', role: 'Менеджер' },
  { id: 550, status: 'Запчасти получены', role: 'Сервис-центр' },
  { id: 600, status: 'Работа завершена', role: 'Сервис-центр' },
  { id: 700, status: 'Счёт выставлен', role: 'Администратор' },
  { id: 800, status: 'Счёт оплачен', role: 'Администратор' },
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

function App() {
  const path = window.location.pathname;
  const detailMatch = path.match(/^\/requests\/([^/]+)$/);

  if (detailMatch) {
    return <RequestPage requestId={decodeURIComponent(detailMatch[1])} />;
  }

  return <RequestsListPage />;
}

function AppRoot() {
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
      <App />
    </ConfigProvider>
  );
}

function GlobalHeader() {
  return (
    <div className="global-header">
      <div className="title-kicker">
        <a className="home-link" href={homeUrl} title="На главную">
          <Home size={17} />
        </a>
        <p className="eyebrow">Сервис-центр</p>
      </div>
      <div className="user-profile" title="Текущий пользователь">
        <div className="user-avatar">АК</div>
        <div className="user-name">
          <strong>Алексей Кузнецов</strong>
        </div>
      </div>
    </div>
  );
}

function RequestsListPage() {
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
    <main className="app-shell">
      <div className="sticky-controls">
        <GlobalHeader />
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

function RequestPage({ requestId }) {
  const [request, setRequest] = useState(emptyRequest);
  const [details, setDetails] = useState(emptyRequestDetails);
  const [parts, setParts] = useState([]);
  const [salesModels, setSalesModels] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
        setLoadError('');
      })
      .catch(() => {
        if (!ignore) {
          setRequest(emptyRequest);
          setDetails(emptyRequestDetails);
          setParts([]);
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

  return (
    <main className="app-shell detail-shell">
      <div className="sticky-controls detail-sticky-controls">
        <GlobalHeader />
        <header className="topbar detail-header">
          <div className="detail-title">
            <Button className="icon-button back-button" icon={<ArrowLeft size={18} />} onClick={() => window.close()} />
            {isLoading ? (
              <div className="detail-title-skeleton">
                <span className="skeleton-line short" />
                <span className="skeleton-line title" />
              </div>
            ) : (
              <div>
                <p className="eyebrow">Заявка {request.id}</p>
                <h1>{request.equipment}</h1>
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
              <StatusRoadmap currentStatus={request.status} currentStatusId={request.status_id} />
              <span>{request.client}</span>
            </div>
          )}
        </header>
      </div>

      <div className="detail-content-scroll">
        {loadError && <div className="load-error">{loadError}</div>}
        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <div className="detail-grid">
            <FormBlock title="Оборудование" fields={details.equipment} />
            <FormBlock title="Клиент" fields={details.client} />
            <FormBlock title="Ремонтные работы" fields={details.repair} wide />

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
            <div className="parts-table-wrap">
              <table className="parts-table">
                  <thead>
                    <tr>
                      <th>Тип</th>
                      <th>Модель</th>
                      <th>Количество</th>
                      <th>Количество на складе</th>
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
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusRoadmap({ currentStatus, currentStatusId }) {
  const currentId = Number(currentStatusId);
  const currentIndex = requestStatusRoadmap.findIndex(
    (step) => step.id === currentId || step.status === currentStatus,
  );
  const triggerStatus = currentIndex >= 0 ? requestStatusRoadmap[currentIndex].status : currentStatus;

  return (
    <span className="status-roadmap">
      <button className="status-pill status-trigger" type="button">
        {triggerStatus}
      </button>
      <span className="status-tooltip" role="tooltip">
        <span className="status-tooltip-title">Этапы заявки</span>
        <span className="status-steps">
          {requestStatusRoadmap.map((step, index) => {
            const isCurrent = step.id === currentId || step.status === currentStatus;
            const isDone = currentIndex >= 0 && index < currentIndex;

            return (
              <span className={`status-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`} key={step.status}>
                <span className="status-dot" />
                <span className="status-step-text">
                  <span>{step.status}</span>
                  <span className="status-role">{step.role}</span>
                </span>
              </span>
            );
          })}
        </span>
      </span>
    </span>
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

function FormBlock({ title, fields, wide = false }) {
  return (
    <section className={`detail-block ${wide ? 'wide-block' : ''}`}>
      <h2>{title}</h2>
      <div className="fields-grid">
        {Object.entries(fields).map(([name, value]) => (
          <label className="field" key={name}>
            <span>{fieldLabels[name]}</span>
            {selectFieldOptions[name] ? (
              <Select
                defaultValue={value}
                showSearch
                optionFilterProp="label"
                options={getSelectOptions(name, value).map((option) => ({ value: option, label: option || ' ' }))}
              />
            ) : dateFieldNames.has(name) ? (
              <DatePicker
                defaultValue={value ? dayjs(value) : null}
                format="DD.MM.YYYY"
                placeholder=""
              />
            ) : String(value).length > 56 ? (
              <Input.TextArea className="long-text-field" defaultValue={value} rows={4} />
            ) : (
              <Input defaultValue={value} />
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


