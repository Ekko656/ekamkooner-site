/* Contact: one clear invitation. */
import { CONTACT } from '../data/projects'
import Marks from '../ui/Marks'

export default function Contact() {
  return (
    <div className="page page-contact">
      {/* the section index, same as every other page */}
      <p className="section-index reveal">
        <span className="index-num">04</span> Contact
      </p>
      <a className="contact-cta" href={CONTACT.mail} target="_blank" rel="noreferrer">
        <span className="mask-line">
          <span className="reveal-line">Let's build.</span>
        </span>
      </a>
      <p className="contact-note reveal">
        Robotics, embedded systems, internships, or whatever you are building.
      </p>
      {/* the same three marks as the landing, not a second set of word
          links doing the same job in a different voice */}
      <Marks className="contact-marks" />
      {/* the address in plain text as well: the mark opens a compose
          window, but anyone who would rather copy it can */}
      <p className="contact-address label">{CONTACT.email}</p>
      <footer className="contact-footer">Ekam Kooner 2026</footer>
    </div>
  )
}
