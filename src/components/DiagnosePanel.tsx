import { diagnoseZeilen, type Diagnose } from '../audio/diagnoseZeilen'
import { TEXTE } from '../texte'

// Diagnose-Tafel (MIC-04): immer sichtbar, nur Anzeige – kein Kopieren/Export (D-05).
// Alle Werte sind reine Textknoten (Browser-Strings nie als HTML).
export function DiagnosePanel({ diagnose }: { diagnose: Diagnose }) {
  return (
    <section className="diagnose" aria-labelledby="diagnose-titel">
      <h2 id="diagnose-titel">{TEXTE.mikrofonTest.diagnose.titel}</h2>
      <dl className="diagnose-liste">
        {diagnoseZeilen(diagnose).map((z) => (
          <div key={z.label} className="diagnose-zeile">
            <dt>{z.label}</dt>
            <dd className={z.problem ? 'diag-problem' : undefined}>{z.wert}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
