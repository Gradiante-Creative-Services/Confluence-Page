import { Fragment } from 'react'
import { sessionDates } from '../data/artifacts'

export function StatusCard() {
  return (
    <div className="status-card">
      <div className="status-top">
        <div className="status-file">
          Current Status <span>· ops/status/</span>
        </div>
        <div className="status-pill">starts tomorrow</div>
      </div>

      <div className="pipeline">
        {sessionDates.map((date, index) => {
          const [, weekday, day] = date.split(' ')

          return (
            <Fragment key={date}>
              {index > 0 && <div className="pline" />}
              <div className={`pnode${index === 0 ? ' next' : ''}`}>
                <div className="pdot" />
                <div className="plabel">
                  D{index + 1}
                  <br />
                  {weekday} {day}
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>

      <div className="status-foot">
        <div>
          Session <b>0 / 10</b> complete
        </div>
        <div>
          Next: <b>Day 1 · Mon Jul 27</b>
        </div>
        <div>
          Format: <b>Weekday evenings</b>
        </div>
        <div>
          Cohort: <b>ThoughtFocus developers</b>
        </div>
      </div>
    </div>
  )
}
