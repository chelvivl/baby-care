type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="page placeholder-page">
      <h2 className="placeholder-page__title">{title}</h2>
      <p className="placeholder-page__text">{description}</p>
    </div>
  )
}
