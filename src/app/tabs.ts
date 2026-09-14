export type AppTab = 'home' | 'sleep' | 'feeding' | 'settings'

export const TAB_LABELS: Record<AppTab, string> = {
  home: 'Сегодня',
  sleep: 'Сон',
  feeding: 'Кормление',
  settings: 'Настройки',
}

export const TAB_ORDER: AppTab[] = ['home', 'sleep', 'feeding', 'settings']
