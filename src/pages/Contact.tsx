/* Contact: one clear invitation. */
import { CONTACT } from '../data/projects'

export default function Contact() {
  return (
    <div className="page page-contact">
      <p className="section-index reveal">
        <span className="index-num">04</span> Contact
      </p>
      <p className="contact-status reveal">{CONTACT.status}</p>
      <a className="contact-cta" href={`mailto:${CONTACT.email}`} data-cursor="Send" data-magnetic>
        <span className="mask-line">
          <span className="reveal-line">Let's build.</span>
        </span>
      </a>
      <p className="contact-note reveal">
        Robotics, embedded systems, internships, or whatever you are building.
      </p>
      <div className="contact-links">
        <a href={CONTACT.github} target="_blank" rel="noreferrer" className="link-wipe" data-cursor="Open">
          GitHub
        </a>
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="link-wipe" data-cursor="Open">
          LinkedIn
        </a>
        <a href={`mailto:${CONTACT.email}`} className="link-wipe" data-cursor="Send">
          {CONTACT.email}
        </a>
      </div>
      <footer className="contact-footer">Ekam Kooner 2026</footer>
    </div>
  )
}
