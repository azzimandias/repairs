import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import './styles.css';

const homeUrl = import.meta.env.VITE_HOME_URL || '/';
const managers = ['Анна Смирнова', 'Игорь Ковалев', 'Мария Орлова', 'Павел Лебедев'];
const engineers = ['Дмитрий Волков', 'Сергей Никитин', 'Олег Морозов', 'Елена Соколова'];

const repairRequests = [
  {
    id: 'R-2026-1042',
    date: '2026-07-14',
    uid: 'UID-98421',
    equipment: 'Ноутбук Lenovo ThinkPad T14',
    serialNumber: 'PF4Q7A2M',
    client: 'ООО Альфа-Снаб',
    manager: 'Анна Смирнова',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 12800,
    repairType: 'Платный',
    status: 'В диагностике',
    audience: 'manager',
  },
  {
    id: 'R-2026-1041',
    date: '2026-07-13',
    uid: 'UID-98375',
    equipment: 'Монитор Dell UltraSharp U2720Q',
    serialNumber: 'CN0X9210',
    client: 'ИП Воронцов',
    manager: 'Игорь Ковалев',
    engineer: 'Сергей Никитин',
    issueDate: '2026-07-15',
    price: 0,
    repairType: 'Гарантийный',
    status: 'Готов к выдаче',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1040',
    date: '2026-07-12',
    uid: 'UID-98290',
    equipment: 'Принтер HP LaserJet Pro M404dn',
    serialNumber: 'VNC3B78144',
    client: 'ГК Север',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '',
    price: 7300,
    repairType: 'Платный',
    status: 'Ожидает запчасть',
    audience: 'manager',
  },
  {
    id: 'R-2026-1039',
    date: '2026-07-11',
    uid: 'UID-98117',
    equipment: 'Сканер Zebra DS2208',
    serialNumber: 'ZBR2208-91',
    client: 'Аптека Плюс',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '2026-07-13',
    price: 4200,
    repairType: 'Платный',
    status: 'Выдано',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1038',
    date: '2026-07-10',
    uid: 'UID-98062',
    equipment: 'Системный блок iRU Office',
    serialNumber: 'IRU-44A902',
    client: 'ООО ТехноМаркет',
    manager: 'Анна Смирнова',
    engineer: 'Сергей Никитин',
    issueDate: '',
    price: 9600,
    repairType: 'Гарантийный',
    status: 'В ремонте',
    audience: 'manager',
  },
  {
    id: 'R-2026-1037',
    date: '2026-07-09',
    uid: 'UID-97920',
    equipment: 'ИБП APC Back-UPS 950VA',
    serialNumber: '3B2019X09217',
    client: 'Медцентр Нова',
    manager: 'Игорь Ковалев',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 5600,
    repairType: 'Платный',
    status: 'Согласование',
    audience: 'manager',
  },
  {
    id: 'R-2026-1036',
    date: '2026-07-08',
    uid: 'UID-97840',
    equipment: 'POS-терминал Атол Sigma 10',
    serialNumber: 'AT-S10-44520',
    client: 'Кофейня Бруно',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '2026-07-12',
    price: 0,
    repairType: 'Гарантийный',
    status: 'Закрыто',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1035',
    date: '2026-07-07',
    uid: 'UID-97795',
    equipment: 'Планшет Samsung Galaxy Tab Active',
    serialNumber: 'R52T70Q4H7K',
    client: 'Логистика Восток',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '',
    price: 11200,
    repairType: 'Платный',
    status: 'В работе',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1034',
    date: '2026-07-06',
    uid: 'UID-97721',
    equipment: 'МФУ Canon i-SENSYS MF445dw',
    serialNumber: 'CAN445-72411',
    client: 'Школа 18',
    manager: 'Анна Смирнова',
    engineer: 'Сергей Никитин',
    issueDate: '',
    price: 6900,
    repairType: 'Платный',
    status: 'Ожидает клиента',
    audience: 'manager',
  },
  {
    id: 'R-2026-1033',
    date: '2026-07-05',
    uid: 'UID-97654',
    equipment: 'Сервер Dell PowerEdge T40',
    serialNumber: 'T40-9QXW33',
    client: 'ДатаПром',
    manager: 'Игорь Ковалев',
    engineer: 'Дмитрий Волков',
    issueDate: '2026-07-10',
    price: 18400,
    repairType: 'Платный',
    status: 'Выдано',
    audience: 'manager',
  },
  {
    id: 'R-2026-1032',
    date: '2026-07-04',
    uid: 'UID-97588',
    equipment: 'Ноутбук Asus ExpertBook B1',
    serialNumber: 'ASB1-128X44',
    client: 'ООО Линия',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '',
    price: 0,
    repairType: 'Гарантийный',
    status: 'В диагностике',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1031',
    date: '2026-07-03',
    uid: 'UID-97512',
    equipment: 'Касса Эвотор 7.3',
    serialNumber: 'EV-73-77821',
    client: 'Фермерская лавка',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '',
    price: 3800,
    repairType: 'Платный',
    status: 'Принято',
    audience: 'manager',
  },
  {
    id: 'R-2026-1030',
    date: '2026-07-02',
    uid: 'UID-97448',
    equipment: 'Маршрутизатор MikroTik RB4011',
    serialNumber: 'MT-RB4011-902',
    client: 'ООО СетьПро',
    manager: 'Анна Смирнова',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 5100,
    repairType: 'Платный',
    status: 'В диагностике',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1029',
    date: '2026-07-01',
    uid: 'UID-97391',
    equipment: 'Ноутбук Acer TravelMate P2',
    serialNumber: 'NXVQZER005',
    client: 'Бухгалтерия Контур',
    manager: 'Игорь Ковалев',
    engineer: 'Сергей Никитин',
    issueDate: '',
    price: 8800,
    repairType: 'Платный',
    status: 'Согласование',
    audience: 'manager',
  },
  {
    id: 'R-2026-1028',
    date: '2026-06-30',
    uid: 'UID-97320',
    equipment: 'Терминал сбора данных Honeywell EDA52',
    serialNumber: 'EDA52-4418K',
    client: 'Склад 24',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '2026-07-04',
    price: 0,
    repairType: 'Гарантийный',
    status: 'Готов к выдаче',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1027',
    date: '2026-06-29',
    uid: 'UID-97266',
    equipment: 'Моноблок HP ProOne 440 G9',
    serialNumber: 'HP440G9-724',
    client: 'Клиника Доктор+',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '',
    price: 14300,
    repairType: 'Платный',
    status: 'В ремонте',
    audience: 'manager',
  },
  {
    id: 'R-2026-1026',
    date: '2026-06-28',
    uid: 'UID-97198',
    equipment: 'Коммутатор TP-Link TL-SG3428',
    serialNumber: 'SG3428-11K9',
    client: 'Отель Северный',
    manager: 'Анна Смирнова',
    engineer: 'Сергей Никитин',
    issueDate: '2026-07-02',
    price: 6400,
    repairType: 'Платный',
    status: 'Выдано',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1025',
    date: '2026-06-27',
    uid: 'UID-97121',
    equipment: 'Промышленный планшет Getac F110',
    serialNumber: 'GTC-F110-5501',
    client: 'ГеоСтрой',
    manager: 'Игорь Ковалев',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 0,
    repairType: 'Гарантийный',
    status: 'Ожидает запчасть',
    audience: 'manager',
  },
  {
    id: 'R-2026-1024',
    date: '2026-06-26',
    uid: 'UID-97080',
    equipment: 'Принтер этикеток TSC TE200',
    serialNumber: 'TSC-TE200-812',
    client: 'Маркет Фреш',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '',
    price: 3900,
    repairType: 'Платный',
    status: 'Принято',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1023',
    date: '2026-06-25',
    uid: 'UID-97014',
    equipment: 'Проектор Epson EB-FH52',
    serialNumber: 'EPS-FH52-331',
    client: 'Конференц Холл',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '2026-06-30',
    price: 7200,
    repairType: 'Платный',
    status: 'Закрыто',
    audience: 'manager',
  },
  {
    id: 'R-2026-1022',
    date: '2026-06-24',
    uid: 'UID-96950',
    equipment: 'Ноутбук Dell Latitude 5440',
    serialNumber: 'DL5440-8X21',
    client: 'Юридическое бюро Право',
    manager: 'Анна Смирнова',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 10500,
    repairType: 'Платный',
    status: 'В работе',
    audience: 'manager',
  },
  {
    id: 'R-2026-1021',
    date: '2026-06-23',
    uid: 'UID-96872',
    equipment: 'ККТ Штрих-М-01Ф',
    serialNumber: 'SHT-01F-4112',
    client: 'Пекарня Утро',
    manager: 'Игорь Ковалев',
    engineer: 'Сергей Никитин',
    issueDate: '',
    price: 0,
    repairType: 'Гарантийный',
    status: 'В диагностике',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1020',
    date: '2026-06-22',
    uid: 'UID-96803',
    equipment: 'МФУ Kyocera ECOSYS M2040dn',
    serialNumber: 'KYO2040-992',
    client: 'Администрация района',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '2026-06-28',
    price: 8200,
    repairType: 'Платный',
    status: 'Выдано',
    audience: 'manager',
  },
  {
    id: 'R-2026-1019',
    date: '2026-06-21',
    uid: 'UID-96744',
    equipment: 'Сервер HPE ProLiant ML30',
    serialNumber: 'HPEML30-71A',
    client: 'Интегратор Софт',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '',
    price: 19600,
    repairType: 'Платный',
    status: 'Согласование',
    audience: 'manager',
  },
  {
    id: 'R-2026-1018',
    date: '2026-06-20',
    uid: 'UID-96683',
    equipment: 'Сканер Canon DR-C240',
    serialNumber: 'DRC240-5587',
    client: 'Архив Сервис',
    manager: 'Анна Смирнова',
    engineer: 'Сергей Никитин',
    issueDate: '',
    price: 4700,
    repairType: 'Платный',
    status: 'Ожидает клиента',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1017',
    date: '2026-06-19',
    uid: 'UID-96612',
    equipment: 'POS-моноблок Posiflex XT-3815',
    serialNumber: 'POS3815-207',
    client: 'Ресторан Маяк',
    manager: 'Игорь Ковалев',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 0,
    repairType: 'Гарантийный',
    status: 'В ремонте',
    audience: 'manager',
  },
  {
    id: 'R-2026-1016',
    date: '2026-06-18',
    uid: 'UID-96549',
    equipment: 'Ноутбук MSI Modern 15',
    serialNumber: 'MSIM15-8742',
    client: 'Студия ДизайнПро',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '2026-06-25',
    price: 13200,
    repairType: 'Платный',
    status: 'Закрыто',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1015',
    date: '2026-06-17',
    uid: 'UID-96488',
    equipment: 'ИБП Ippon Back Power Pro II 600',
    serialNumber: 'IPP600-4521',
    client: 'Апарт-отель Река',
    manager: 'Павел Лебедев',
    engineer: 'Елена Соколова',
    issueDate: '',
    price: 3100,
    repairType: 'Платный',
    status: 'Принято',
    audience: 'manager',
  },
  {
    id: 'R-2026-1014',
    date: '2026-06-16',
    uid: 'UID-96420',
    equipment: 'Монитор LG 27QN880-B',
    serialNumber: 'LG27QN-1198',
    client: 'Финанс Групп',
    manager: 'Анна Смирнова',
    engineer: 'Дмитрий Волков',
    issueDate: '',
    price: 0,
    repairType: 'Гарантийный',
    status: 'В диагностике',
    audience: 'engineer',
  },
  {
    id: 'R-2026-1013',
    date: '2026-06-15',
    uid: 'UID-96358',
    equipment: 'Док-станция Lenovo USB-C Dock Gen 2',
    serialNumber: 'LNDCK2-670',
    client: 'Агентство МедиаЛайн',
    manager: 'Игорь Ковалев',
    engineer: 'Сергей Никитин',
    issueDate: '2026-06-19',
    price: 2500,
    repairType: 'Платный',
    status: 'Выдано',
    audience: 'manager',
  },
  {
    id: 'R-2026-1012',
    date: '2026-06-14',
    uid: 'UID-96284',
    equipment: 'Тонкий клиент HP t640',
    serialNumber: 'HPT640-9034',
    client: 'Колл-центр Диалог',
    manager: 'Мария Орлова',
    engineer: 'Олег Морозов',
    issueDate: '',
    price: 6100,
    repairType: 'Платный',
    status: 'Ожидает запчасть',
    audience: 'engineer',
  },
];

const requestDetails = {
  equipment: {
    model: 'Ноутбук Lenovo ThinkPad T14',
    serialNumber: 'PF4Q7A2M',
    declaredFault: 'Не включается после обновления BIOS',
    kit: 'Ноутбук, блок питания, сумка',
    externalState: 'Следы эксплуатации, без трещин корпуса',
    pickupPoint: 'Москва, Ленинский пр-т, 42',
    sellerName: 'ООО ТехПоставка',
    saleOrRepairDate: '2025-11-18',
    invoiceNumber: 'НК-88421',
  },
  client: {
    companyName: 'ООО Альфа-Снаб',
    city: 'Москва',
    contactPerson: 'Виктор Климов',
    email: 'klimov@alfa-snab.example',
    phone: '+7 495 120-44-18',
    postalAddress: '117105, Москва, Варшавское ш., 12',
    requestManager: 'Анна Смирнова',
    approvedWorks: 'Диагностика, восстановление BIOS, проверка питания',
  },
  repair: {
    engineer: 'Дмитрий Волков',
    faultDescription: 'Питание на плате присутствует, POST не проходит',
    faultReasons: 'Повреждение прошивки BIOS',
    expectedRepair: 'Прошивка BIOS программатором, тестирование',
    repair: 'Ожидает подтверждения стоимости',
    usageViolation: 'Не выявлено',
    diagnosisMinutes: '45',
    comment: 'Клиент просил сохранить накопитель без форматирования',
    diagnosisTotal: '1800',
    repairMinutes: '90',
    repairTotal: '11000',
    spareWaitingComment: 'Запчасти не требуются',
    diagnosisAct: 'АД-1042.pdf',
    workAct: '',
  },
  parts: [
    { source: 'Наша', model: 'BIOS chip W25Q128', qty: 1, stock: 8, price: 650, comment: 'Резерв на случай замены' },
    { source: 'Покупная', model: 'Термопрокладка 1 мм', qty: 2, stock: 0, price: 240, comment: 'После диагностики охлаждения' },
  ],
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

const selectFieldOptions = {
  model: [
    'Ноутбук Lenovo ThinkPad T14',
    'Сканер Zebra DS2208',
    'Монитор Dell UltraSharp U2720Q',
    'Принтер HP LaserJet Pro M404dn',
    'POS-терминал Атол Sigma 10',
  ],
  pickupPoint: [
    'Москва, Ленинский пр-т, 42',
    'Москва, Варшавское ш., 12',
    'Санкт-Петербург, Лиговский пр-т, 88',
    'Казань, ул. Пушкина, 17',
  ],
  engineer: engineers,
  faultDescription: [
    'Питание на плате присутствует, POST не проходит',
    'Устройство не включается',
    'Не определяется компьютером',
    'Периодически теряет питание',
    'Не печатает / не сканирует',
  ],
  faultReasons: [
    'Повреждение прошивки BIOS',
    'Неисправность цепи питания',
    'Механическое повреждение',
    'Износ расходных материалов',
    'Требуется дополнительная диагностика',
  ],
  expectedRepair: [
    'Прошивка BIOS программатором, тестирование',
    'Замена неисправного модуля',
    'Восстановление цепи питания',
    'Чистка, профилактика, тестирование',
    'Согласование ремонта с клиентом',
  ],
  repair: [
    'Ожидает подтверждения стоимости',
    'Выполнен',
    'В работе',
    'Ожидает запчасть',
    'Отказ клиента от ремонта',
  ],
  usageViolation: ['Не выявлено', 'Выявлено', 'Требуется проверка', 'Следы попадания жидкости', 'Механическое повреждение'],
};

const requestStatusRoadmap = [
  { status: 'Принято', role: 'Менеджер' },
  { status: 'В диагностике', role: 'Инженер' },
  { status: 'Согласование', role: 'Менеджер' },
  { status: 'В ремонте', role: 'Инженер' },
  { status: 'Ожидает запчасть', role: 'Кладовщик' },
  { status: 'Готов к выдаче', role: 'Менеджер' },
  { status: 'Выдано', role: 'Менеджер' },
  { status: 'Закрыто', role: 'Администратор' },
];

function App() {
  const path = window.location.pathname;
  const detailMatch = path.match(/^\/requests\/([^/]+)$/);

  if (detailMatch) {
    return <RequestPage requestId={decodeURIComponent(detailMatch[1])} />;
  }

  return <RequestsListPage />;
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
  const loadingTimerRef = useRef(null);
  const [filters, setFilters] = useState({
    audience: 'all',
    repairType: 'all',
    manager: 'all',
    unfinished: false,
    search: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const filteredRequests = useMemo(() => {
    return repairRequests.filter((request) => {
      const text = [
        request.date,
        request.uid,
        request.equipment,
        request.serialNumber,
        request.client,
        request.manager,
        request.engineer,
        request.repairType,
        request.status,
      ]
        .join(' ')
        .toLowerCase();

      const closed = ['Выдано', 'Закрыто'].includes(request.status);
      const byAudience = filters.audience === 'all' || request.audience === filters.audience;
      const byType = filters.repairType === 'all' || request.repairType === filters.repairType;
      const byManager = filters.manager === 'all' || request.manager === filters.manager;
      const byUnfinished = !filters.unfinished || !closed;
      const bySearch = !filters.search || text.includes(filters.search.toLowerCase().trim());

      return byAudience && byType && byManager && byUnfinished && bySearch;
    });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const visibleRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  const nearbyPages = getNearbyPages(page, totalPages);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  function showTableSkeleton() {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    setIsLoading(true);
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      loadingTimerRef.current = null;
    }, 450);
  }

  function updateFilter(name, value) {
    showTableSkeleton();
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
    const rows = filteredRequests.map((request) => [
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
            <button className="button secondary" type="button" onClick={exportExcel}>
              <Download size={18} />
              Excel
            </button>
            <button className="button primary" type="button">
              <FilePlus2 size={18} />
              Создать заявку
            </button>
          </div>
        </header>

        <section className="toolbar" aria-label="Фильтры заявок">
          <div className="segmented">
            <button
              className={filters.audience === 'all' ? 'active' : ''}
              type="button"
              onClick={() => updateFilter('audience', 'all')}
            >
              Все
            </button>
            <button
              className={filters.audience === 'manager' ? 'active' : ''}
              type="button"
              onClick={() => updateFilter('audience', 'manager')}
            >
              Для менеджера
            </button>
            <button
              className={filters.audience === 'engineer' ? 'active' : ''}
              type="button"
              onClick={() => updateFilter('audience', 'engineer')}
            >
              Для инженера
            </button>
          </div>

          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={filters.unfinished}
              onChange={(event) => updateFilter('unfinished', event.target.checked)}
            />
            Незаконченные
          </label>

          <select value={filters.repairType} onChange={(event) => updateFilter('repairType', event.target.value)}>
            <option value="all">Любой тип ремонта</option>
            <option value="Платный">Платный</option>
            <option value="Гарантийный">Гарантийный</option>
          </select>

          <select value={filters.manager} onChange={(event) => updateFilter('manager', event.target.value)}>
            <option value="all">Все менеджеры</option>
            {managers.map((manager) => (
              <option value={manager} key={manager}>
                {manager}
              </option>
            ))}
          </select>

          <label className="search-field">
            <Search size={18} />
            <input
              type="search"
              placeholder="Поиск по тексту"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>
        </section>

        <section className="table-pagination" aria-label="Пагинация заявок">
          <span>
            Найдено: <strong>{filteredRequests.length}</strong>
          </span>
          <label className="page-size">
            Строк на странице
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <div className="pager">
          <button className="icon-button" type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={18} />
          </button>
          <div className="page-buttons">
            {nearbyPages.map((pageNumber) => (
              <button
                className={`page-button ${pageNumber === page ? 'active' : ''}`}
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <label className="page-jump">
            <span>№</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(event) => goToPage(event.target.value)}
            />
          </label>
          <button
            className="icon-button"
            type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
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
  const request = repairRequests.find((item) => item.id === requestId) || repairRequests[0];
  const [parts, setParts] = useState(requestDetails.parts);
  const isLoading = false;

  function addPart(source) {
    setParts((current) => [
      ...current,
      { source, model: '', qty: 1, stock: source === 'Наша' ? 0 : '-', price: 0, comment: '' },
    ]);
  }

  return (
    <main className="app-shell detail-shell">
      <div className="sticky-controls detail-sticky-controls">
        <GlobalHeader />
        <header className="topbar detail-header">
          <div className="detail-title">
            <button className="icon-button back-button" type="button" onClick={() => window.close()}>
              <ArrowLeft size={18} />
            </button>
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
              <StatusRoadmap currentStatus={request.status} />
              <span>{request.client}</span>
            </div>
          )}
        </header>
      </div>

      <div className="detail-content-scroll">
        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <div className="detail-grid">
            <FormBlock title="Оборудование" fields={requestDetails.equipment} />
            <FormBlock title="Клиент" fields={requestDetails.client} />
            <FormBlock title="Ремонтные работы" fields={requestDetails.repair} wide />

            <section className="detail-block wide-block">
              <div className="block-title-row">
                <h2>Запчасти</h2>
                <div className="parts-actions">
                  <button className="button secondary" type="button" onClick={() => addPart('Покупная')}>
                    <Plus size={18} />
                    Добавить покупную запчасть
                  </button>
                  <button className="button secondary" type="button" onClick={() => addPart('Наша')}>
                    <Plus size={18} />
                    Добавить нашу запчасть
                  </button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, index) => (
                      <tr key={`${part.source}-${index}`}>
                        <td>
                          <input value={part.source} readOnly />
                        </td>
                        <td>
                          <input
                            value={part.model}
                            onChange={(event) => updatePart(setParts, index, 'model', event.target.value)}
                            placeholder="Модель запчасти"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={part.qty}
                            onChange={(event) => updatePart(setParts, index, 'qty', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={part.stock}
                            onChange={(event) => updatePart(setParts, index, 'stock', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={part.price}
                            onChange={(event) => updatePart(setParts, index, 'price', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={part.comment}
                            onChange={(event) => updatePart(setParts, index, 'comment', event.target.value)}
                            placeholder="Комментарий"
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

function StatusRoadmap({ currentStatus }) {
  const currentIndex = requestStatusRoadmap.findIndex((step) => step.status === currentStatus);

  return (
    <span className="status-roadmap">
      <button className="status-pill status-trigger" type="button">
        {currentStatus}
      </button>
      <span className="status-tooltip" role="tooltip">
        <span className="status-tooltip-title">Этапы заявки</span>
        <span className="status-steps">
          {requestStatusRoadmap.map((step, index) => {
            const isCurrent = step.status === currentStatus;
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
                {Array.from({ length: 6 }).map((_, index) => (
                  <th key={`parts-head-skeleton-${index}`}>
                    <span className="skeleton-line header" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr className="skeleton-row" key={`parts-row-skeleton-${rowIndex}`}>
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
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
              <select defaultValue={value}>
                {selectFieldOptions[name].map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : String(value).length > 56 ? (
              <textarea defaultValue={value} rows={3} />
            ) : (
              <input defaultValue={value} />
            )}
          </label>
        ))}
      </div>
    </section>
  );
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

createRoot(document.getElementById('root')).render(<App />);
