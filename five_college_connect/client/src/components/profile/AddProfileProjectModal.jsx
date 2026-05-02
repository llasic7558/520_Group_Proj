import { useCallback, useEffect, useId, useState } from 'react'
import { createListing } from '../../lib/api.js'
import { logError, logInfo, logWarn } from '../../lib/logger.js'
import './AddProfileProjectModal.css'

function buildPortfolioListingPayload({
  title,
  description,
  banner_image_url,
  technologies,
}) {
  return {
    title: title.trim(),
    description: description.trim(),
    category: 'project',
    contact_method: 'profile',
    contact_details: '',
    banner_image_url: banner_image_url.trim() || null,
    custom_color: null,
    status: 'open',
    expiration_date: null,
    skills: technologies.map((name) => ({
      name,
      category: 'General',
      requirementType: 'required',
    })),
    attachments: [],
  }
}

export default function AddProfileProjectModal({ open, onClose, onCreated }) {
  const titleId = useId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [techDraft, setTechDraft] = useState('')
  const [technologies, setTechnologies] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = useCallback(() => {
    setTitle('')
    setDescription('')
    setImageUrl('')
    setTechDraft('')
    setTechnologies([])
    setErrorMessage('')
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const addTechnology = useCallback(() => {
    const next = techDraft.trim()
    if (!next) return
    setTechnologies((prev) =>
      prev.some((t) => t.toLowerCase() === next.toLowerCase())
        ? prev
        : [...prev, next],
    )
    setTechDraft('')
  }, [techDraft])

  const removeTechnology = useCallback((name) => {
    setTechnologies((prev) => prev.filter((t) => t !== name))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      logWarn('Add project blocked: title missing')
      setErrorMessage('Please enter a project title.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const listing = await createListing(
        buildPortfolioListingPayload({
          title,
          description,
          banner_image_url: imageUrl,
          technologies,
        }),
      )
      logInfo('Featured project created from profile', {
        listingId: listing?.listingId,
      })
      onCreated?.(listing)
      reset()
      onClose()
    } catch (err) {
      logError('Featured project create failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      setErrorMessage(err?.message || 'Could not add this project.')
    } finally {
      setIsSubmitting(false)
    }
  }, [description, imageUrl, onClose, onCreated, reset, technologies, title])

  if (!open) {
    return null
  }

  return (
    <div
      className="prof-proj-modal-root"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="prof-proj-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="prof-proj-modal__head">
          <h2 id={titleId} className="prof-proj-modal__title">
            Add featured project
          </h2>
          <button
            type="button"
            className="prof-proj-modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {errorMessage ? (
          <p className="prof-proj-modal__alert" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="prof-proj-modal__body">
          <label className="prof-proj-modal__label" htmlFor="prof-proj-title">
            Title
          </label>
          <input
            id="prof-proj-title"
            className="prof-proj-modal__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campus Event Finder"
            autoComplete="off"
          />

          <label
            className="prof-proj-modal__label"
            htmlFor="prof-proj-description"
          >
            Description
          </label>
          <textarea
            id="prof-proj-description"
            className="prof-proj-modal__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of what you built and why it matters."
            rows={4}
          />

          <label className="prof-proj-modal__label" htmlFor="prof-proj-image">
            Thumbnail image URL{' '}
            <span className="prof-proj-modal__optional">(optional)</span>
          </label>
          <input
            id="prof-proj-image"
            className="prof-proj-modal__input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            autoComplete="off"
          />

          <span className="prof-proj-modal__label">Technologies</span>
          <div className="prof-proj-modal__tech-row">
            <input
              className="prof-proj-modal__input"
              value={techDraft}
              onChange={(e) => setTechDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTechnology()
                }
              }}
              placeholder="e.g. React Native — press Enter"
              aria-label="Add technology"
            />
            <button
              type="button"
              className="prof-proj-modal__btn prof-proj-modal__btn--secondary"
              onClick={addTechnology}
            >
              Add
            </button>
          </div>
          {technologies.length > 0 ? (
            <ul className="prof-proj-modal__tags" aria-label="Technologies">
              {technologies.map((tag) => (
                <li key={tag} className="prof-proj-modal__tag">
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="prof-proj-modal__tag-remove"
                    onClick={() => removeTechnology(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="prof-proj-modal__foot">
          <button
            type="button"
            className="prof-proj-modal__btn prof-proj-modal__btn--ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="prof-proj-modal__btn prof-proj-modal__btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Add project'}
          </button>
        </div>
      </div>
    </div>
  )
}
