/* Resume: the paper, embedded and downloadable. */
export default function Resume() {
  return (
    <div className="page page-resume">
      <header className="page-head">
        <p className="section-index reveal">
          <span className="index-num">03</span> Resume
        </p>
        <h1 className="page-title">
          <span className="mask-line">
            <span className="reveal-line">The short version, on paper.</span>
          </span>
        </h1>
        <a className="resume-download link-wipe reveal" href="/resume.pdf" download="Ekam-Kooner-Resume.pdf" data-cursor="Save">
          Download PDF
        </a>
      </header>
      <div className="resume-frame reveal">
        <iframe src="/resume.pdf#toolbar=0&navpanes=0" title="Ekam Kooner resume" />
      </div>
    </div>
  )
}
