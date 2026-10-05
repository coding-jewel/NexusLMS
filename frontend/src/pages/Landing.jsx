import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import '../styles/Landing.css'

const steps = [
  ['Register your school', 'Tell us the school name. We create your own address from it.'],
  ['Create classes', 'Set up the classes and sections your school runs.'],
  ['Add teachers', 'Enter each teacher’s details. Their account is ready to use.'],
  ['Students join', 'Share a class code. Students enter it and land in the right class.'],
]

const features = [
  ['Classes', 'Group students into classes and sections. Each class has its own join code.'],
  ['Courses and notes', 'Teachers publish notes and materials for their class, and students read them anywhere.'],
  ['Assignments and file uploads', 'Set a due date, attach files, and collect student work in one place.'],
  ['Quizzes with auto-grading', 'Multiple-choice questions are marked instantly. Open-ended answers wait for the teacher.'],
  ['Gradebook', 'Every score for every student, by course, without a spreadsheet.'],
  ['Roles and permissions', 'Admins, teachers and students each see only what they need.'],
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="nav">
        <div className="container nav__inner">
          <Logo />
          <nav className="nav__links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <div className="nav__actions">
              <Link to="/login" className="btn btn--ghost">Log in</Link>
              <Link to="/register" className="btn btn--primary" aria-label="Register your school">Register<span className="nav__long"> your school</span></Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero__grid">
          <div>
            <h1>One place for your whole school to teach and learn.</h1>
            <p className="hero__lead">
              NexusLMS gives every school its own learning space. Teachers share notes, set
              assignments and run quizzes. Students hand in work and see their grades.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary btn--lg">Register your school</Link>
              <a href="#how" className="btn btn--ghost btn--lg">See how it works</a>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="browser">
              <div className="browser__bar">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <div className="browser__url">
                  <span className="browser__lock">https://</span>
                  <strong>nexus</strong>.nexuslms.com
                </div>
              </div>
              <div className="browser__body">
                <p className="browser__title">Nexus High School</p>
                <div className="browser__tiles">
                  <span className="tile tile--a">SS 1 Science</span>
                  <span className="tile tile--b">JSS 2 Blue</span>
                  <span className="tile tile--c">SS 2 Arts</span>
                </div>
                <div className="browser__row"><i /><b /></div>
                <div className="browser__row"><i /><b className="short" /></div>
              </div>
            </div>
            <p className="hero__caption">Every school gets its own address, users and data.</p>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="container">
          <h2>From sign-up to first lesson in four steps</h2>
          <ol className="steps">
            {steps.map(([title, text], i) => (
              <li key={title} className="step">
                <span className="step__num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="address">
        <div className="container address__inner">
          <div>
            <h2>Your school, at its own address</h2>
            <p>
              Register “Nexus High School” and you get <strong>nexus.nexuslms.com</strong>.
              Teachers and students sign in there, and only see people and work from your school.
            </p>
          </div>
          <div className="address__demo">
            <div><span>Nexus High School</span><code>nexus.nexuslms.com</code></div>
            <div><span>St. Mary’s Academy</span><code>st-marys.nexuslms.com</code></div>
            <div><span>Crown International College</span><code>crown.nexuslms.com</code></div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <h2>Everything a school needs to run its classes</h2>
          <dl className="features__list">
            {features.map(([title, text]) => (
              <div key={title} className="feature">
                <dt>{title}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="cta">
        <div className="container cta__inner">
          <h2>Ready to bring your school online?</h2>
          <Link to="/register" className="btn btn--light btn--lg">Register your school</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <Logo />
          <p>© {new Date().getFullYear()} NexusLMS. Built for schools.</p>
        </div>
      </footer>
    </div>
  )
}