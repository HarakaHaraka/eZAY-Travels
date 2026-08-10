import { accreditationClaim, canSellFlights } from '@/lib/accreditation';

/**
 * "Where we are, honestly" — the credentials panel.
 *
 * The financial-protection row is the only one that is not a fixed string: it
 * reads the accreditation config. Blank config states plainly that there is
 * no licence yet and that we do not take card payment for flights, which is
 * the truth and is not a protection claim. Once the config is populated the
 * row states the holder and number from config, never from code.
 */
export function CredentialsSection() {
  const claim = accreditationClaim();
  const bookable = canSellFlights();

  const rows: Array<[title: string, value: string, done: boolean]> = [
    ['Registered company', 'eZAY Travels and Tours Ltd — company number to be displayed', false],
    claim === null
      ? [
          'Financial protection',
          'Accreditation and licence number to be confirmed before we take payment',
          false,
        ]
      : ['Financial protection', `${claim.holderName} — ${claim.number}`, true],
    ['Professional indemnity', 'Cover being arranged — certificate to be displayed', false],
    ['Data protection', 'ICO registration in progress', false],
    ['Flight content', 'Duffel — integration in test', false],
    ['Long-haul net fares', 'Faremine trade account — application submitted', false],
    ['Payments', 'Stripe hosted checkout — card details never touch our systems', true],
    ['A person answers', 'Quote back within four working hours, every enquiry', true],
  ];

  return (
    <section className="wrap" style={{ paddingTop: 0 }} id="credentials">
      <div className="creds">
        <div className="creds-head">
          <h3>Where we are, honestly</h3>
          <p>
            We are a new agency and we are not going to pretend otherwise. Here is exactly what is
            in place and what is not — updated as each one lands.
          </p>
        </div>
        <div className="creds-grid">
          {rows.map(([title, value, done]) => (
            <div className={`cred ${done ? 'done' : 'wip'}`} key={title}>
              <span className="dot" />
              <span>
                <span className="t">{title}</span>
                <span className="v">{value}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="creds-foot">
          {bookable ? (
            <>
              Flights on this site are sold under the accreditation shown above. Every enquiry is
              answered by a person within four working hours.
            </>
          ) : (
            <>
              Until financial protection is confirmed, we quote and advise but we do not take
              payment for flights on this site. Every enquiry is answered by a person within four
              working hours.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
