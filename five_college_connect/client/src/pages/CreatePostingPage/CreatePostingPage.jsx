import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconBell,
  IconBook,
  IconBriefcase,
  IconCode,
  IconLightbulb,
  IconPeople,
  IconPin,
  LogoCap,
} from '../../components/opportunities/Icons.jsx'
import { createListing } from '../../lib/api.js'
import './CreatePostingPage.css'

// big buttons for listing category (same ids as backend category enum)
const CATEGORIES = [
  { id: 'tutoring', label: 'Tutoring', Icon: IconBook },
  { id: 'project', label: 'Project', Icon: IconCode },
  { id: 'job', label: 'Job', Icon: IconBriefcase },
  { id: 'study_group', label: 'Study Group', Icon: IconPeople },
]

// how applicants can reach the poster (maps to contact_method on listing)
const CONTACT_OPTIONS = [
  {
    id: 'profile',
    label: 'Through Profile',
    hint: 'Students contact via apply.',
  },
  {
    id: 'email',
    label: 'Email',
    hint: 'Provide email address.',
  },
  {
    id: 'phone',
    label: 'Phone',
    hint: 'Provide phone number.',
  },
]

// Maps form state into the backend's current listing contract.
function buildListingPayload(form, status) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    contact_method: form.contact_method,
    contact_details: form.contact_details.trim(),
    banner_image_url: form.banner_image_url.trim() || null,
    custom_color: form.custom_color.trim() || null,
    status,
    expiration_date: form.expiration_date.trim() || null,
    skills: form.required_skills.map((name) => ({
      name,
      category: 'General',
      requirementType: 'required',
    })),
    attachments: [],
  }
}

// little switch row used in the sidebar card
function ToggleRow({ id, label, checked, onChange }) {
  return (
    <label className="cp-toggle" htmlFor={id}>
      <span className="cp-toggle__label">{label}</span>
      <span className="cp-toggle__track">
        <input
          id={id}
          type="checkbox"
          className="cp-toggle__input"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="cp-toggle__knob" aria-hidden />
      </span>
    </label>
  )
}

export default function CreatePostingPage() {
  const navigate = useNavigate()
  // one big object is easier than a million usestates
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'tutoring',
    compensation_amount: '',
    compensation_frequency: '/hour',
    location: '',
    contact_method: 'profile',
    contact_details: '',
    required_skills: [],
    skillDraft: '',
    require_full_profile: true,
    email_notifications: true,
    auto_close_applications: false,
    expiration_date: '',
    banner_image_url: '',
    custom_color: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // generic field writer so inputs dont need 20 handlers
  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addSkill = useCallback(() => {
    const s = form.skillDraft.trim()
    if (!s) return
    setForm((prev) => ({
      ...prev,
      // skip duplicates so the tags dont repeat
      required_skills: prev.required_skills.includes(s)
        ? prev.required_skills
        : [...prev.required_skills, s],
      skillDraft: '',
    }))
  }, [form.skillDraft])

  const removeSkill = useCallback((skill) => {
    setForm((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((x) => x !== skill),
    }))
  }, [])

  const handlePublish = useCallback(async () => {
    if (!form.title.trim()) {
      setErrorMessage('A title is required before publishing.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await createListing(buildListingPayload(form, 'published'))
      navigate('/opportunities', { replace: true })
    } catch (err) {
      setErrorMessage(err?.message || 'Could not publish the listing.')
    } finally {
      setIsSubmitting(false)
    }
  }, [form, navigate])

  // teaser text in the preview card on the right
  const previewSnippet =
    form.description.trim().slice(0, 120) + (form.description.length > 120 ? '…' : '')

  return (
    <div className="cp-app">
      <header className="cp-topnav">
        <div className="cp-topnav__left">
          <Link className="cp-brand" to="/opportunities">
            <LogoCap />
            <span>Five College Connect</span>
          </Link>
        </div>
        <div className="cp-topnav__right">
          <button
            type="button"
            className="cp-btn cp-btn--primary"
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
          <button type="button" className="cp-icon-btn" aria-label="Notifications">
            <IconBell />
          </button>
          <Link to="/profile" className="cp-avatar" aria-label="My profile">
            <span className="cp-avatar__ph" />
          </Link>
        </div>
      </header>

      {/* left = form, right = preview + toggles */}
      <div className="cp-shell">
        <div className="cp-form-col">
          {errorMessage ? (
            <p
              role="alert"
              style={{
                color: '#b00020',
                background: '#fdecea',
                border: '1px solid #f5c2c7',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                marginBottom: '1rem',
              }}
            >
              {errorMessage}
            </p>
          ) : null}
          <div className="cp-field">
            <label className="cp-label" htmlFor="listing-title">
              Title
            </label>
            <input
              id="listing-title"
              className="cp-input"
              name="title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Enter a clear, descriptive title for your posting..."
              autoComplete="off"
            />
          </div>

          <fieldset className="cp-fieldset">
            <legend className="cp-label">Category</legend>
            <div className="cp-category-grid">
              {CATEGORIES.map((cat) => {
                // capital letter so react treats it as a component
                const Icon = cat.Icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={
                      form.category === cat.id ? 'cp-cat cp-cat--active' : 'cp-cat'
                    }
                    onClick={() => setField('category', cat.id)}
                  >
                    <Icon />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="cp-field">
            <label className="cp-label" htmlFor="listing-desc">
              Description
            </label>
            <textarea
              id="listing-desc"
              className="cp-textarea"
              name="description"
              rows={6}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe the opportunity, expectations, time commitment, and who should apply..."
            />
          </div>

          <div className="cp-field">
            <span className="cp-label">Required skills</span>
            <div className="cp-tags">
              {form.required_skills.map((skill) => (
                <span key={skill} className="cp-tag">
                  {skill}
                  <button
                    type="button"
                    className="cp-tag__x"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="cp-skill-add">
              <input
                className="cp-input"
                value={form.skillDraft}
                onChange={(e) => setField('skillDraft', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="Add a skill and press Enter"
                aria-label="Add skill"
              />
              <button type="button" className="cp-btn cp-btn--ghost" onClick={addSkill}>
                + Add skill
              </button>
            </div>
          </div>

          <div className="cp-row-2">
            <div className="cp-field">
              <span className="cp-label">Compensation (optional)</span>
              <div className="cp-comp">
                <input
                  className="cp-input"
                  name="compensation_amount"
                  value={form.compensation_amount}
                  onChange={(e) => setField('compensation_amount', e.target.value)}
                  placeholder="$20"
                  aria-label="Amount"
                />
                <input
                  className="cp-input"
                  name="compensation_frequency"
                  value={form.compensation_frequency}
                  onChange={(e) => setField('compensation_frequency', e.target.value)}
                  placeholder="/hour"
                  aria-label="Frequency"
                />
              </div>
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="listing-location">
                Location
              </label>
              <div className="cp-input-with-icon">
                <IconPin />
                <input
                  id="listing-location"
                  className="cp-input"
                  name="location"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Building, campus, or Remote"
                />
              </div>
            </div>
          </div>

          <fieldset className="cp-fieldset">
            <legend className="cp-label">Contact method</legend>
            <div className="cp-contact-grid">
              {CONTACT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={
                    form.contact_method === opt.id
                      ? 'cp-contact-card cp-contact-card--active'
                      : 'cp-contact-card'
                  }
                  onClick={() => setField('contact_method', opt.id)}
                >
                  <span className="cp-radio" aria-hidden />
                  <span className="cp-contact-card__title">{opt.label}</span>
                  <span className="cp-contact-card__hint">{opt.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* extra box only when they pick email or phone contact */}
          {(form.contact_method === 'email' || form.contact_method === 'phone') && (
            <div className="cp-field">
              <label className="cp-label" htmlFor="listing-contact-details">
                Contact details
              </label>
              <input
                id="listing-contact-details"
                className="cp-input"
                name="contact_details"
                value={form.contact_details}
                onChange={(e) => setField('contact_details', e.target.value)}
                placeholder={
                  form.contact_method === 'email' ? 'you@school.edu' : '(413) 555-0100'
                }
                autoComplete="off"
              />
            </div>
          )}

          <div className="cp-row-2">
            <div className="cp-field">
              <label className="cp-label" htmlFor="listing-expires">
                Expiration date (optional)
              </label>
              <input
                id="listing-expires"
                className="cp-input"
                type="date"
                name="expiration_date"
                value={form.expiration_date}
                onChange={(e) => setField('expiration_date', e.target.value)}
              />
            </div>
            <div className="cp-field">
              <label className="cp-label" htmlFor="listing-banner">
                Banner image URL (optional)
              </label>
              <input
                id="listing-banner"
                className="cp-input"
                name="banner_image_url"
                value={form.banner_image_url}
                onChange={(e) => setField('banner_image_url', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="cp-field">
            <label className="cp-label" htmlFor="listing-color">
              Custom accent color (optional)
            </label>
            <input
              id="listing-color"
              className="cp-input"
              name="custom_color"
              value={form.custom_color}
              onChange={(e) => setField('custom_color', e.target.value)}
              placeholder="#88302D or CSS color name"
            />
          </div>
        </div>

        <aside className="cp-aside">
          <section className="cp-card">
            <h3 className="cp-card__title">Preview</h3>
            <div className="cp-preview">
              <p className="cp-preview__title">
                {form.title.trim() || '(No title yet)'}
              </p>
              <p className="cp-preview__desc">
                {previewSnippet || 'Description will appear here…'}
              </p>
            </div>
          </section>

          <section className="cp-card">
            <h3 className="cp-card__title">Application settings</h3>
            <div className="cp-toggles">
              <ToggleRow
                id="req-profile"
                label="Require full profile"
                checked={form.require_full_profile}
                onChange={(v) => setField('require_full_profile', v)}
              />
              <ToggleRow
                id="email-notify"
                label="Email notifications"
                checked={form.email_notifications}
                onChange={(v) => setField('email_notifications', v)}
              />
              <ToggleRow
                id="auto-close"
                label="Auto-close applications"
                checked={form.auto_close_applications}
                onChange={(v) => setField('auto_close_applications', v)}
              />
            </div>
          </section>

          <section className="cp-card cp-card--tips">
            <h3 className="cp-card__title cp-card__title--tips">
              <IconLightbulb />
              Tips for great postings
            </h3>
            <ul className="cp-tips">
              <li>Use clear, descriptive titles</li>
              <li>Include specific requirements</li>
              <li>Add an engaging banner image</li>
              <li>Respond to applicants promptly</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
