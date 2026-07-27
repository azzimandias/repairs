import React, { useEffect, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Checkbox, ConfigProvider, DatePicker, Dropdown, Input, InputNumber, Segmented, Select, Spin, notification } from 'antd';
import { useRef } from 'react';
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
  Printer,
  Save,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { createInvoiceRequest, downloadRepairDocument, fetchCurrentUser, fetchOrganizationRequisites, fetchRepair, fetchRepairManagers, fetchRepairOptions, fetchRepairOrganizations, fetchRepairs, fetchSalesModels, fetchSpareModel, saveRepair } from './api';
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
    clientComment: '',
    organizationId: '',
    payerId: '',
    conveyanceId: '',
    insurance: 0,
    sturdyPackaging: 0,
    adminComment: '',
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

function createEmptyRequestDetails() {
  return {
    equipment: { ...emptyRequestDetails.equipment },
    client: { ...emptyRequestDetails.client },
    repair: { ...emptyRequestDetails.repair },
    parts: [],
  };
}

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
  clientComment: 'Комментарий о клиенте',
  organizationId: 'Организация в базе',
  payerId: 'Плательщик',
  conveyanceId: 'Способ транспортировки',
  insurance: 'Страховка',
  sturdyPackaging: 'Жёсткая упаковка',
  adminComment: 'Комментарий для администраторов',
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

const remoteSelectFieldNames = {
  engineer: 'engineers',
  faultDescription: 'defects',
  faultReasons: 'defect_causes',
  expectedRepair: 'repair_types',
  requestManager: 'managers',
  organizationId: 'organizations',
  payerId: 'requisites',
  conveyanceId: 'conveyances',
};

const localSelectFieldOptions = {
  approvedWorks: [
    { value: 0, label: 'Неизвестно' },
    { value: 1, label: 'Только диагностика' },
    { value: 2, label: 'Диагностика и ремонт' },
  ],
  repair: [
    { value: 0, label: 'Неизвестно' },
    { value: 1, label: 'Платный' },
    { value: 2, label: 'От производителя (гарантия)' },
    { value: 3, label: 'От сервис-центра (гарантия)' },
  ],
  usageViolation: [
    { value: 0, label: 'Нет' },
    { value: 1, label: 'Да' },
  ],
  insurance: [
    { value: 0, label: 'Нет' },
    { value: 1, label: 'Да' },
  ],
  sturdyPackaging: [
    { value: 0, label: 'Нет' },
    { value: 1, label: 'Да' },
  ],
};

const emptyRepairOptions = {
  engineers: [],
  defects: [],
  defect_causes: [],
  repair_types: [],
  managers: [],
  organizations: [],
  requisites: [],
  conveyances: [],
};

const printDocumentItems = [
  { key: 'repair-request', label: 'Заявка на ремонт', aclIds: [78, 79], minimumStatus: 0 },
  { key: 'diagnostics-act', label: 'Акт диагностики', aclIds: [79, 80], minimumStatus: 400 },
  { key: 'completed-repair-act', label: 'Акт ремонта', aclIds: [79], minimumStatus: 400 },
  { key: 'invoice-request', label: 'Заявка на счет', aclIds: [79, 80], minimumStatus: 600 },
];

const requestStatusRoadmap = [
  { number: 100, status: 'В обработке', role: 'Склад', completionLabel: 'Заявка обработана' },
  { number: 200, status: 'Ожидает приёма в сервис', role: 'Сервис-центр', completionLabel: 'Заявка принята в сервис' },
  { number: 300, status: 'На диагностике', role: 'Сервис-центр', completionLabel: 'Диагностика проведена' },
  { number: 400, status: 'Подготовка акта диагностики', role: 'Менеджер', completionLabel: 'Акт диагностики подготовлен' },
  { number: 450, status: 'Согласование объёма работ', role: 'Менеджер', completionLabel: 'Объём работ согласован' },
  { number: 500, status: 'Ожидает запчастей', role: 'Сервис-центр', completionLabel: 'Запчасти получены' },
  { number: 550, status: 'В ремонте', role: 'Сервис-центр', completionLabel: 'Ремонт завершён' },
  { number: 600, status: 'Выставление счёта', role: 'Администратор', completionLabel: 'Счёт выставлен' },
  { number: 700, status: 'Ожидает оплаты', role: 'Администратор', completionLabel: 'Счёт оплачен' },
  { number: 800, status: 'Ожидает отправки на склад', role: 'Склад', completionLabel: 'Отправлено на склад' },
  { number: 850, status: 'В пути на склад выдачи', role: 'Склад', completionLabel: 'Доставлено на склад выдачи' },
  { number: 900, status: 'Готово к выдаче', role: 'Склад', completionLabel: 'Оборудование выдано' },
  { number: 1000, status: 'Заявка закрыта', role: 'Склад' },
];

const roadmapRoleAcl = {
  Склад: 78,
  'Сервис-центр': 79,
  Менеджер: 80,
};

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
      requestManager:
        repair.manager_id ??
        (Array.isArray(repair.manager) ? repair.manager[0]?.id : repair.manager?.id) ??
        summary.manager,
      approvedWorks: repair.approved_work ?? '',
      clientComment: repair.client_commet || '',
      organizationId: repair.client_org_id ?? '',
      payerId: repair.client_org_requisit_id ?? '',
      conveyanceId: repair.conveyance_id ?? '',
      insurance: repair.insurance ?? 0,
      sturdyPackaging: repair.sturdy_packaging ?? 0,
      adminComment: repair.comment_price || '',
    },
    repair: {
      engineer: repair.engin_id ?? repair.engineer_id ?? (Array.isArray(repair.engin) ? repair.engin[0]?.id : repair.engin?.id) ?? summary.engineer,
      faultDescription: repair.defect_id ?? repair.engin_defect_id ?? repair.engin_defect_note ?? '',
      faultReasons: repair.defect_cause_id ?? repair.probable_causes_id ?? repair.probable_causes_note ?? '',
      expectedRepair: repair.repair_type_id ?? repair.list_repairs_id ?? repair.engin_list_repairs_note ?? '',
      repair: repair.category_repairs ?? '',
      usageViolation: repair.engin_foul ?? '',
      diagnosisMinutes: repair.engin_time_job_diagnostics || repair.diagnostics_work_time || repair.diagnosis_minutes || '',
      comment: repair.engin_foul_comment || repair.violation_note || repair.operating_rules_violation_comment || '',
      diagnosisTotal: repair.diagnostics_price || repair.diagnosis_total || '',
      repairMinutes: repair.engin_time_job || repair.repair_work_time || repair.repair_minutes || '',
      repairTotal: repair.engin_price || repair.repair_price || repair.repair_total || '',
      spareWaitingComment: repair.wait_spares_comment || repair.engin_comment || '',
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
    deleted: Number(spare.deleted || 0),
    source: Number(spare.type) === 0 ? 'Наша' : 'Покупная',
    modelId: spare.model_id || '',
    model: spare.name || spare.model_name || String(spare.model_id || ''),
    qty: spare.count || 1,
    stock: spare.remaining_stock ?? spare.stock ?? spare.stock_count ?? spare.count_sklad ?? 0,
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
    stock: model.remaining_stock ?? null,
  };
}

function isOwnPart(part) {
  return part.source === 'Наша' || part.source === 'РќР°С€Р°' || Number(part.type) === 0;
}

function isVisiblePart(part) {
  return Number(part.deleted || 0) !== 1;
}

function hasUserAcl(user, aclId) {
  if (!Array.isArray(user?.acls)) {
    return false;
  }

  return user.acls.some((acl) => {
    const value = typeof acl === 'object' && acl !== null ? acl.id ?? acl.id_resources ?? acl.resource_id : acl;

    return Number(value) === aclId;
  });
}

function isAdministratorUser(user) {
  if (!user) {
    return false;
  }

  if ([user.is_admin, user.admin, user.is_super_admin, user.super_admin].some((value) => value === true || Number(value) === 1)) {
    return true;
  }

  const roleValues = [user.role, user.role_name, user.position, user.position_name, user.group, user.group_name, user.type]
    .concat(Array.isArray(user.roles) ? user.roles : [])
    .map((value) => (typeof value === 'object' && value !== null ? value.name ?? value.title ?? value.label : value))
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return (
    roleValues.some((value) => value.includes('администратор') || value.includes('administrator') || value === 'admin') ||
    Object.values(roadmapRoleAcl).every((aclId) => hasUserAcl(user, aclId))
  );
}

function canUserManageRoadmapRole(user, role) {
  if (!role) {
    return false;
  }

  if (role === 'Администратор') {
    return isAdministratorUser(user);
  }

  return hasUserAcl(user, roadmapRoleAcl[role]);
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
          colorPrimary: '#1f4f82',
          colorInfo: '#1f4f82',
          colorBgContainer: '#ffffff',
          colorBorder: '#b8c4d1',
          colorText: '#182433',
          colorTextSecondary: '#536274',
          borderRadius: 4,
          controlHeight: 32,
          fontSize: 13,
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

  function createRequest() {
    openRequest('new');
  }

  function exportExcel() {
    const columns = [
      'ID',
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
      request.id,
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
            <Button className="app-button" type="primary" icon={<FilePlus2 size={16} />} onClick={createRequest}>
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
              <th>ID</th>
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
                    {Array.from({ length: 11 }).map((__, cellIndex) => (
                      <td key={`request-skeleton-${index}-${cellIndex}`}>
                        <span className="skeleton-line" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleRequests.map((request) => (
                  <tr key={request.id} onDoubleClick={() => openRequest(request.id)} title="Двойной клик откроет заявку">
                    <td className="mono">{request.id}</td>
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
  const isNewRequest = requestId === 'new';
  const canEditEquipment = hasUserAcl(currentUser, 78);
  const canEditRepair = hasUserAcl(currentUser, 79);
  const canEditClient = hasUserAcl(currentUser, 80);
  const [request, setRequest] = useState(emptyRequest);
  const [details, setDetails] = useState(emptyRequestDetails);
  const [parts, setParts] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [salesModels, setSalesModels] = useState([]);
  const [repairOptions, setRepairOptions] = useState(emptyRepairOptions);
  const [loadingSpareRows, setLoadingSpareRows] = useState({});
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState('');
  const [isCreatingInvoiceRequest, setIsCreatingInvoiceRequest] = useState(false);
  const organizationSearchTimerRef = useRef(null);
  const organizationSearchRequestRef = useRef(0);
  const [notificationApi, notificationContext] = notification.useNotification();
  const currentSnapshot = buildRepairSnapshot(request, details, parts);
  const hasChanges = Boolean(initialSnapshot) && currentSnapshot !== initialSnapshot;
  const displayEquipment = details.equipment.model || request.equipment;
  const displayClient = details.client.companyName || request.client;
  const effectiveStatusNumber = getEffectiveStatusNumber(request);
  const currentRoadmapStatus = getRoadmapStatusByNumber(effectiveStatusNumber);
  const canChangeStatus = canUserManageRoadmapRole(currentUser, currentRoadmapStatus?.role);
  const availablePrintDocumentItems = printDocumentItems.filter(
    (item) =>
      effectiveStatusNumber >= item.minimumStatus &&
      (isAdministratorUser(currentUser) || item.aclIds.some((aclId) => hasUserAcl(currentUser, aclId))),
  );
  const canCreateInvoiceRequest =
    Boolean(request.id) &&
    effectiveStatusNumber >= 600 &&
    (isAdministratorUser(currentUser) || hasUserAcl(currentUser, 79));

  useEffect(() => {
    document.title = isNewRequest ? 'Сервис-центр | Новая заявка' : `Сервис-центр | ${requestId}`;
  }, [isNewRequest, requestId]);

  useEffect(() => {
    let ignore = false;

    if (isNewRequest) {
      const nextRequest = { ...emptyRequest };
      const nextDetails = createEmptyRequestDetails();

      setRequest(nextRequest);
      setDetails(nextDetails);
      setParts([]);
      setLoadingSpareRows({});
      setInitialSnapshot(buildRepairSnapshot(nextRequest, nextDetails, []));
      setLoadError('');
      setIsLoading(false);

      return () => {
        ignore = true;
      };
    }

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
        setLoadingSpareRows({});
        setInitialSnapshot(buildRepairSnapshot(mappedRequest, mappedDetails, mappedDetails.parts));
        setLoadError('');
      })
      .catch(() => {
        if (!ignore) {
          setRequest(emptyRequest);
          setDetails(emptyRequestDetails);
          setParts([]);
          setLoadingSpareRows({});
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
  }, [isNewRequest, requestId]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([fetchSalesModels(), fetchRepairOptions(), fetchRepairManagers()])
      .then(([modelsResult, optionsResult, managersResult]) => {
        if (!ignore) {
          setSalesModels(modelsResult.status === 'fulfilled' ? modelsResult.value.map(mapSalesModelOption) : []);
          setRepairOptions((current) => ({
            ...(optionsResult.status === 'fulfilled' ? optionsResult.value : emptyRepairOptions),
            managers: managersResult.status === 'fulfilled' ? managersResult.value : [],
            organizations: current.organizations || [],
            requisites: current.requisites || [],
          }));
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const organizationId = details.client.organizationId;

    if (isEmptyRemoteSelectValue(organizationId)) {
      setRepairOptions((current) => ({ ...current, requisites: [] }));
      return () => {
        ignore = true;
      };
    }

    setRepairOptions((current) => ({ ...current, requisites: [] }));

    fetchOrganizationRequisites(organizationId)
      .then((requisites) => {
        if (!ignore) {
          setRepairOptions((current) => ({ ...current, requisites }));
        }
      })
      .catch(() => {
        if (!ignore) {
          setRepairOptions((current) => ({ ...current, requisites: [] }));
        }
      });

    fetchRepairOrganizations(String(organizationId))
      .then((organizations) => {
        if (!ignore) {
          setRepairOptions((current) => ({
            ...current,
            organizations: mergeOptionsById(current.organizations, organizations),
          }));
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [details.client.organizationId]);

  useEffect(
    () => () => {
      window.clearTimeout(organizationSearchTimerRef.current);
    },
    [],
  );

  function searchOrganizations(value) {
    const query = String(value || '').trim();
    const requestNumber = organizationSearchRequestRef.current + 1;

    organizationSearchRequestRef.current = requestNumber;
    window.clearTimeout(organizationSearchTimerRef.current);

    if (!query) {
      setRepairOptions((current) => ({ ...current, organizations: [] }));
      return;
    }

    organizationSearchTimerRef.current = window.setTimeout(async () => {
      try {
        const organizations = await fetchRepairOrganizations(query);

        if (organizationSearchRequestRef.current === requestNumber) {
          setRepairOptions((current) => ({ ...current, organizations }));
        }
      } catch (error) {
        if (organizationSearchRequestRef.current === requestNumber) {
          setRepairOptions((current) => ({ ...current, organizations: [] }));
          notificationApi.error({
            title: 'Не удалось найти организацию',
            description: error.message || 'Сервер вернул ошибку поиска.',
          });
        }
      }
    }, 300);
  }

  function addPart(source) {
    const isOwn = source === 'Наша';

    setParts((current) => [
      ...current,
      { source, type: isOwn ? 0 : 1, deleted: 0, modelId: '', model: '', qty: 1, stock: isOwn ? 0 : '-', price: 0, comment: '' },
    ]);
  }

  function removePart(index) {
    const shouldSoftDelete = Boolean(parts[index]?.id);

    setParts((current) =>
      shouldSoftDelete
        ? current.map((part, partIndex) => (partIndex === index ? { ...part, deleted: 1 } : part))
        : current.filter((_, partIndex) => partIndex !== index),
    );
    setLoadingSpareRows((current) => {
      const nextRows = {};

      Object.entries(current).forEach(([rowIndex, isLoadingRow]) => {
        const numericIndex = Number(rowIndex);

        if (shouldSoftDelete) {
          if (numericIndex !== index) {
            nextRows[numericIndex] = isLoadingRow;
          }

          return;
        }

        if (numericIndex < index) {
          nextRows[numericIndex] = isLoadingRow;
        }

        if (numericIndex > index) {
          nextRows[numericIndex - 1] = isLoadingRow;
        }
      });

      return nextRows;
    });
  }

  async function selectOwnPartModel(index, modelName, modelId) {
    updatePartRow(setParts, index, {
      model: modelName,
      modelId,
    });

    if (!modelId) {
      setLoadingSpareRows((current) => ({ ...current, [index]: false }));
      return;
    }

    setLoadingSpareRows((current) => ({ ...current, [index]: true }));

    try {
      const spareModel = await fetchSpareModel(modelId);

      updatePartRow(setParts, index, {
        model: spareModel?.name_seo || spareModel?.name || modelName,
        modelId: spareModel?.id || modelId,
        price: spareModel?.price ?? spareModel?.price_0 ?? 0,
        stock: spareModel?.remaining_stock ?? spareModel?.stock ?? 0,
      });
      clampPartQtyToStock(setParts, index);
    } catch (error) {
      notificationApi.error({
        title: 'Не удалось загрузить запчасть',
        description: error.message || 'Сервер не вернул цену и остаток по модели.',
      });
    } finally {
      setLoadingSpareRows((current) => ({ ...current, [index]: false }));
    }
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

  function updateClientDetail(field, value) {
    setDetails((current) => ({
      ...current,
      client: {
        ...current.client,
        [field]: value,
        ...(field === 'organizationId' ? { payerId: '' } : {}),
      },
    }));
  }

  function updateEquipmentModel(modelName, modelId) {
    updateDetail('equipment', 'model', modelName);
    setRequest((current) => ({ ...current, model_id: modelId || '' }));
  }

  function applySavedRepair(result, fallbackRequest = request, fallbackDetails = details, fallbackParts = parts) {
    const savedRepair = getSavedRepair(result);
    const mergedRepair = savedRepair
      ? { ...buildSaveRepairPayload(fallbackRequest, fallbackDetails, fallbackParts, repairOptions), ...savedRepair }
      : null;
    const nextRequest = mergedRepair ? mapBackendRepair(mergedRepair) : fallbackRequest;
    const nextDetails = mergedRepair ? mapBackendRepairDetails(mergedRepair) : fallbackDetails;
    const nextParts = savedRepair?.spares ? nextDetails.parts : fallbackParts;

    setRequest(nextRequest);
    setDetails(nextDetails);
    setParts(nextParts);
    setInitialSnapshot(buildRepairSnapshot(nextRequest, nextDetails, nextParts));

    return { nextRequest, nextDetails, nextParts };
  }

  async function handleDocumentDownload({ key }) {
    if (!request.id || downloadingDocument) {
      return;
    }

    setDownloadingDocument(key);

    try {
      await downloadRepairDocument(request.id, key);
    } catch (error) {
      notificationApi.error({
        title: 'Не удалось скачать документ',
        description: error.message || 'Сервер вернул ошибку формирования документа.',
      });
    } finally {
      setDownloadingDocument('');
    }
  }

  async function handleCreateInvoiceRequest() {
    if (!canCreateInvoiceRequest || isCreatingInvoiceRequest) {
      return;
    }

    setIsCreatingInvoiceRequest(true);

    try {
      const result = await createInvoiceRequest(request.id);

      notificationApi.success({
        title: result?.alreadyExists ? 'Заявка уже отправлена' : 'Заявка отправлена',
        description: result?.message || 'Заявка на счёт успешно создана.',
      });
    } catch (error) {
      notificationApi.error({
        title: 'Не удалось отправить заявку',
        description: error.message || 'Сервер вернул ошибку создания заявки на счёт.',
      });
    } finally {
      setIsCreatingInvoiceRequest(false);
    }
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
    if (!canChangeStatus) {
      return;
    }

    const nextStatus = getNextRoadmapStatus(request);

    if (!nextStatus) {
      return;
    }

    if (nextStatus.number === 500) {
      const hasOrganization = Number(details.client.organizationId) > 0;

      if (!hasOrganization && (!String(details.client.companyName).trim() || !String(details.client.city).trim())) {
        notificationApi.error({
          title: 'Не указана организация',
          description: 'Выберите организацию из базы или заполните её наименование и город.',
        });
        return;
      }

      if (Number(details.repair.repair) === 1 && hasOrganization && Number(details.client.payerId) <= 0) {
        notificationApi.error({
          title: 'Не выбран плательщик',
          description: 'Для платного ремонта выберите плательщика в блоке «Клиент».',
        });
        return;
      }

      if (Number(details.client.conveyanceId) <= 0) {
        notificationApi.error({
          title: 'Не выбран способ транспортировки',
          description: 'Выберите способ транспортировки в блоке «Клиент» перед изменением статуса.',
        });
        return;
      }

      if (![1, 2].includes(Number(details.client.approvedWorks))) {
        notificationApi.error({
          title: 'Не согласован объём работ',
          description: 'Выберите утверждённый объём работ в блоке «Клиент».',
        });
        return;
      }
    }

    const nextRequest = {
      ...request,
      status: nextStatus.status,
      status_id: nextStatus.number,
    };

    await saveRepairPayload(
      buildSaveRepairPayload(nextRequest, details, parts, repairOptions),
      nextRequest,
      'Статус изменён',
      `Заявка переведена в статус «${nextStatus.status}».`,
    );
  }

  async function moveToPreviousStatus() {
    if (!canChangeStatus) {
      return;
    }

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
      buildSaveRepairPayload(previousRequest, details, parts, repairOptions),
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
      const result = await saveRepair(buildSaveRepairPayload(request, details, parts, repairOptions));
      const { nextRequest } = applySavedRepair(result);

      if (!request.id && nextRequest.id) {
        const requestUrl = `/requests/${encodeURIComponent(nextRequest.id)}`;

        window.history.replaceState(null, '', requestUrl);
        document.title = `Сервис-центр | ${nextRequest.id}`;
      }
      notificationApi.success({
        title: request.id ? 'Заявка сохранена' : 'Заявка создана',
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

  useEffect(() => {
    function handleSaveShortcut(event) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }

      event.preventDefault();
      saveRequest();
    }

    window.addEventListener('keydown', handleSaveShortcut);

    return () => {
      window.removeEventListener('keydown', handleSaveShortcut);
    };
  }, [hasChanges, isSaving, request, details, parts]);

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
                  <span className="detail-request-id">
                    <span className="detail-request-id-row">
                      <span>ID</span>
                      <span>{request.id || 'Новая'}</span>
                    </span>
                    <span className="detail-request-id-row">
                      <span>UID</span>
                      <span>{request.uid || '-'}</span>
                    </span>
                  </span>
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
              {canCreateInvoiceRequest && (
                <Button
                  className="app-button"
                  icon={<Send size={16} />}
                  loading={isCreatingInvoiceRequest}
                  disabled={isCreatingInvoiceRequest}
                  onClick={handleCreateInvoiceRequest}
                >
                  Отправить на счёт
                </Button>
              )}
              <Dropdown
                menu={{
                  items: availablePrintDocumentItems.map(({ key, label }) => ({ key, label })),
                  onClick: handleDocumentDownload,
                }}
                placement="bottomRight"
                trigger={['click']}
                disabled={!request.id || availablePrintDocumentItems.length === 0 || Boolean(downloadingDocument)}
              >
                <Button
                  className="app-button"
                  icon={<Printer size={16} />}
                  loading={Boolean(downloadingDocument)}
                  disabled={!request.id || availablePrintDocumentItems.length === 0 || Boolean(downloadingDocument)}
                >
                  Распечатать
                  <DownOutlined />
                </Button>
              </Dropdown>
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
                modelOptions={salesModels}
                onModelChange={updateEquipmentModel}
                disabled={!canEditEquipment}
              />
              <FormBlock
                title="Клиент"
                fields={details.client}
                onChange={updateClientDetail}
                selectOptions={repairOptions}
                onSelectSearch={{ organizationId: searchOrganizations }}
                disabled={!canEditClient}
              />
              <FormBlock
                title="Ремонтные работы"
                fields={details.repair}
                onChange={(field, value) => updateDetail('repair', field, value)}
                selectOptions={repairOptions}
                disabled={!canEditRepair}
                wide
              />

              <section className="detail-block wide-block">
                <div className="block-title-row">
                  <h2>Запчасти</h2>
                  <div className="parts-actions">
                    <Button className="app-button" disabled={!canEditRepair} icon={<Plus size={16} />} onClick={() => addPart('Покупная')}>
                      Добавить покупную запчасть
                    </Button>
                    <Button className="app-button" disabled={!canEditRepair} icon={<Plus size={16} />} onClick={() => addPart('Наша')}>
                      Добавить нашу запчасть
                    </Button>
                  </div>
                </div>
                {parts.some(isVisiblePart) && (
                  <div className="parts-table-wrap">
                    <table className="parts-table">
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Модель</th>
                        <th>Количество</th>
                        <th>На складе</th>
                        <th>Цена $</th>
                        <th>Комментарий</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((part, index) => {
                        if (!isVisiblePart(part)) {
                          return null;
                        }

                        const isLoadingSpare = Boolean(loadingSpareRows[index]);
                        const isOwnSpare = isOwnPart(part);
                        const stockLimit = isOwnSpare ? getPartStockLimit(part) : null;

                        return (
                        <tr className={isLoadingSpare ? 'part-row-loading' : ''} key={`${part.source}-${index}`}>
                          <td>
                            <Input value={part.source} readOnly />
                          </td>
                        <td>
                          {isOwnSpare ? (
                            <PartModelSearch
                              models={salesModels}
                              value={part.model}
                              disabled={!canEditRepair}
                              onChange={(modelName, modelId) => selectOwnPartModel(index, modelName, modelId)}
                            />
                          ) : (
                            <Input
                              value={part.model}
                              disabled={!canEditRepair}
                              onChange={(event) => updatePart(setParts, index, 'model', event.target.value)}
                              placeholder="Модель запчасти"
                            />
                          )}
                        </td>
                          <td>
                            <InputNumber
                              min={stockLimit === 0 ? 0 : 1}
                              max={stockLimit ?? undefined}
                              value={part.qty}
                              disabled={!canEditRepair}
                              onChange={(value) => updatePart(setParts, index, 'qty', clampPartQty(value, stockLimit))}
                            />
                          </td>
                          <td>
                            <div className="part-loading-cell">
                              <Input
                                value={part.stock}
                                className={isOwnSpare ? 'readonly-part-value' : ''}
                                disabled={!canEditRepair || isLoadingSpare}
                                readOnly={isOwnSpare}
                                onChange={(event) => updatePart(setParts, index, 'stock', event.target.value)}
                              />
                              {isLoadingSpare && (
                                <span className="part-loading-hint">
                                  <Spin size="small" />
                                  загрузка
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="part-loading-cell">
                              <InputNumber
                                min={0}
                                value={part.price}
                                className={isOwnSpare ? 'readonly-part-value' : ''}
                                disabled={!canEditRepair || isLoadingSpare}
                                readOnly={isOwnSpare}
                                onChange={(value) => updatePart(setParts, index, 'price', value)}
                              />
                              {isLoadingSpare && (
                                <span className="part-loading-hint">
                                  <Spin size="small" />
                                  загрузка
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <Input
                              value={part.comment}
                              disabled={!canEditRepair}
                              onChange={(event) => updatePart(setParts, index, 'comment', event.target.value)}
                              placeholder="Комментарий"
                            />
                          </td>
                          <td className="part-actions-cell">
                            <Button
                              className="icon-button delete-row-button"
                              danger
                              disabled={!canEditRepair}
                              icon={<Trash2 size={16} />}
                              onClick={() => removePart(index)}
                            />
                          </td>
                        </tr>
                        );
                      })}
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
                canChangeStatus={canChangeStatus}
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

function StatusRoadmap({ request, currentStatus, canChangeStatus, isSaving, onNextStatus, onPreviousStatus }) {
  const effectiveStatusNumber = getEffectiveStatusNumber(request);
  const { currentIndex } = getRoadmapState(currentStatus, effectiveStatusNumber);
  const currentStep = requestStatusRoadmap[currentIndex];
  const previousStatus = getPreviousRoadmapStatus(request);
  const nextStatus = getNextRoadmapStatus(request);

  return (
    <section className="roadmap-card">
      <div className="roadmap-card-header">
        <span className="status-tooltip-title">Этапы заявки</span>
        <StatusBadge currentStatus={currentStatus} currentStatusId={effectiveStatusNumber} />
      </div>
      <ol className="custom-roadmap" aria-label="Этапы заявки">
        {requestStatusRoadmap.map((step, index) => {
          const isGroupStart = index === 0 || requestStatusRoadmap[index - 1].role !== step.role;
          const isGroupEnd =
            index === requestStatusRoadmap.length - 1 || requestStatusRoadmap[index + 1].role !== step.role;
          const statusClass = index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'pending';
          const className = [
            'custom-roadmap-item',
            statusClass,
            getRoadmapRoleClass(step.role),
            isGroupStart ? 'role-group-start' : '',
            isGroupEnd ? 'role-group-end' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li className={className} key={step.number} aria-current={index === currentIndex ? 'step' : undefined}>
              <span className="custom-roadmap-node" aria-hidden="true">
                <span className="custom-roadmap-dot" />
              </span>
              <div className="custom-roadmap-card">
                {isGroupStart && <span className="roadmap-role-heading">{step.role}</span>}
                <div className="roadmap-timeline-content">
                  <span className="roadmap-timeline-title">
                    {step.status}
                    {index === currentIndex && <span className="roadmap-current-label">текущий</span>}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="roadmap-actions">
        <Button
          className="app-button"
          disabled={!previousStatus || !canChangeStatus || isSaving}
          loading={isSaving}
          onClick={onPreviousStatus}
          title={!canChangeStatus ? 'Изменять статус может только текущий ответственный' : undefined}
        >
          {previousStatus ? `Предыдущий: ${previousStatus.status}` : 'Начальный статус'}
        </Button>
        <Button
          className="app-button"
          disabled={!nextStatus || !canChangeStatus || isSaving}
          loading={isSaving}
          onClick={onNextStatus}
          title={!canChangeStatus ? 'Изменять статус может только текущий ответственный' : undefined}
          type="primary"
        >
          {nextStatus ? currentStep?.completionLabel || nextStatus.status : 'Финальный статус'}
        </Button>
      </div>
    </section>
  );
}

function getRoadmapRoleClass(role) {
  if (role === 'Склад') {
    return 'role-warehouse';
  }

  if (role === 'Сервис-центр') {
    return 'role-service';
  }

  if (role === 'Менеджер') {
    return 'role-manager';
  }

  return 'role-administrator';
}

function PartModelSearch({ models, value, disabled = false, onChange }) {
  const query = String(value || '').toLowerCase().trim();
  const options = models
    .filter((model) => !query || model.label.toLowerCase().includes(query) || String(model.id).includes(query))
    .slice(0, 30)
    .map((model) => ({
      value: model.label,
      disabled: Number(model.stock) === 0,
      label: (
        <span className={`model-option ${Number(model.stock) === 0 ? 'model-option-disabled' : ''}`}>
          <span>{model.label}</span>
          <small>на складе: {formatStockValue(model.stock)}</small>
        </span>
      ),
      modelId: model.id,
    }));

  return (
    <AutoComplete
      className="model-search"
      value={value}
      disabled={disabled}
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

function formatStockValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
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

function FormBlock({
  title,
  fields,
  onChange,
  modelOptions = [],
  onModelChange,
  selectOptions = emptyRepairOptions,
  onSelectSearch = {},
  disabled = false,
  wide = false,
}) {
  return (
    <section className={`detail-block ${wide ? 'wide-block' : ''}`}>
      <h2>{title}</h2>
      <div className="fields-grid">
        {Object.entries(fields).map(([name, value]) => (
          <label className="field" key={name}>
            <span>{fieldLabels[name]}</span>
            {name === 'model' && onModelChange ? (
              <AutoComplete
                value={value}
                disabled={disabled}
                variant="borderless"
                suffixIcon={<DownOutlined />}
                options={modelOptions.map((model) => ({ value: model.label, label: model.label, modelId: model.id }))}
                onChange={(nextValue) => onModelChange(nextValue, '')}
                onSelect={(nextValue, option) => onModelChange(nextValue, option.modelId)}
                showSearch
              />
            ) : remoteSelectFieldNames[name] ? (
              <Select
                value={getRemoteSelectValue(name, value, selectOptions)}
                disabled={disabled}
                variant="borderless"
                showSearch
                optionFilterProp="label"
                filterOption={onSelectSearch[name] ? false : undefined}
                options={getRemoteSelectOptions(name, value, selectOptions)}
                onSearch={onSelectSearch[name]}
                onChange={(nextValue) => onChange(name, nextValue)}
              />
            ) : localSelectFieldOptions[name] ? (
              <Select
                value={value === '' ? undefined : Number(value)}
                disabled={disabled}
                variant="borderless"
                options={localSelectFieldOptions[name]}
                placeholder="Выберите значение"
                onChange={(nextValue) => onChange(name, nextValue)}
              />
            ) : dateFieldNames.has(name) ? (
              <DatePicker
                value={value ? dayjs(value) : null}
                disabled={disabled}
                variant="borderless"
                format="DD.MM.YYYY"
                placeholder=""
                onChange={(date) => onChange(name, date ? date.format('YYYY-MM-DD') : '')}
              />
            ) : String(value).length > 56 ? (
              <Input.TextArea
                className="long-text-field"
                value={value}
                disabled={disabled}
                rows={4}
                onChange={(event) => onChange(name, event.target.value)}
              />
            ) : (
              <Input value={value} disabled={disabled} onChange={(event) => onChange(name, event.target.value)} />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

function getRemoteSelectOptions(name, value, selectOptions) {
  const collectionName = remoteSelectFieldNames[name];
  const options = (selectOptions[collectionName] || [])
    .filter((option) => !isEmptyRemoteSelectValue(option.id))
    .map((option) => ({
      ...option,
      value: option.id,
      label: option.label || option.name || option.nameorg || option.note || formatPerson(option) || String(option.id),
    }));
  const hasCurrentValue = options.some((option) => String(option.value) === String(value));

  if (!isEmptyRemoteSelectValue(value) && !hasCurrentValue && name !== 'organizationId') {
    return [{ value, label: String(value) }, ...options];
  }

  return options;
}

function getRemoteSelectValue(name, value, selectOptions) {
  if (isEmptyRemoteSelectValue(value)) {
    return undefined;
  }

  if (name === 'organizationId') {
    const organizations = selectOptions[remoteSelectFieldNames[name]] || [];
    const hasOrganization = organizations.some(
      (organization) =>
        !isEmptyRemoteSelectValue(organization.id) && String(organization.id) === String(value),
    );

    return hasOrganization ? value : undefined;
  }

  return value;
}

function isEmptyRemoteSelectValue(value) {
  return value === '' || value === null || value === undefined || String(value).trim() === '0';
}

function mergeOptionsById(currentOptions = [], nextOptions = []) {
  const optionsById = new Map();

  [...currentOptions, ...nextOptions].forEach((option) => {
    if (!isEmptyRemoteSelectValue(option.id)) {
      optionsById.set(String(option.id), option);
    }
  });

  return Array.from(optionsById.values());
}

function buildRepairSnapshot(request, details, parts) {
  return JSON.stringify({
    status: request.status,
    status_id: request.status_id,
    details,
    parts,
  });
}

function getSavedRepair(result) {
  if (result?.data && !Array.isArray(result.data) && typeof result.data === 'object') {
    return result.data;
  }

  if (result?.data !== undefined && result?.data !== null && typeof result.data !== 'object') {
    return { ...result, id: result.id || result.data };
  }

  return result && typeof result === 'object' ? result : null;
}

function getNumericPayloadValue(value, fallbackValue) {
  const trimmedValue = String(value ?? '').trim();
  const numericValue = Number(trimmedValue);

  return trimmedValue !== '' && Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function findRepairOption(options, value) {
  return (options || []).find((option) => String(option.id) === String(value));
}

function getLocalOptionLabel(name, value) {
  return localSelectFieldOptions[name]?.find((option) => String(option.value) === String(value))?.label || '';
}

function buildSaveRepairPayload(request, details, parts, repairOptions = emptyRepairOptions) {
  const engineer = findRepairOption(repairOptions.engineers, details.repair.engineer);
  const defect = findRepairOption(repairOptions.defects, details.repair.faultDescription);
  const defectCause = findRepairOption(repairOptions.defect_causes, details.repair.faultReasons);
  const repairType = findRepairOption(repairOptions.repair_types, details.repair.expectedRepair);
  const payload = {
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
    manager_id: getNumericPayloadValue(details.client.requestManager, request.manager_id),
    approved_work: getNumericPayloadValue(details.client.approvedWorks, request.approved_work),
    approved_work_name: getLocalOptionLabel('approvedWorks', details.client.approvedWorks),
    client_commet: details.client.clientComment,
    client_org_id: getNumericPayloadValue(details.client.organizationId, request.client_org_id),
    client_org_requisit_id: getNumericPayloadValue(details.client.payerId, request.client_org_requisit_id),
    conveyance_id: getNumericPayloadValue(details.client.conveyanceId, request.conveyance_id),
    insurance: getNumericPayloadValue(details.client.insurance, request.insurance ?? 0),
    sturdy_packaging: getNumericPayloadValue(details.client.sturdyPackaging, request.sturdy_packaging ?? 0),
    comment_price: details.client.adminComment,
    engin_id: engineer?.id ?? getNumericPayloadValue(details.repair.engineer, request.engin_id),
    defect_id: defect?.id ?? getNumericPayloadValue(details.repair.faultDescription, request.defect_id),
    defect_cause_id: defectCause?.id ?? getNumericPayloadValue(details.repair.faultReasons, request.defect_cause_id),
    repair_type_id: repairType?.id ?? getNumericPayloadValue(details.repair.expectedRepair, request.repair_type_id),
    engin_defect_note: defect?.note || defect?.label || details.repair.faultDescription,
    probable_causes_note: defectCause?.note || defectCause?.label || details.repair.faultReasons,
    engin_list_repairs_note: repairType?.note || repairType?.label || details.repair.expectedRepair,
    category_repairs: getNumericPayloadValue(details.repair.repair, request.category_repairs),
    engin_foul: getNumericPayloadValue(details.repair.usageViolation, request.engin_foul),
    engin_foul_comment: details.repair.comment,
    engin_time_job_diagnostics: details.repair.diagnosisMinutes,
    diagnostics_price: details.repair.diagnosisTotal,
    engin_time_job: details.repair.repairMinutes,
    engin_price: details.repair.repairTotal,
    engin_comment: details.repair.spareWaitingComment,
    wait_spares_comment: details.repair.spareWaitingComment,
    act_text_diagnostic: details.repair.diagnosisAct,
    act_text_job: details.repair.workAct,
    spares: parts
      .filter((part) => {
        if (part.id) {
          return true;
        }

        return isOwnPart(part) ? String(part.modelId || '').trim() !== '' : String(part.model || '').trim() !== '';
      })
      .map((part) => ({
        ...part,
        deleted: Number(part.deleted || 0),
        count: part.qty,
        model_id: part.modelId,
        name: part.model,
      })),
  };

  if (!request.id) {
    delete payload.id;
  }

  return payload;
}

function updatePart(setParts, index, field, value) {
  setParts((current) => current.map((part, partIndex) => (partIndex === index ? { ...part, [field]: value } : part)));
}

function updatePartRow(setParts, index, values) {
  setParts((current) => current.map((part, partIndex) => (partIndex === index ? { ...part, ...values } : part)));
}

function getPartStockLimit(part) {
  const stock = Number(part.stock);

  return Number.isFinite(stock) && stock >= 0 ? stock : null;
}

function clampPartQty(value, stockLimit) {
  const minQty = stockLimit === 0 ? 0 : 1;
  const qty = Math.max(minQty, Number(value) || minQty);

  return stockLimit === null ? qty : Math.min(qty, stockLimit);
}

function clampPartQtyToStock(setParts, index) {
  setParts((current) =>
    current.map((part, partIndex) => {
      if (partIndex !== index) {
        return part;
      }

      return {
        ...part,
        qty: clampPartQty(part.qty, getPartStockLimit(part)),
      };
    }),
  );
}

function formatDate(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '-' : new Intl.DateTimeFormat('ru-RU').format(value);
  }

  const source = String(value).trim();
  const russianDate = source.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);

  if (russianDate) {
    const [, day, month, year] = russianDate;
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
  }

  const serverDate = source.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (serverDate) {
    const [, year, month, day] = serverDate;
    return `${day}.${month}.${year}`;
  }

  const numericValue = Number(source);
  const parsedDate = /^\d+$/.test(source)
    ? new Date(numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue)
    : new Date(source);

  return Number.isNaN(parsedDate.getTime()) ? '-' : new Intl.DateTimeFormat('ru-RU').format(parsedDate);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
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
