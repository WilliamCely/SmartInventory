import { Construction } from 'lucide-react'

interface Props {
  title: string
  description: string
}

function ModulePlaceholder({ title, description }: Props) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <Construction className="mx-auto mb-3 text-slate-500" size={26} />
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </section>
  )
}

export default ModulePlaceholder
