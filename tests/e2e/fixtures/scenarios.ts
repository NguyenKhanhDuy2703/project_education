export interface RoleScenario {
  caseId: string;
  role: 'guest' | 'user' | 'contributor';
  title: string;
  targetPath: string;
  expectedHeading: RegExp | string;
  storageSeed?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isContributor?: boolean;
    };
  };
}

export const roleNavigationScenarios: RoleScenario[] = [
  {
    caseId: 'ROLE_GUEST_01',
    role: 'guest',
    title: 'Guest navigates to Series Catalog',
    targetPath: '/series',
    expectedHeading: /Series|Catalog|Khóa học/i,
  },
  {
    caseId: 'ROLE_USER_02',
    role: 'user',
    title: 'Learner accesses User Dashboard Profile',
    targetPath: '/user/dashboard/profile',
    expectedHeading: /Alex Rivera/i,
    storageSeed: {
      token: 'jwt-mock-learner',
      user: {
        id: 'learner-001',
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        role: 'user',
        isContributor: false,
      },
    },
  },
  {
    caseId: 'ROLE_CONTRIB_03',
    role: 'contributor',
    title: 'Contributor accesses Lab Studio Editor',
    targetPath: '/user/dashboard/labs/new',
    expectedHeading: /Theory & Learner Guide/i,
    storageSeed: {
      token: 'jwt-mock-contrib',
      user: {
        id: 'contrib-001',
        name: 'Dev Contributor',
        email: 'contributor@example.com',
        role: 'contributor',
        isContributor: true,
      },
    },
  },
];

export interface LocaleThemeScenario {
  caseId: string;
  title: string;
  themeAction: 'dark' | 'light';
  expectedDarkClass: boolean;
  localeAction: 'vi' | 'en';
  expectedLang: 'vi' | 'en';
}

export const localeThemeScenarios: LocaleThemeScenario[] = [
  {
    caseId: 'PREF_01',
    title: 'Toggles Dark Mode and Retains Full English',
    themeAction: 'dark',
    expectedDarkClass: true,
    localeAction: 'en',
    expectedLang: 'en',
  },
  {
    caseId: 'PREF_02',
    title: 'Toggles Light Mode and Retains Full English',
    themeAction: 'light',
    expectedDarkClass: false,
    localeAction: 'en',
    expectedLang: 'en',
  },
];
