import { isDefined } from 'twenty-shared/utils';

import { COMPANY_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/company-data-seeds.constant';
import { PERSON_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/person-data-seeds.constant';
import {
  WORKSPACE_MEMBER_DATA_SEED_IDS,
  WORKSPACE_MEMBER_DATA_SEEDS,
} from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type OpportunityDataSeed = {
  id: string;
  name: string;
  amountAmountMicros: number;
  amountCurrencyCode: string;
  closeDate: Date;
  stage: string;
  position: number;
  pointOfContactId: string;
  companyId: string;
  ownerId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const OPPORTUNITY_DATA_SEED_COLUMNS: (keyof OpportunityDataSeed)[] = [
  'id',
  'name',
  'amountAmountMicros',
  'amountCurrencyCode',
  'closeDate',
  'stage',
  'position',
  'pointOfContactId',
  'companyId',
  'ownerId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

const OPPORTUNITY_DATA_SEED_COUNT = 150;

const GENERATE_OPPORTUNITY_IDS = (): Record<string, string> => {
  const OPPORTUNITY_IDS: Record<string, string> = {};

  for (let INDEX = 1; INDEX <= OPPORTUNITY_DATA_SEED_COUNT; INDEX++) {
    const HEX_INDEX = INDEX.toString(16).padStart(4, '0');

    OPPORTUNITY_IDS[`ID_${INDEX}`] =
      `50505050-${HEX_INDEX}-4e7c-8001-123456789abc`;
  }

  return OPPORTUNITY_IDS;
};

export const OPPORTUNITY_DATA_SEED_IDS = GENERATE_OPPORTUNITY_IDS();

const OUTREACH_STAGE_FLOW = [
  'LEAD',
  'DRIP',
  'QUOTE',
  'INVOICE',
  'PAID',
  'SHIPPED',
  'RECEIVED',
] as const;

// Credible opportunity names for Apple selling to various companies
const OPPORTUNITY_TEMPLATES = [
  { name: 'Enterprise iPad Deployment', amount: 2500000 },
  { name: 'MacBook Pro Fleet Upgrade', amount: 1800000 },
  { name: 'iPhone Corporate Program', amount: 3200000 },
  { name: 'Apple TV+ Enterprise License', amount: 450000 },
  { name: 'Mac Studio Creative Suite', amount: 890000 },
  { name: 'iPad Pro Design Team Setup', amount: 670000 },
  { name: 'Apple Watch Corporate Wellness', amount: 320000 },
  {
    name: 'iMac Office Workstation Refresh',
    amount: 1200000,
  },
  { name: 'Apple One Business Bundle', amount: 180000 },
  { name: 'MacBook Air Remote Work Package', amount: 950000 },
  { name: 'Apple Pencil Educational License', amount: 85000 },
  {
    name: 'Mac Pro Video Production Setup',
    amount: 2100000,
  },
  { name: 'iPhone SE Frontline Workers', amount: 780000 },
  { name: 'Apple CarPlay Integration', amount: 1500000 },
  { name: 'iPad Air Retail Deployment', amount: 620000 },
  { name: 'Apple Music Business License', amount: 95000 },
  { name: 'Mac mini Server Infrastructure', amount: 430000 },
  { name: 'Apple Arcade Enterprise Gaming', amount: 75000 },
  { name: 'iPhone 15 Pro Executive Program', amount: 540000 },
  { name: 'Apple Fitness+ Corporate Wellness', amount: 125000 },
  { name: 'iPad Mini Field Operations', amount: 380000 },
  {
    name: 'Apple News+ Business Subscription',
    amount: 45000,
  },
  { name: 'MacBook Pro M3 Developer Team', amount: 1600000 },
  {
    name: 'Apple Vision Pro Prototype Lab',
    amount: 850000,
  },
  { name: 'iPhone Photography Workshop', amount: 65000 },
  { name: 'Apple Store Corporate Training', amount: 155000 },
  { name: 'iPad Kiosk Solution Deployment', amount: 290000 },
  {
    name: 'Apple Pay Enterprise Integration',
    amount: 720000,
  },
  { name: 'Mac Studio Animation Pipeline', amount: 1350000 },
  { name: 'Apple Configurator MDM Setup', amount: 210000 },
  {
    name: 'iPhone Accessibility Features Training',
    amount: 85000,
  },
  { name: 'Apple Business Manager License', amount: 180000 },
  { name: 'iPad Pro AR Development Kit', amount: 490000 },
  { name: 'Apple School Manager Education', amount: 320000 },
  { name: 'MacBook Air Student Program', amount: 750000 },
  { name: 'Apple Watch Health Monitoring', amount: 280000 },
  { name: 'iPhone Security Audit Services', amount: 195000 },
  {
    name: 'Apple TV Digital Signage Solution',
    amount: 340000,
  },
  { name: 'Mac Pro Rendering Farm Setup', amount: 2800000 },
  {
    name: 'Apple Pencil Digital Art License',
    amount: 120000,
  },
  { name: 'iPad Point of Sale Integration', amount: 580000 },
  {
    name: 'Apple Maps Business Integration',
    amount: 165000,
  },
  { name: 'iPhone App Development Workshop', amount: 95000 },
  {
    name: 'Apple Silicon Migration Consulting',
    amount: 420000,
  },
  {
    name: 'iPad Inventory Management System',
    amount: 350000,
  },
  {
    name: 'Apple Podcast Enterprise Hosting',
    amount: 75000,
  },
  {
    name: 'MacBook Pro Creative Cloud Bundle',
    amount: 1100000,
  },
  { name: 'Apple ID Enterprise SSO Setup', amount: 240000 },
  { name: 'iPhone Field Service Optimization', amount: 680000 },
  {
    name: 'Apple Retail Partnership Program',
    amount: 1950000,
  },
];

const GENERATE_OPPORTUNITY_SEEDS = (): OpportunityDataSeed[] => {
  const OPPORTUNITY_SEEDS: OpportunityDataSeed[] = [];

  for (let INDEX = 1; INDEX <= OPPORTUNITY_DATA_SEED_COUNT; INDEX++) {
    const TEMPLATE_INDEX = (INDEX - 1) % OPPORTUNITY_TEMPLATES.length;
    const TEMPLATE = OPPORTUNITY_TEMPLATES[TEMPLATE_INDEX];

    const DAYS_AHEAD = Math.floor(Math.random() * 90) + 1;
    const CLOSE_DATE = new Date();

    CLOSE_DATE.setDate(CLOSE_DATE.getDate() + DAYS_AHEAD);

    const workspaceMemberId = Object.values(WORKSPACE_MEMBER_DATA_SEED_IDS)[
      INDEX % 4
    ];
    const workspaceMember = WORKSPACE_MEMBER_DATA_SEEDS.find(
      (workspaceMember) => workspaceMember.id === workspaceMemberId,
    );
    const workspaceMemberName = isDefined(workspaceMember)
      ? `${workspaceMember?.nameFirstName} ${workspaceMember?.nameLastName}`
      : 'Unkonwn';

    const rawSeed: OpportunityDataSeed = {
      id: OPPORTUNITY_DATA_SEED_IDS[`ID_${INDEX}`],
      name: TEMPLATE.name,
      amountAmountMicros: TEMPLATE.amount * 1000000,
      amountCurrencyCode: 'USD',
      closeDate: CLOSE_DATE,
      stage: OUTREACH_STAGE_FLOW[(INDEX - 1) % OUTREACH_STAGE_FLOW.length],
      position: INDEX,
      pointOfContactId:
        PERSON_DATA_SEED_IDS[
          `ID_${INDEX}` as keyof typeof PERSON_DATA_SEED_IDS
        ] || PERSON_DATA_SEED_IDS.ID_1,
      companyId:
        COMPANY_DATA_SEED_IDS[
          `ID_${Math.ceil(INDEX / 2)}` as keyof typeof COMPANY_DATA_SEED_IDS
        ] || COMPANY_DATA_SEED_IDS.ID_1,
      ownerId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
      createdBySource: 'MANUAL',
      updatedBySource: 'MANUAL',
      createdByWorkspaceMemberId: workspaceMemberId,
      createdByName: workspaceMemberName,
      updatedByWorkspaceMemberId: workspaceMemberId,
      updatedByName: workspaceMemberName,
    };

    const opportunityDataSeedWithSQLColumnOrder: OpportunityDataSeed =
      Object.fromEntries(
        OPPORTUNITY_DATA_SEED_COLUMNS.map((column) => [
          column,
          rawSeed[column as keyof OpportunityDataSeed],
        ]),
      ) as OpportunityDataSeed;

    OPPORTUNITY_SEEDS.push(opportunityDataSeedWithSQLColumnOrder);
  }

  return OPPORTUNITY_SEEDS;
};

export const OPPORTUNITY_DATA_SEEDS = GENERATE_OPPORTUNITY_SEEDS();
