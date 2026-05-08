import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NotificationBell from '../NotificationBell.jsx'
import { useAuth } from '../../context/AuthContext.js'
import { resolveProfileImageUrl } from '../../lib/profileImageUrl.js'
import {
  IconPlus,
  IconSearch,
  LogoCap,
} from './Icons.jsx'

// top bar shared on feed + profile (search text changes per page)
export function TopNav({
  searchPlaceholder = 'Search opportunities...',
  searchValue,
  onSearchChange,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const avatarSrc = resolveProfileImageUrl(user?.profileImageUrl)
  const searchInputProps = onSearchChange
    ? {
        value: searchValue ?? '',
        onChange: onSearchChange,
      }
    : {}

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileMenuOpen])

  function handleLogout() {
    logout()
    setIsProfileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="fcc-topnav">
      <div className="fcc-topnav__left">
        <Link className="fcc-brand" to="/opportunities" aria-label="Five College Connect home">
          <LogoCap />
          <span className="fcc-brand__text">Five College Connect</span>
        </Link>
      </div>

      {/* center search is only visual until we wire elasticsearch or whatever */}
      <div className="fcc-topnav__search-wrap">
        <label className="fcc-search" htmlFor="opp-search">
          <span className="fcc-search__icon">
            <IconSearch />
          </span>
          <input
            id="opp-search"
            type="search"
            className="fcc-search__input"
            placeholder={searchPlaceholder}
            autoComplete="off"
            {...searchInputProps}
          />
        </label>
      </div>

      <div className="fcc-topnav__right">
        <Link to="/postings/new" className="fcc-btn fcc-btn--primary">
          <IconPlus />
          Create Posting
        </Link>
        <NotificationBell />
        <div className="fcc-profile-menu" ref={menuRef}>
          <button
            type="button"
            className="fcc-avatar"
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="fcc-avatar__img"
                decoding="async"
              />
            ) : (
              <span className="fcc-avatar__placeholder" />
            )}
          </button>
          {isProfileMenuOpen ? (
            <div className="fcc-profile-menu__panel" role="menu">
              <Link
                to="/profile"
                className="fcc-profile-menu__item"
                role="menuitem"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                View profile
              </Link>
              <button
                type="button"
                className="fcc-profile-menu__item fcc-profile-menu__item--danger"
                role="menuitem"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
