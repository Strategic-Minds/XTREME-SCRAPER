import Link from 'next/link'
import AppShell from './AppShell'
import styles from './AppShell.module.css'

export type WorkspaceCard = { title: string; copy: string; status?: string }

export default function WorkspacePage({
  title,
  eyebrow,
  description,
  cards,
  emptyTitle,
  emptyCopy,
  actionHref = '/search',
  actionLabel = 'Run an intelligence search',
  notice,
}: {
  title: string
  eyebrow: string
  description: string
  cards: WorkspaceCard[]
  emptyTitle?: string
  emptyCopy?: string
  actionHref?: string
  actionLabel?: string
  notice?: string
}) {
  return <AppShell title={title}>
    <section className={styles.pageHeader}>
      <div><div className={styles.eyebrow}>{eyebrow}</div><h1 className={styles.title}>{title}</h1><p className={styles.description}>{description}</p></div>
    </section>
    {notice && <div className={styles.warning}>{notice}</div>}
    <section className={styles.grid} style={{ marginTop: 20 }}>
      {cards.map(card => <article className={styles.card} key={card.title}>{card.status && <span className={styles.status}>{card.status}</span>}<h2 className={styles.cardTitle}>{card.title}</h2><p className={styles.cardCopy}>{card.copy}</p></article>)}
    </section>
    {emptyTitle && <section className={styles.empty} style={{ marginTop: 24 }}><h2>{emptyTitle}</h2><p>{emptyCopy}</p><Link href={actionHref} className={styles.button}>{actionLabel}</Link></section>}
  </AppShell>
}
