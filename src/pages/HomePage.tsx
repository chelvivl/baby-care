export function HomePage() {
  const today = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="page home-page">
      <header className="home-page__header">
        <p className="home-page__date">{today}</p>
        <h1 className="home-page__brand">Baby Care</h1>
        <p className="home-page__lead">
          Заготовка дневника: сон, кормление и другие события — скоро по вашему ТЗ.
        </p>
      </header>

      <section className="home-page__summary" aria-label="Сводка за сегодня">
        <article className="stat-tile">
          <span className="stat-tile__label">Сон</span>
          <span className="stat-tile__value">—</span>
          <span className="stat-tile__hint">записей пока нет</span>
        </article>
        <article className="stat-tile">
          <span className="stat-tile__label">Кормление</span>
          <span className="stat-tile__value">—</span>
          <span className="stat-tile__hint">записей пока нет</span>
        </article>
      </section>

      <section className="home-page__actions" aria-label="Быстрые действия">
        <button type="button" className="action-chip" disabled>
          Начать сон
        </button>
        <button type="button" className="action-chip" disabled>
          Записать кормление
        </button>
      </section>

      <p className="home-page__footnote">
        Данные будут храниться на этом устройстве (offline-first). Синхронизацию добавим, если
        понадобится.
      </p>
    </div>
  )
}
